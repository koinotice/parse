if (!process.env.docker) {
    require('dotenv').config({
        path: __dirname + '/../server.env'
    });
}
const eachLimit = require('async/eachLimit')

 // process.env.PARSE_SERVER_URL = "http://71an.com:7311/app"
 // process.env.NAT_URL = "nats://71an.com:4222"
// process.env.REDIS_IO_URL="redis://:Zheli123@71an.com:7379"
//

const {
    NAT_URL,
    WALLET_MNEMONIC,
    RPC_URL,
    DEPLOYMENT_GAS_LIMIT,
    PROVIDER_URI
} = process.env;

const HDWalletProvider = require("truffle-hdwallet-provider")
const provider = new HDWalletProvider(WALLET_MNEMONIC, RPC_URL, 0, 10)

const logger = require('./lib/logger')("HashEvents")
const {client} = require('./lib/redis');

const Nats = require('nats').connect(NAT_URL);

const Web3 = require('web3');

const {address,hashabi} = require("./hashDice.json")
const Tcontract = require('truffle-contract');
const hashdice_artifact = require('./build/contracts/HashDice.json');
const {Parse} = require('./lib/parse');
const _ = require("lodash")

var fs = require('fs');


const Order = Parse.Object.extend("Order");


const web34 = new Web3( "wss://rinkeby.infura.io/ws" )


const instance = new web34.eth.Contract(hashabi, address);

instance.events.allEvents(  (error, event) => {
   // console.log(1,event);
}).on('data', (event) => {

    logger.info('Event %s params %s', event.event, JSON.stringify(event.returnValues));

    Nats.publish(address, JSON.stringify(event));
}).on('changed', (event) => {
    //console.log(3,event);
}).on('error', (error) => {
    logger.error(JSON.stringify(error));
});

async function reCheckOrder(number){

    const query = new Parse.Query(Order);

    query.lessThan("startBlock", number-20)
    query.equalTo('closed', false);
    const data = await query.find()

    _.forEach(data,function(order){
       // console.log(order.get("roomId"))

        Nats.publish("CloseBetOrders", JSON.stringify([order.get("roomId")]));
    })

    // const query1 = new Parse.Query(Order);
    //
    // query.lessThan("startBlock", number-20)
    // query.equalTo('closed', false);
    // const data = await query.find()
    //
    // _.forEach(data,function(order){
    //     // console.log(order.get("roomId"))
    //
    //     Nats.publish("CloseBetOrders", JSON.stringify([order.get("roomId")]));
    // })
    //
    //
    //
    // Nats.publish("orderBlock", JSON.stringify([event.returnValues.roomId.toString(10), event.returnValues.orderId.toString(10)]))



}


web34.eth.subscribe('newBlockHeaders', function (error, result) {
    if (!error) {
        return;
    }
    console.error(error);
}).on("data",async function (blockHeader) {
    let data = {
        number: blockHeader.number,
        hash: blockHeader.hash,
        gasLimit: blockHeader.gasLimit,
        parentHash: blockHeader.parentHash
    }

    await reCheckOrder(data.number)
    //Nats.publish("newBlock", JSON.stringify(data));

}).on("error",error=>{logger.error(JSON.stringify(error))} );
//
