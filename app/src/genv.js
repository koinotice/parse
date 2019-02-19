
require('dotenv').config({
    path: __dirname + '/../../parse.env'
});
const Web3 = require('web3');
const assert = require("assert")

const {address} = require("./hashDice.json")
const eachLimit = require('async/eachLimit')


const {sendRawTx} = require('./deploymentUtils');
const {web3, deploymentPrivateKey, RPC_URL} = require('./web3');
const {
    DEPLOYMENT_ACCOUNT_ADDRESS,
    WALLET_MNEMONIC
} = process.env;


const {Parse} = require('./lib/parse');

const Room = Parse.Object.extend("Room");
const Order = Parse.Object.extend("Order");


const contract = require('truffle-contract');

const hashdice_artifact = require('./build/contracts/HashDice.json');
const HashDice = contract(hashdice_artifact);

const {client} = require('./lib/redis');
const _ = require('lodash');




const HDWalletProvider = require("truffle-hdwallet-provider")

const provider1 = new HDWalletProvider(WALLET_MNEMONIC, RPC_URL, 0, 5)

HashDice.setProvider(new Web3(provider1).currentProvider);
const app = {};
app.hashdiceAddress = address;

console.log(app)

// 初始化配置信息
async function init() {

    //app.token = await TestToken.at(app.tokenAddress)
    app.hashdice = await HashDice.at(app.hashdiceAddress)


    //await updateBetOrder(142,2,2)
    //await updateRoom(139)
    //web3.eth.getAccounts((err, accounts) => { app.accounts= accounts })
    //await getBetOrder(2,2,1)
    //events()
     //await CloseRound(149, 1)
}

init();

async function updateRoom(roomId) {
    let room = await app.hashdice.GetRoomInfo.call(roomId);

    const roomInfo = {
        id: roomId,
        creator: room[0],
        erc20Addr: room[1],
        symbol: room[2],
        name: room[3],
        nominator: room[4].toString(10),
        denominator: room[5].toString(10),
        round: parseInt(room[6].toString(10)),
        active: room[7],
        roundActive: room[8],
        currentMaxCompensate: room[9].toString(10),
        lastLockedValue: room[10].toString(10),
    }
    console.log("room update")
    client.hset("room", roomId, (roomInfo));
    client.hset(roomInfo.creator.toLowerCase() + "_room", roomId, (roomInfo));
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
    console.log("parse", "update room " + roomId)

    //console.log(b.get("cc"))

    //0x1560cB7d3a6fcA7b969BEBB70d7b8dF9221D94a6_room


}


async function getBetOrder(roomId, roundId, orderId) {
    let order = await app.hashdice.GetBetOrder.call(roomId, roundId, orderId);

    const orderInfo = {
        owner: order[0],
        totalValue: order[1].toString(10),
        gain: order[2].toString(10),
        betType: "0x" + order[3].toString(16),
        betValue: order[4].toString(10),
        betTailInfo: order[5].toString(10)
    }


    client.set("order_" + roomId + "_" + roundId + "_" + id, JSON.stringify(orderInfo));

    //本期我的投注
    client.hset(order[0].toLowerCase() + "_" + roomId + "_" + roundId, orderId, JSON.stringify(orderInfo));
    //本期所有投注
    client.hset("order_" + room + "_" + roundId, orderId, JSON.stringify(orderInfo));

    try {

        const room = new Parse.Query(Room);

        room.equalTo('roomId', parseInt(roomId));
        const roomInfo = await room.first()

        console.info(roomInfo.get("name"))
        var query = new Parse.Query(Order);
        query.equalTo('roomId', parseInt(roomId));
        query.equalTo('roundId', parseInt(roundId));
        query.equalTo('orderId', parseInt(orderId));
        let order = await query.first()

        if (order == undefined) {

            order = new Order();
        }

        order.set("roomId", parseInt(roomId))
        order.set("roundId", parseInt(roundId))
        order.set("orderId", parseInt(orderId))
        order.set("roomName", roomInfo.get("name"))
        order.set(orderInfo)
        await order.save()


    } catch (e) {
        console.log(e)
    }

}

async function CloseRound(room, round) {


    console.log("CloseRound")

    let homeNonce = await web3.eth.getTransactionCount(DEPLOYMENT_ACCOUNT_ADDRESS);
    console.log('nonce ' + homeNonce)

    const HashContract =new web3.eth.Contract(hashdice_artifact.abi,app.hashdiceAddress);

    //
    try {
        // let nominator = [4, 4, 5, 14];
        // let denominator = [16, 16, 16, 16];
        // await hashdice.OpenRoom(token.address, "FIXED", 100000,
        //     "Hello world 1", nominator, denominator,
        //

       let encodedData = await HashContract.methods.CloseRound(room, round).encodeABI({from: DEPLOYMENT_ACCOUNT_ADDRESS})
       // let encodedData = await HashContract.methods.OpenRoom("0x564E021D1eC3a1686c5337722864977F9beEf83a",  "FIXED", 100000,
       //      "Hello world 1", nominator, denominator).encodeABI({from: DEPLOYMENT_ACCOUNT_ADDRESS})

        let gas = await web3.eth.estimateGas({
            from: DEPLOYMENT_ACCOUNT_ADDRESS,
            data: encodedData,
            to: app.hashdiceAddress
        })


        console.log('gas', gas)


        console.log('nonce ' +  homeNonce)
        try {

            const txUpgradeToBridgeVHome = await sendRawTx({
                data: encodedData,
                nonce:  homeNonce,
                to: app.hashdiceAddress,
                privateKey: deploymentPrivateKey,
                url: RPC_URL
            })

            assert.equal(txUpgradeToBridgeVHome.status, '0x1', 'Transaction Failed');
             homeNonce++
        } catch (e) {
            console.log(e)
        }

    } catch (e) {
        console.log("genv")
        console.error(e)
    }


}




const web34 = new Web3(new Web3.providers.WebsocketProvider("wss://rinkeby.infura.io/ws"))
//const web3 = new Web3(new Web3.providers.WebsocketProvider("ws://127.0.0.1:9546"))
const contractJson = require('./build/contracts/HashDice.json');


const instance = new web34.eth.Contract(contractJson.abi, app.hashdiceAddress);


//监听区块高度，去开奖
var subscription = web34.eth.subscribe('newBlockHeaders', function (error, result) {
    if (!error) {
        return;
    }

    console.error(error);
}).on("data", function (blockHeader) {
    let data = {
        number: blockHeader.number,
        hash: blockHeader.hash,
        gasLimit: blockHeader.gasLimit,
        parentHash: blockHeader.parentHash
    }
    //client.set(data.number, JSON.stringify(data));
    console.log(data)

    client.get(data.number, async (err, reply) => {
        if (reply != null) {
            let data = JSON.parse(reply)

            eachLimit(data, 1, async (n) => {
                await CloseRound.apply(this, n)
                console.log(n)
            }, function (error) {

                if (error) {
                    console.log(error)
                } else {
                    console.log("ok")
                }
            })

        }

    });
    // let roundInfo = client.get(34234)
    //
    //  console.log(roundInfo)
    // if (roundInfo) {
    //     let info = JSON.parse(roundInfo)
    //     console.log(info)
    //
    // }


}).on("error", console.error);

// instance.events.allEvents(
//     (errors, events) => {
//         if (!errors) {
//             console.log(events)
//         }
//         console.log(errors)
//     }
// );


//房间开房
instance.events.RoomOpened(async (err, events) => {

    let ev = events.returnValues;


    const room = new Room();

    room.set("roomId", parseInt(ev.id));
    await room.save()
    await updateRoom(ev.id)
    console.log("RoomOpened")


})

//房间开局
instance.events.RoundOpened(async (err, events) => {

    let ev = events.returnValues;

    let roundInfo = {
        roomId: ev.roomId,
        roundId: ev.roundId,
        startBlock: ev.startBlock,
        lockedValue: ev.lockedValue,
        timeStamp: ev.timeStamp

    }
    client.set("round_" + roundInfo.roomId + "_" + roundInfo.roundId, JSON.stringify(roundInfo));

    const blockHeight = parseInt(roundInfo.startBlock) + 10
    client.get(blockHeight, async (err, reply) => {
        let data
        if (reply != null) {
            data = JSON.parse(reply)
        } else {
            data = []
        }
        data.push([ev.roomId, ev.roundId])
        client.set(blockHeight, JSON.stringify(data))
    });

    await updateRoom(ev.roomId)

    console.log("RoundOpened")


})

//房间开奖事件

instance.events.RoundClosed(async (err, events) => {
    let ev = events.returnValues;
    let roundInfo = {
        roomId: ev.roomId,
        roundId: ev.roundId,
        totalBetValue: ev.totalBetValue,
        compensate: ev.compensate,
        orderNum: ev.orderNum

    }


    client.set("round_" + roundInfo.roomId + "_" + roundInfo.roundId, JSON.stringify(roundInfo));
    await updateRoom(ev.roomId)
    await updateBetOrder(parseInt(ev.roomId), parseInt(ev.roundId), parseInt(ev.orderNum))
    console.log("RoundClosed")


})

//房间下注
instance.events.NewBetOrder(async (err, events) => {

    let ev = events.returnValues;
    console.log(ev)
    let betOrder = {
        id: ev.id,
        roomId: ev.roomId,
        roundId: ev.roundId,
        orderId: ev.orderId,
        value: ev.value
    }


    console.log("NewBetOrder")

    await getBetOrder(ev.roomId, ev.roundId, ev.orderId)

    console.log("NewBetOrder")

})


//房间提现
instance.events.Withdrawed(async (err, events) => {

    let ev = events.returnValues;
    await updateRoom(ev.roomId)
    console.log("Withdrawed")
})
//房间提现
instance.events.Deposited(async (err, events) => {

    let ev = events.returnValues;
    await updateRoom(ev.roomId)
    console.log("Deposited")
})


//房间解散
instance.events.RoomClosed(async (err, events) => {

    let ev = events.returnValues;
    await updateRoom(ev.roomId)
    console.log("Deposited")
})


//投注收益
instance.events.PayBetOwner(async (err, events) => {

    let ev = events.returnValues;

    console.log("paybet")
    console.log(ev)
    try {
        var query = new Parse.Query(Order);
        query.equalTo('roomId', parseInt(ev.roomId));
        query.equalTo('roundId', parseInt(ev.roundId));
        query.equalTo('orderId', parseInt(ev.orderId));
        const r = await query.first()
        r.set("value", ev.value)
        await r.save()
    } catch (e) {
        console.log(e)
    }
})


//更新订单信息

async function updateBetOrder(room, round, orderNum) {
    //let order = await app.hashdice.GetBetOrder.call(room,round,id);
    var data = Array.from(new Array(orderNum), (val, index) => index + 1);

    console.log(data)
    eachLimit(data, 1, async (n) => {
        await getBetOrder(room, round, n)
        console.log(n)
    }, function (error) {

        if (error) {
            console.log(error)
        } else {
            console.log("ok")
        }
    })
}
