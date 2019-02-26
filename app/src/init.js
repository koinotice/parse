if (!process.env.docker) {
    require('dotenv').config({
        path: __dirname + '/../server.env'
    });
}

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
    await hashInit.ordersInit();
    //await Nats.publish("reset", "roomsInit")
    // eachLimit(["roomsInit","ordersInit","parseToken","syncBlockInfo"],1,async function(n){
    //     await Nats.publish("reset", n)
    // })



    // Nats.publish("orderBlock", JSON.stringify([1,1]))
    // Nats.publish("orderBlock", JSON.stringify([1,1]))



}

main()