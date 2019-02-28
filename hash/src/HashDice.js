const _ = require('lodash');
const logger = require('./lib/logger')("HashDice")

const Web3 = require('web3');

const {client} = require('./lib/redis');
const {Parse} = require('./lib/parse');
const {getAmount} = require('./lib/format');
const eachLimit = require('async/eachLimit')

const Room = Parse.Object.extend("Room");
const Order = Parse.Object.extend("Order");
const Token = Parse.Object.extend("Token")


const {
    NAT_URL,
    WALLET_MNEMONIC,
    PROVIDER_URI,
    RPC_URL
} = process.env;
const Nats = require('nats').connect(NAT_URL);
const {address} = require("./hashDice.json")
const HDWalletProvider = require("truffle-hdwallet-provider")
const provider = new HDWalletProvider(WALLET_MNEMONIC, RPC_URL, 0, 5)
const Tcontract = require('truffle-contract');
const hashdice_artifact = require('./build/contracts/HashDice.json');
const web3 = new Web3(PROVIDER_URI);


class HashDice {
    constructor() {
        this.contract = ""
        this.RoundPeriod = 10
    }

    async init() {

        const that = this


        const contract = Tcontract(hashdice_artifact);

        contract.setProvider(new Web3(provider).currentProvider);
        that.contract = await contract.at(address)

        const RoundPeriod = await this.contract.GetRoundPeriod.call();
        this.RoundPeriod = RoundPeriod.toNumber()
        //console.log("RoundPeriod",this.RoundPeriod)

        //console.log(that.contract)
        Nats.subscribe(address, function (data) {
            const ev = JSON.parse(data)
            logger.info('Event %s params %s', ev.event, JSON.stringify(ev.returnValues));

            try {
                that[ev.event](ev.returnValues)
            } catch (e) {
                console.log(e)
            }
            //nats.publish("foo", i++ + "")
        })

        logger.info("HashDice init finish  ")
    }

    async updateRoom(roomId) {
        let room = await this.contract.GetRoomInfo.call(roomId);
        logger.info(JSON.stringify(room))
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
        // logger.info("room update")
        // client.hset("room", roomId, (roomInfo));
        // client.hset(roomInfo.creator.toLowerCase() + "_room", roomId, (roomInfo));
        client.set("room_" + roomInfo.name, 1)
        try {


            var query = new Parse.Query(Room);
            query.equalTo('roomId', parseInt(roomId));
            let room = await query.first()

            if (room == undefined) {
                room = new Room();

                var queryToken = new Parse.Query(Token)
                queryToken.equalTo('address', roomInfo.erc20Addr);
                let token = await queryToken.first()
                room.set("token", token);

            }
            var queryToken = new Parse.Query(Token)
            queryToken.equalTo('address', roomInfo.erc20Addr);
            let token = await queryToken.first()
            room.set("token", token);

            room.set(roomInfo)
            const messages = await room.save()
            Nats.publish('event.hash.rooms.change', JSON.stringify({message: JSON.stringify(messages.toJSON())}));

        } catch (e) {
            console.log(e)
        }


        // Nats.publish('event.hash.rooms.change', JSON.stringify({message: roomInfo}));
        logger.info("Room update room %s ", roomId)

    }

    async updateToken(roomId) {

        try {

            var query = new Parse.Query(Room);
            query.equalTo('roomId', parseInt(roomId));
            query.include("token");
            let room = await query.first()
            const token = room.get("token");
            token.increment("count")
            const messages = await token.save()
            logger.info("Token update count %s", JSON.stringify(room.get("token").toJSON()))
            Nats.publish('event.hash.tokens.change', JSON.stringify({message: JSON.stringify(messages.toJSON())}));
        } catch (e) {
            logger.error(e)
        }

    }


    //更新订单数据
    async updateBetOrder(roomId, orderId) {
        let order = await this.contract.GetBetOrder.call(roomId, orderId);
        // return (order.owner, order.startBlock, order.totalValue, order.gain, order.betType,
        //     order.closed, order.betValue);

        // console.log(order[3].toString(10),parseInt(order[3].toString(10)))
        // return
        const orderInfo = {
            owner: order[0].toLowerCase(),
            startBlock: order[1].toNumber(),

            //gain: parseInt(order[3].toString(10)),
            gains: order[3].toString(10),
            betType: "0x" + order[4].toString(16),
            closed: order[5],
            betValue: order[6].toString(10)
        }
        const gain = order[3].toString(10)
        const totalValue = order[2].toString(10)

        const blockHeight = parseInt(order[1].toNumber()) + parseInt(this.RoundPeriod)

        await client.sadd(blockHeight, roomId)
        await client.sadd("order:" + (blockHeight + 1), roomId + "_" + orderId)

        //console.log(orderInfo)
        try {
            await this.updateRoom(roomId)
            var query = new Parse.Query(Order);
            query.equalTo('roomId', parseInt(roomId));

            query.equalTo('orderId', parseInt(orderId));
            let order = await query.first()

            if (order == undefined) {

                order = new Order();
                order.set("status", 0)

            }

            const room = new Parse.Query(Room);

            room.equalTo('roomId', parseInt(roomId));
            room.include("token")
            const roomInfo = await room.first()
            order.set("roomId", parseInt(roomId))
            order.set("orderId", parseInt(orderId))
            order.set("roomName", roomInfo.get("name"))
            order.set("token", roomInfo.get("token"))

 

            order.set("gain", Number(getAmount(gain, roomInfo.get("token").get("digits"))))
            order.set("totalValue", Number(getAmount(totalValue, roomInfo.get("token").get("digits"))))
            order.set(orderInfo)

            const messages = await order.save()
            Nats.publish('event.hash.orders.change', JSON.stringify({message: JSON.stringify(messages.toJSON())}));

        } catch (e) {
            console.log(e)
            logger.error(JSON.stringify(e));
        }

    }


    async RoomOpened(ev) {
        logger.info('RoomOpened ');

        await this.updateRoom(ev.id)

        await this.updateToken(ev.id)

    }

    async CloseBetOrders(ev) {
        logger.info('CloseBetOrders ');
        await this.updateRoom(ev.roomId)
    }

    async blockInfo() {

        const block = await web3.eth.getBlock(3912804)

        var data = Array.from(new Array(55), (val, index) => {
            return 4444 + index
        });
        //.then(console.log);
        console.log(block)
    }


    async NewBetOrder(ev) {
        logger.info('NewBetOrder ');
        await this.updateBetOrder(ev.roomId, ev.orderId)
    }

    async Deposited(ev) {
        logger.info('Deposited ');
        await this.updateRoom(ev.roomId)
    }

    async Withdrawed(ev) {
        logger.info('Withdrawed ');
        await this.updateRoom(ev.roomId)
    }

    async RoomClosed(ev) {
        logger.info('RoomClosed ');
        await this.updateRoom(ev.roomId)
        console.log("Deposited")
    }

    async PayBetOwner(ev) {
        logger.info('PayBetOwner ');
        await this.updateBetOrder(ev.roomId, ev.orderId)
        await this.UpdateOrderStatus(ev.roomId, ev.orderId, 1)

    }

    async CloseRoundTooLate(ev) {
        logger.info('CloseRoundTooLate roomId %s,orderId %s', ev.roomId, ev.orderId);
        //await this.updateBetOrder(ev.roomId,  ev.orderId)
        await this.UpdateOrderStatus(ev.roomId, ev.orderId, 3)

    }

    /*
    status  1,中奖;2,未中奖，3,退回
     */
    async UpdateOrderStatus(roomId, orderId, status) {
        var query = new Parse.Query(Order);
        query.equalTo('roomId', parseInt(roomId));

        query.equalTo('orderId', parseInt(orderId));
        let order = await query.first()
        order.set("status", status)
        await order.save();
        logger.info("UpdateOrderStatus roomId %s,orderId %s,status %s", roomId, orderId, status)

    }


}


module.exports = HashDice


