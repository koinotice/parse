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

async function main() {


    //开奖任务
    const hashInit = new HashInit();
    //Nats.publish("reset", "ordersInit")
    await hashInit.start();
   // await hashInit.ordersInit();
    //["roomsInit","ordersInit","parseToken","syncBlockInfo"]

   // await Nats.publish("reset", "ordersInit")

    // Nats.publish("orderBlock", JSON.stringify([1,1]))
    // Nats.publish("orderBlock", JSON.stringify([1,1]))



}

main()