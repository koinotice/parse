if (!process.env.docker) {
    require('dotenv').config({
        path: __dirname + '/../server.env'
    });
}

//const ZeroClientProvider = require('web3-provider-engine/zero')

//const BotFactory = require("./BotFactory")
//const HashDice = require("./HashDice")
const HashTask = require("./HashTask")
//const App = require("./server")

async function main() {


    //事件监控
    const hashTask = new HashTask();
    await hashTask.init()
    await hashTask.test()

}

main()