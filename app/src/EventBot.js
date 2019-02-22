const {Contract, Block} = require("./Models")
const Web3 = require('web3')
const ZeroClientProvider = require('web3-provider-engine/zero')
const nats = require('nats').connect(process.env.NAT_URL);

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
            console.error('WS Infura Error', e);
        });

        provider.on('end', e => {
            console.log('WS closed');
            console.log('Attempting to reconnect...');
            provider = new Web3.providers.WebsocketProvider(process.env.PROVIDER_URI);
            provider.on('connect', function () {
                console.log('WSS Reconnected');
            });
            that.web3.setProvider(provider);
            that.start();
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
             //console.log(event)
        }))
    }

    /** Entry Point
     */
    async start() {
        await this._init()
        await this.roomsInit()
        await this.ordersInit()
        // start cycle
        this.checkForEvents()
        // run on a cycle to keep alive
        this.fetchEventsCycle()
        this.running = true
        this.cycle_stop = false
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

    async updateWebhooks(eventWebhooks) {
        // set new webhook callbacks
        this.eventWebhooks = eventWebhooks
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
        console.log(lastBlock)
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
            await Contract.update({address: this.contractAddress}, {$set: {lastBlock: lastBlock}}, {})


            //this.lastBlock = lastBlock
        }
    }


}

module.exports = EventForwarder
