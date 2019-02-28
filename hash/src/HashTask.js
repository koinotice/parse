const _ = require('lodash');
const logger = require('./lib/logger')("HashTask")
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
const Order = Parse.Object.extend("Order")
const web3 = new Web3(PROVIDER_URI);

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
        logger.info("HashTask init")


        Nats.subscribe("orderBlock", async function (data) {
            const ev = JSON.parse(data)
            logger.info('orderBlock %s ', JSON.stringify(data));

            try {
                await that.setOrderBlockInfo(ev)
            } catch (e) {
                console.log(e)
            }
            //nats.publish("foo", i++ + "")
        })
    }

    async BlockWatch(block) {
        const that = this;

        const blockNumber = Number.parseInt(block.number.toString('hex'), 16)
        const blockHash = `0x${block.hash.toString('hex')}`
        let data = {
            number: blockNumber,
            hash: blockHash
        }

        const blockObj = new Block();
        data.tail = blockHash.substring(blockHash.length - 1)

        blockObj.set(data);
        const messages = await blockObj.save()
        Nats.publish('event.hash.blocks.change', JSON.stringify({message: JSON.stringify(messages.toJSON())}));
        //  console.log(bc)

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
        client.smembers("order:" + data.number, async (err, reply) => {
            if (reply.length != 0) {
                eachLimit(reply, 1, async (n) => {
                    const dt=n.split("_")
                    await that.setOrderBlockInfo(dt)
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
        const account = accounts[getRandomInt(0, accounts.length)]
        console.log(accounts, account, DEPLOYMENT_GAS_LIMIT)

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
                logger.info("HashTask success blockNumber %s roomId %s", order.receipt.blockNumber + 2, roomId)
            } else {
                //如果操作失败，2个区块后重试
                await client.sadd(order.receipt.blockNumber + 2, roomId);
                logger.error("HashTask fail blockNumber %s roomId %s", order.receipt.blockNumber + 2, roomId)
            }
        }

    }

    async setOrderBlockInfo(dt) {
        console.log(dt)
        var query = new Parse.Query(Order);
        query.equalTo('roomId', parseInt(dt[0]));
        query.equalTo('orderId', parseInt(dt[1]));
        let order = await query.first()
        console.log(order)
        const blockInfo = await this.getOrderBlockInfo(order.get("startBlock"))
        logger.info("order block %s",JSON.stringify(blockInfo))

        order.set("block", blockInfo)
        await order.save()
    }

    async getOrderBlockInfo(height) {

        var data = Array.from(new Array(10), (val, index) => {
            return height + index
        });

        const bcs = []
        const promise = new Promise(function (resolve, reject) {
            eachLimit(data, 10, async function (height) {
                const block = await web3.eth.getBlock(height)
                const blockHash = block.hash
                let bc = {
                    number: block.number,
                    hash: blockHash

                }
                //console.log(height,bc)
                //const blockObj = new Block();
                bc.tail = blockHash.substring(blockHash.length - 1)
                bcs.push(bc)

            }, function (error) {

                if (error) {
                    reject(err);
                } else {
                    resolve(bcs);
                }
            })
        })

        return await promise;
    }




    async websocket() {

        const nats = Nats
        const room = {message: JSON.stringify([])}
        nats.subscribe('get.hash.rooms', function (req, reply) {
            nats.publish(reply, JSON.stringify({result: {model: room}}));
        });

        nats.subscribe('access.hash.rooms', (req, reply) => {
            nats.publish(reply, JSON.stringify({result: {get: true}}));
        });

        nats.publish('system.reset', JSON.stringify({resources: ['hash.>']}));

        logger.info("websocket rooms")


    }


}


module.exports = HashTask


