const _ = require('lodash');
const logger = require('./lib/logger')

const eachLimit = require('async/eachLimit')

require('dotenv').config({
    path: __dirname + '/../server.env'
});
const Web3 = require('web3');

const {
    NAT_URL,
    WALLET_MNEMONIC,
    RPC_URL,
    DEPLOYMENT_GAS_LIMIT
} = process.env;
const Nats = require('nats').connect(NAT_URL);
const {client} = require('./lib/redis');

const {address, hashabi} = require("./hashDice.json")


const HDWalletProvider = require("truffle-hdwallet-provider")


const provider = new HDWalletProvider(WALLET_MNEMONIC, RPC_URL, 0, 3)


const contract = require('truffle-contract');

const hashdice_artifact = require('./build/contracts/HashDice.json');


function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}
class HashTask {
    constructor() {
        this.contract = ""
        // this.init();
    }

    async init() {

        const that = this

        that.contract = contract(hashdice_artifact);
        that.contract.setProvider(new Web3(provider).currentProvider);
        that.hashContract = await that.contract.at(address)

        logger.info("HashTask", "init")


    }

    async BlockWatch(block) {
        const that = this;

// //
        const blockNumber = Number.parseInt(block.number.toString('hex'), 16)
        const blockHash = `0x${block.hash.toString('hex')}`
        let data = {
            number: blockNumber,
            hash: blockHash
        }
        //client.set(data.number, JSON.stringify(data));
        console.log(data)

        client.smembers(data.number, async (err, reply) => {
            if (reply.length != 0) {

                eachLimit(reply, 1, async (n) => {
                    await that.CloseBetOrders(n)


                }, function (error) {

                    if (error) {
                        console.log(error)
                    } else {
                        console.log("ok")
                    }
                })

            }

        });

    }


    async CloseBetOrders(roomId) {
        logger.info("CloseBetOrders roomId %s", roomId)
        //const hashContract = await that.contract.at(address)
        // console.log(provider)
        const accounts = provider.getAddresses()
        const account=accounts[getRandomInt(0,accounts.length)]
        console.log(accounts, account,DEPLOYMENT_GAS_LIMIT)

        const order = await this.hashContract.CloseBetOrders(roomId, {from: account, gas: DEPLOYMENT_GAS_LIMIT});


        if (order.receipt) {
            const event = {
                returnValues: {
                    roomId: roomId,
                },
                event: 'CloseBetOrders',
            }
            if (order.receipt.status == true) {
                await Nats.publish(address, JSON.stringify(event))
                logger.info("HashTask success blockNumber %s roomId %s", order.receipt.blockNumber + 2,roomId)
            } else {
                //如果操作失败，2个区块后重试
                await client.sadd(order.receipt.blockNumber + 2, roomId);
                logger.error("HashTask fail blockNumber %s roomId %s", order.receipt.blockNumber + 2,roomId)
            }
        }

        console.log("order close", order)


    }


}


module.exports = HashTask


