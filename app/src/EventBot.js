const {Contract} = require("./Models")
const Web3 = require('web3')
const nats = require('nats').connect(process.env.NAT_URL);
const logger = require('./lib/logger')("event")
const eachLimit = require('async/eachLimit')

const {Parse} = require('./lib/parse');

const Room = Parse.Object.extend("Room");
const Order = Parse.Object.extend("Order");
const Token = Parse.Object.extend("Token")


function ns(key, value) {
    const data = _.isObjectLike(value) ? JSON.stringify(value) : value;
    client.set('log', data)
    nats.publish('event.cache.' + key + '.change', JSON.stringify({data: data}));

}

/** This will watch for events that have not been processed yet and send a webhook
 */
class EventForwarder {
    constructor(
        contractAddress,
        contractABI
    ) {
        this.contractAddress = contractAddress
        this.contractABI = contractABI

        this.running = false
        this.cycleStop = false
        this.timer

        const that = this;

        var provider = new Web3.providers.WebsocketProvider(process.env.PROVIDER_URI);
        this.web3 = new Web3(provider);
        provider.on('error', e => {
            logger.error('WS Infura Error %s', e);
        });

        provider.on('end', e => {
            logger.log('WS closed');
            logger.log('Attempting to reconnect...');
            provider = new Web3.providers.WebsocketProvider(process.env.PROVIDER_URI);
            provider.on('connect', function () {
                logger.log('WSS Reconnected');
            });
            that.web3.setProvider(provider);
            //that.restart();
        });

        //this.web3Provider.start()
        // instantiate contract
        this.contractInstance = new this.web3.eth.Contract(this.contractABI, this.contractAddress)
        // last block checked
        this.lastBlock = 0
    }

    async _init() {
        // get last processed block
        const contractData = await Contract.findOne({address: this.contractAddress});

        this.lastBlock = contractData.lastBlock


    }

    async roomsInit() {
        const that = this
        const events = await this.contractInstance.getPastEvents(
            'RoomOpened',
            {
                fromBlock: 0,
                toBlock: "latest"
            }
        )

        await Promise.all(events.map(async event => {

            nats.publish(this.contractAddress, JSON.stringify(event));

        }))

    }

    async ordersInit() {
        const that = this
        const events = await this.contractInstance.getPastEvents(
            'NewBetOrder',
            {
                fromBlock: 0,
                toBlock: "latest"
            }
        )

        await Promise.all(events.map(async event => {
            nats.publish(this.contractAddress, JSON.stringify(event));
        }))
    }

    async parseToken() {
        const tokens = require("./tokens.json")

        var query = new Parse.Query(Token);


        eachLimit(tokens, 1, async function (token) {
            console.log(token.address.toLowerCase().trim())


            token.address = token.address.toLowerCase().trim()

            console.log(token)
            query.equalTo('address', token.address);
            let room = await query.first()
            console.log(token.address.trim(), room)

            if (room == undefined) {
                room = new Token();
            }
            token.hot = false
            token.count = 0
            room.set(token)
            await room.save()
        })

    }

    /** Entry Point
     */
    async start() {
        await this._init()
        //重置数据库
        await this.parseToken()
        await this.roomsInit()
        await this.ordersInit()

        // start cycle
        this.checkForEvents()
        // run on a cycle to keep alive
        this.fetchEventsCycle()
        this.running = true
        this.cycle_stop = false

        logger.info("EventBot start  ")

    }

    async restart() {
        logger.error("EventBot rpc restart")
        this.stop()
        this.checkForEvents()
        await this.fetchEventsCycle()
    }

    stop() {
        // will not stop child processes
        this.running = false
        this.cycle_stop = true
        clearTimeout(this.timer)
    }

    async fetchEventsCycle() {
        const that = this;
        this.timer = setTimeout(async () => {
            try {
                await this.checkForEvents()

                if (!this.cycle_stop) this.fetchEventsCycle()
            } catch (err) {
                console.error(err)
                that.running = false
            }
        }, 15 * 1000) // every 15 seconds check for new events
    }

    async checkForEvents() {
        const nextBlock = this.lastBlock + 1
        const lastBlock = await new Promise(
            (reject, resolve) =>
                this.web3.eth.getBlockNumber((result, err) => {
                    if (err) reject(err)
                    resolve(result)
                })
        )
        console.log(nextBlock, lastBlock)
        // check for new bid events
        if (nextBlock <= lastBlock) {

            const events = await this.contractInstance.getPastEvents(
                'allEvents',
                {
                    fromBlock: nextBlock,
                    toBlock: lastBlock
                }
            )

            await Promise.all(events.map(async event => {
                nats.publish(this.contractAddress, JSON.stringify(event));
            }))
            // await Contract.update({address: this.contractAddress}, {$set: {lastBlock: lastBlock}}, {})


            this.lastBlock = lastBlock
        }
    }


}

module.exports = EventForwarder
