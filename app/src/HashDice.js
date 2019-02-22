const _ = require('lodash');
const logger = require('./lib/logger')

const Web3 = require('web3');

const {client} = require('./lib/redis');
const {Parse} = require('./lib/parse');
const eachLimit = require('async/eachLimit')

const Room = Parse.Object.extend("Room");
const Order = Parse.Object.extend("Order");

const {
    NAT_URL,
    WALLET_MNEMONIC,
    RPC_URL
} = process.env;
const Nats = require('nats').connect(NAT_URL);

const {address, hashabi} = require("./hashDice.json")


const HDWalletProvider = require("truffle-hdwallet-provider")


const provider = new HDWalletProvider(WALLET_MNEMONIC, RPC_URL, 0, 5)

const Tcontract = require('truffle-contract');

const hashdice_artifact = require('./build/contracts/HashDice.json');

class HashDice {
    constructor() {
        this.contract = ""
        this.RoundPeriod=10
    }

    async init() {

        const that = this

        const contract = Tcontract(hashdice_artifact);

        contract.setProvider(new Web3(provider).currentProvider);
        that.contract =  await contract.at(address)

        const RoundPeriod = await this.contract.GetRoundPeriod.call();
        this.RoundPeriod=RoundPeriod.toNumber()
        //console.log("RoundPeriod",this.RoundPeriod)

        //console.log(that.contract)
        Nats.subscribe(address, function (data) {
            const ev = JSON.parse(data)
            logger.info('Event %s at %s', ev.event, new Date());
            logger.info('Event params %s  ', JSON.stringify(ev.returnValues ));

            try {
                that[ev.event](ev.returnValues)
            } catch (e) {
                console.log(e)
            }
            //nats.publish("foo", i++ + "")
        })

        logger.info("HashDice init finish  " )
    }

    async updateRoom(roomId) {
        let room = await this.contract.GetRoomInfo.call(roomId);

        const roomInfo = {
            id: roomId,
            creator: room[0].toLowerCase(),
            erc20Addr: room[1],
            symbol: room[2],
            name: room[3],
            nominator: room[4].toString(10),
            denominator: room[5].toString(10),
            active: room[6],
            currentOrderId:room[7],
            lastClosedOrderId:room[8],
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
                room.set("roomId", parseInt(roomId));
            }
            delete roomInfo.id
            room.set(roomInfo)
            await room.save()

        } catch (e) {
            console.log(e)
        }
        logger.info("Room update room %s " ,roomId)

    }

    async updateBetOrder(room, round, orderNum) {
        //let order = await app.hashdice.GetBetOrder.call(room,round,id);
        var data = Array.from(new Array(orderNum), (val, index) => index + 1);

        const that = this;
        eachLimit(data, 1, async (n) => {
            await that.getBetOrder(room, round, n)
            console.log(n)
        }, function (error) {

            if (error) {
                console.log(error)
            } else {
                console.log("ok")
            }
        })
    }


    async getBetOrder(roomId, orderId) {
        let order = await this.contract.GetBetOrder.call(roomId, orderId);
        // return (order.owner, order.startBlock, order.totalValue, order.gain, order.betType,
        //     order.closed, order.betValue);
        const orderInfo = {
            owner: order[0],
            startBlock:order[1].toNumber(),
            totalValue: order[2].toString(10),
            gain: order[3].toString(10),
            betType: "0x" + order[4].toString(16),
            closed: order[5],
            betValue: order[6].toString(10)
        }

        const blockHeight = parseInt(order[1].toNumber()) + parseInt(this.RoundPeriod)

        await client.sadd(blockHeight, roomId)

        //console.log(orderInfo)
        try {
            await this.updateRoom(roomId)
            var query = new Parse.Query(Order);
            query.equalTo('roomId', parseInt(roomId));

            query.equalTo('orderId', parseInt(orderId));
            let order = await query.first()

            if (order == undefined) {

                order = new Order();
                const room = new Parse.Query(Room);

                room.equalTo('roomId', parseInt(roomId));
                const roomInfo = await room.first()
                order.set("roomId", parseInt(roomId))
                order.set("orderId", parseInt(orderId))
                order.set("roomName", roomInfo.get("name"))

            }
            order.set(orderInfo)
            await order.save()


        } catch (e) {
            console.log(e)
        }

    }


    async RoomOpened(ev) {
        logger.info('RoomOpened at %s', new Date());

        await this.updateRoom(ev.id)

    }
    async CloseBetOrders(ev) {
        logger.info('CloseBetOrders at %s', new Date());
        await this.updateRoom(ev.roomId)
    }


    async NewBetOrder(ev) {
        logger.info('NewBetOrder at %s', new Date());
        await this.getBetOrder(ev.roomId,  ev.orderId)
    }

    async Deposited(ev) {
        logger.info('Deposited at %s', new Date());
        await this.updateRoom(ev.roomId)
    }

    async Withdrawed(ev) {
        logger.info('Withdrawed at %s', new Date());
        await this.updateRoom(ev.roomId)
    }

    async RoomClosed(ev) {
        logger.info('RoomClosed at %s', new Date());
        await this.updateRoom(ev.roomId)
        console.log("Deposited")
    }

    async PayBetOwner(ev) {
        logger.info('PayBetOwner at %s', new Date());
        await this.getBetOrder(ev.roomId,  ev.orderId)

    }

}


module.exports = HashDice


