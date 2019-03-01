const _ = require('lodash');
const logger = require('./lib/logger')("HashInit")
const eachLimit = require('async/eachLimit')
const Web3 = require('web3');
const {
    NAT_URL,
    WALLET_MNEMONIC,
    RPC_URL,
    DEPLOYMENT_GAS_LIMIT,
    PROVIDER_URI,
    DB_HOST
} = process.env;
const Nats = require('nats').connect(NAT_URL);
const {client} = require('./lib/redis');
const fs = require('fs');
//const mongoose = require('mongoose');
const {address,contractHeight} = require("./hashDice.json")
const HDWalletProvider = require("truffle-hdwallet-provider")
const provider = new HDWalletProvider(WALLET_MNEMONIC, RPC_URL, 0, 3)
const contract = require('truffle-contract');
const hashdice_artifact = require('./build/contracts/HashDice.json');

const {Parse} = require('./lib/parse');

const Block = Parse.Object.extend("Block")
const Token = Parse.Object.extend("Token")
const Order = Parse.Object.extend("Order")

const web3 = new Web3(PROVIDER_URI);

const callback=(err,data)=>{
    console.log(err,data)
}
class HashInit {
    constructor() {
        this.contract = ""
        logger.info("Init start")
        const that=this;
        Nats.subscribe("reset", async function (cmd) {
            //logger.info("System reset %s ", cmd)
            const cmds = ["roomsInit", "ordersInit", "parseToken", "syncBlockInfo","ordersModify","CountTokenRoom","DataBaseReset"]

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
    async DataBaseReset(){

        /* Connect to the DB */
        // mongoose.connect("mongodb://"+DB_HOST+"/parse_pmker",function(){
        //     /* Drop the DB */
        //     mongoose.connection.db.dropDatabase();
        // });
        //  callback(null, 'db drop ');



    }
    //重新计数房间数据
    async  CountTokenRoom() {
        const that = this
        const query = new Parse.Query("Room");
        query.equalTo('active', true);
        query.include("token")

        const data = await query.find()
        const dc = []
        data.forEach(function (n) {
            dc.push({token:n.get("token"),id:n.get("token").id})
        })

        const groups = _.groupBy(dc, "id")
        _.map(groups, async function (tokens,id) {
            var queryToken = new Parse.Query("Token");
            const token=await queryToken.get(id)
            token.set("count",tokens.length)
            let ret=await token.save()

        })

        callback(null, 'token count rooms ');


    }
    //重新更新房间信息
    async roomsInit() {
        const that = this
        logger.info("System reset Rooms start")
        const events = await that.hashContract.getPastEvents(
            'RoomOpened',
            {
                fromBlock: contractHeight,
                toBlock: "latest"
            }
        )

        await Promise.all(events.map(async event => {

            Nats.publish(address, JSON.stringify(event));

        }))
        logger.info("System reset Rooms Success")
        callback(null, 'rooms init');

    }
    //初始化订单信息
    async ordersInit() {
        const that = this
        logger.info("System reset Orders start")

        const events = await this.hashContract.getPastEvents(
            'NewBetOrder',
            {
                fromBlock: contractHeight,
                toBlock: "latest"
            }
        )

        await Promise.all(events.map(async event => {
            Nats.publish(address, JSON.stringify(event));

            Nats.publish("orderBlock", JSON.stringify([event.returnValues.roomId.toString(10), event.returnValues.orderId.toString(10)]))
        }))

        logger.info("System reset Orders Success")
        callback(null, 'orders init');

    }
    //更新所有订单区块信息
    async ordersModify() {
        const that = this
        logger.info("System reset Orders modify start")

        var query = new Parse.Query(Order);
        query.doesNotExist('block' );
        let orders = await query.find()

        console.log(orders)
        await Promise.all(orders.map(async event => {
            Nats.publish("orderBlock", JSON.stringify([event.get("roomId"),event.get("orderId")]))
        }))

        logger.info("System reset Orders Success")

    }
    //初始化币信息
    async   parseToken() {

        const that = this

        const coinsItem = await
            fs.promises.readdir(__dirname+"/../public/logo")
        var tokens = require(__dirname+"/tokens.json")

        var i = 0;
        const coins = []
        coinsItem.forEach(item => {
            let coin = {
                "symbol": item.replace(".png", ""),
                "name": item.replace(".png", "") + " Token",
                "digits": 18,
                "address": "0x37f44cabc8fc42efff4ca8e62f230f84afdf86cb",
                "logo": "http://47.244.53.52:7300/logo/" + item,
                "step": 10
            }
            if (i < 6) {
                coin.symbol = tokens[i].symbol

                coin.digits = tokens[i].digits
                coin.address = tokens[i].address.toLocaleLowerCase()
            }

            coin.hot = false;
            coin.count = 0
            console.log(coin)
            coins.push(new Token(coin))
            i++

        })
        await Parse.Object.saveAll(coins.slice(0, 16))
        logger.info("Tokens init  Success")

    }
    //同步所有区块信息
    async syncBlockInfo() {
        const lastBlock = await web3.eth.getBlockNumber()

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


