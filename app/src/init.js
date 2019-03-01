if (!process.env.docker) {
    require('dotenv').config({
        path: __dirname + '/../server.env'
    });
}

// process.env.PARSE_SERVER_URL = "http://71an.com:7311/app"
// process.env.NAT_URL = "nats://71an.com:4222"

const HashInit = require("./HashInit")
const {
    NAT_URL,

} = process.env;

const Nats = require('nats').connect(NAT_URL);
const eachLimit = require('async/eachLimit')

async function main() {


    //开奖任务
    const hashInit = new HashInit();
    //Nats.publish("reset", "ordersInit")
    await hashInit.start();
    ///await hashInit.ordersModify();
    //await Nats.publish("reset", "roomsInit")
    // eachLimit(["roomsInit","ordersInit","parseToken","syncBlockInfo"],1,async function(n){
    //     await Nats.publish("reset", n)
    // })



    // Nats.publish("orderBlock", JSON.stringify([1,1]))
    // Nats.publish("orderBlock", JSON.stringify([1,1]))



}

main()