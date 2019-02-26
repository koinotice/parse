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
    const hashTask = new HashInit();

    //["roomsInit","ordersInit","parseToken","syncBlockInfo"]

    Nats.publish("reset", "start")


}

main()