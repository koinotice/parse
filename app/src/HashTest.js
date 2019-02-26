const _ = require('lodash');
 const winston = require('winston')

const logger = winston.createLogger({
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});
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
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}


const {Parse} = require('./lib/parse');

const Room = Parse.Object.extend("Room");
const Order = Parse.Object.extend("Order");
const Token =Parse.Object.extend("Token")
const Block =Parse.Object.extend("Block")

const web3 = new Web3(PROVIDER_URI);

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
    }

    async BlockWatch(block) {
        const that = this;

        const blockNumber = Number.parseInt(block.number.toString('hex'), 16)
        const blockHash = `0x${block.hash.toString('hex')}`
        let data = {
            number: blockNumber,
            hash: blockHash
        }
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


    async test() {

        //const hashContract = await that.contract.at(address)
        // console.log(provider)
        const accounts = provider.getAddresses()
        const account = accounts[getRandomInt(0, accounts.length)]
        console.log(accounts, account, DEPLOYMENT_GAS_LIMIT)

        const order = await this.hashContract.SubmitBetOrder(1, 0, "0x1", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], {
            from: accounts[0],
            gas: DEPLOYMENT_GAS_LIMIT
        });


        console.log("order test", order)


    }
    async websocket(){

        const nats=Nats
        const room={ message: "" }
        nats.subscribe('get.hash.rooms', function(req, reply) {
            nats.publish(reply, JSON.stringify({ result: { model: room }}));
        });

// Access listener. Everyone gets read access and access to call the set-method
        nats.subscribe('access.hash.rooms', (req, reply) => {
            nats.publish(reply, JSON.stringify({ result: { get: true }}));
        });

        nats.publish('system.reset', JSON.stringify({ resources: [ 'hash.>' ]}));
       var i=0
        setInterval(function(){
            Nats.publish('event.hash.rooms.change', JSON.stringify({message: "asdfsdf"+i++}));

        },1000)


    }
    async parseToken(){
        const tokens=require("./tokens.json")

        var query = new Parse.Query(Token);

        
        eachLimit(tokens,1,async function(token){
            console.log(token.address.toLowerCase().trim())


            token.address=token.address.toLowerCase().trim()

            console.log(token)
            query.equalTo('address', token.address);
            let room = await query.first()
            console.log(token.address.trim(),room)

            if (room == undefined) {
                room = new Token();
            }
            token.hot=false
            token.count=0
            room.set(token)
            await room.save()
        })

    }

    async updateToken(roomId) {

        try {

            var query = new Parse.Query(Room);
            query.equalTo('roomId', parseInt(roomId));
            query.include("token");
            let room = await query.first()
            const token=room.get("token");
            token.increment("count")
            await token.save()
            logger.info("Token update count",JSON.stringify(room.get("token").toJSON()))
        } catch (e) {
            console.log(e)
        }
    }

    async updateRoom(roomId){

        let room = await this.hashContract.GetRoomInfo.call(roomId);
        console.log(room)

        const roomInfo = {
            roomId: parseInt(roomId),
            creator: room[0].toLowerCase(),
            erc20Addr: room[1].toLowerCase(),
            symbol: room[2],
            name: room[3],
            nominator: room[4].toString(10),
            denominator: room[5].toString(10),
            active: room[6],
            currentOrderId: room[7].toString(10),
            lastClosedOrderId: room[8].toString(10),
            currentMaxCompensate: room[9].toString(10),
            lastLockedValue: room[10].toString(10),
        }

        console.log(roomInfo)
    }
    async syncBlockInfo(){
        const lastBlock=await web3.eth.getBlockNumber()
        const contractHeight=3912804
        const diff=(lastBlock-contractHeight)

        var data = Array.from(new Array(diff), (val, index) => {
            return contractHeight+index
        });
        eachLimit(data,5,async function(height){
            const block=await web3.eth.getBlock(height)
            const blockHash=block.hash
            let bc = {
                number: block.number,
                hash: blockHash

            }
            console.log(bc)
            const blockObj = new Block();
            data.tail=blockHash.substring(blockHash.length-1)

            blockObj.set(bc);

            await blockObj.save()
        })
        //.then(console.log);

    }



}


module.exports = HashTask


