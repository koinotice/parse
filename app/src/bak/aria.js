if (!process.env.docker) {
    require('dotenv').config({
        path: __dirname + '/../server.env'
    });
}

//const ZeroClientProvider = require('web3-provider-engine/zero')

//const BotFactory = require("./BotFactory")
//const HashDice = require("./HashDice")
const Aria2 = require("./Aria2")
//const App = require("./server")

async function main() {


    //事件监控
    const aria2 = new Aria2();
    await aria2.init()
    await aria2.test()

}

main()