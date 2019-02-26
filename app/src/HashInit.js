const _ = require('lodash');
const logger = require('./lib/logger')("HashInit")
const eachLimit = require('async/eachLimit')
const Web3 = require('web3');
const {
    NAT_URL,
    WALLET_MNEMONIC,
    RPC_URL,
    DEPLOYMENT_GAS_LIMIT,
    PROVIDER_URI
} = process.env;
const Nats = require('nats').connect(NAT_URL);
const {client} = require('./lib/redis');

const {address} = require("./hashDice.json")
const HDWalletProvider = require("truffle-hdwallet-provider")
const provider = new HDWalletProvider(WALLET_MNEMONIC, RPC_URL, 0, 3)
const contract = require('truffle-contract');
const hashdice_artifact = require('./build/contracts/HashDice.json');

const {Parse} = require('./lib/parse');

const Block = Parse.Object.extend("Block")
const Token = Parse.Object.extend("Token")

const web3 = new Web3(PROVIDER_URI);


class HashInit {
    constructor() {
        this.contract = ""
        logger.info("Init start")
        const that = this
        Nats.subscribe("reset", async function (cmd) {
            logger.info("System reset %s ", cmd)
            const cmds = ["roomsInit", "ordersInit", "parseToken", "syncBlockInfo"]

            if (cmds.includes(cmd)) {
                await that[cmd]()
            }


        })

    }

    async start() {

        const that = this

        that.contract = contract(hashdice_artifact);
        that.contract.setProvider(new Web3(provider).currentProvider);
        that.hashContract = await that.contract.at(address)


    }

    async roomsInit() {
        const that = this
        logger.info("System reset Rooms start")
        const events = await this.hashContract.getPastEvents(
            'RoomOpened',
            {
                fromBlock: 0,
                toBlock: "latest"
            }
        )

        await Promise.all(events.map(async event => {

            Nats.publish(address, JSON.stringify(event));

        }))
        logger.info("System reset Rooms Success")

    }

    async ordersInit() {
        const that = this
        logger.info("System reset Orders start")

        const events = await this.hashContract.getPastEvents(
            'NewBetOrder',
            {
                fromBlock: 0,
                toBlock: "latest"
            }
        )

        await Promise.all(events.map(async event => {
            Nats.publish(address, JSON.stringify(event));
            Nats.publish("orderBlock", JSON.stringify([event.roomId, event.orderId]))
        }))

        logger.info("System reset Orders Success")

    }

    async parseToken() {

        logger.info("System reset Tokens start")

        const tokens = require("./tokens.json")

        var query = new Parse.Query(Token);


        eachLimit(tokens, 1, async function (token) {


            token.address = token.address.toLowerCase().trim()


            query.equalTo('address', token.address);
            let room = await query.first()


            if (room == undefined) {
                room = new Token();
            }
            token.hot = false
            token.count = 0
            room.set(token)
            await room.save()
        })

        logger.info("System reset Tokens Success")


    }

    async syncBlockInfo() {
        const lastBlock = await web3.eth.getBlockNumber()
        const contractHeight = 3912804
        const diff = (lastBlock - contractHeight)

        var data = Array.from(new Array(diff), (val, index) => {
            return contractHeight + index
        });
        eachLimit(data, 5, async function (height) {
            const block = await web3.eth.getBlock(height)
            const blockHash = block.hash
            let bc = {
                number: block.number,
                hash: blockHash

            }
            console.log(bc)
            const blockObj = new Block();
            data.tail = blockHash.substring(blockHash.length - 1)

            blockObj.set(bc);

            await blockObj.save()
        }, function (e) {
            if (e) {
                logger.error("System reset syncBlockInfo fail", JSON.stringify(e))
            } else {
                logger.info("System reset syncBlockInfo Success")
            }
        })


    }


}


module.exports = HashInit


