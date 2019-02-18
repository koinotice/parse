const Web3 = require('web3');
const assert = require("assert")
const HDWalletProvider = require("truffle-hdwallet-provider")
const fs = require("fs")
const {PROVIDER_URI, WALLET_MNEMONIC, GAS_PRICE, GAS_LIMIT,HASH_DICE_ADDRESS,REDIS_URL,REDIS_PORT} = require("./env.json")
const {address} = require("./hashDice.json")
const provider = new Web3.providers.HttpProvider("http://localhost:8545")
const provider1 = new HDWalletProvider(WALLET_MNEMONIC, PROVIDER_URI, 0, 5)

const eachLimit = require('async/eachLimit')
const ethUtil = require("ethereumjs-util")
const Big = require("bignumber.js")
const BN = require("bn.js")


const {Parse} = require('./lib/parse');

const Room = Parse.Object.extend("Room");
const Order = Parse.Object.extend("Order");


var web3 = new Web3(provider1);
const contract = require('truffle-contract');

const pelo_artifact = require('./build/contracts/PeloponnesianToken.json');
const testtoken_artifact = require('./build/contracts/TestToken.json');
const hashdice_artifact = require('./build/contracts/HashDice.json');
const TestToken = contract(testtoken_artifact);
const HashDice = contract(hashdice_artifact);

const {client} = require('./lib/redis');
const _ = require('lodash');
 

//TestToken.setProvider(web3.currentProvider);
HashDice.setProvider(web3.currentProvider);


const DECIMICAL = 10 ** 18;

const app = {};

//const store = require("./contract.json").store

app.hashdiceAddress = address;

console.log(app)
//app.tokenAddress = store.token;

async function updateRoom(id) {
    let room = await app.hashdice.GetRoomInfo.call(id);

    const roomInfo = {
        id: id,
        creator: room[0],
        erc20Addr: room[1],
        symbol: room[2],
        name: room[3],
        nominator: room[4].toString(10),
        denominator: room[5].toString(10),
        round: room[6].toString(10),
        active: room[7],
        roundActive: room[8],
        currentMaxCompensate: room[9].toString(10),
        lastLockedValue: room[10].toString(10),
    }
    console.log("room update")
    client.hset("room",id, (roomInfo));
    client.hset(roomInfo.creator.toLowerCase()+"_room",id,  (roomInfo));
    client.set("room_"+roomInfo.name,1)
    try{
        var query = new Parse.Query(Room);
        query.equalTo('roomid', parseInt(id));

        console.log(parseInt(id))
        const r=await query.first()
        console.log(r)
        r.set(roomInfo)
        await r.save()
    }catch (e) {
      console.log(e)
    }

    //console.log(b.get("cc"))

    //0x1560cB7d3a6fcA7b969BEBB70d7b8dF9221D94a6_room


}

async function getBetOrder(room,round,id) {
    let order = await app.hashdice.GetBetOrder.call(room,round,id);



    const orderInfo = {
        owner: order[0],
        totalValue: order[1].toString(10),
        gain: order[2].toString(10),
        betType: "0x"+order[3].toString(16),
        betValue: order[4].toString(10),
        betTailInfo: order[5].toString(10)
    }


    client.set("order_"+room+"_"+round+"_"+id, JSON.stringify(orderInfo));

    //本期我的投注
    client.hset(order[0].toLowerCase()+"_"+room+"_"+round,id, JSON.stringify(orderInfo));
    //本期所有投注
    client.hset("order_"+room+"_"+round,id, JSON.stringify(orderInfo));

    try {

        const o = new Order();


        o.set("roomId",parseInt(room))
        o.set("roundId",parseInt(round))
        o.set("orderId",parseInt(id))
        o.set(orderInfo)


        await o.save()

    }catch (e) {
        console.log(e)
    }

}

async function CloseRound(room,round) {


    console.log("close start")
    console.log(room,round)
    await app.hashdice.CloseRound(room, round, {from: app.accounts[2], gas: GAS_LIMIT});
    console.log("CloseRound")

    //console.log(a)


}

// 初始化配置信息
async function init() {

    //app.token = await TestToken.at(app.tokenAddress)
    app.hashdice = await HashDice.at(app.hashdiceAddress)
    web3.eth.getAccounts((err, accounts) => { app.accounts= accounts })
    //await getBetOrder(2,2,1)
    //events()
    // await CloseRound.apply(this,[5,1])
}

init();


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

    client.get(data.number, async (err, reply)=> {
        if(reply!=null){
            let data=JSON.parse(reply)

            eachLimit(data, 1, async (n) => {
                await CloseRound.apply(this,n)
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

    room.set("roomid", parseInt(ev.id));
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
        timeStamp:ev.timeStamp

    }
    client.set("round_" +roundInfo.roomId + "_" + roundInfo.roundId, JSON.stringify(roundInfo));

    const blockHeight=parseInt(roundInfo.startBlock) + 10
    client.get(blockHeight, async (err, reply)=> {
        let data
        if(reply!=null){
            data=JSON.parse(reply)
        }else{
            data=[]
        }
        data.push([ev.roomId,ev.roundId])
        client.set(blockHeight,JSON.stringify(data))
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
        orderNum:ev.orderNum

    }
    client.set("round_" +roundInfo.roomId + "_" + roundInfo.roundId, JSON.stringify(roundInfo));
    await updateRoom(ev.roomId)

    console.log("RoundClosed")


})

//房间下注
instance.events.NewBetOrder(async (err, events) => {

    let ev = events.returnValues;
    console.log(ev)
    let betOrder={
        id:ev.id,
        roomId: ev.roomId,
        roundId:ev.roundId,
        orderId: ev.orderId,
        value: ev.value
    }


    console.log("NewBetOrder")

    await getBetOrder(ev.roomId,ev.roundId,ev.orderId)

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
    try{
        var query = new Parse.Query(Room);
        query.equalTo('roomId', parseInt(ev.roomId));
        query.equalTo('roundId', parseInt(ev.roundId));
        query.equalTo('orderId', parseInt(ev.orderId));
        const r=await query.first()
        r.set("value",ev.value)
        await r.save()
    }catch (e) {
        console.log(e)
    }
})

