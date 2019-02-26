if (!process.env.docker) {
    require('dotenv').config({
        path: __dirname + '/../server.env'
    });
}

//const ZeroClientProvider = require('web3-provider-engine/zero')

//const BotFactory = require("./BotFactory")
//const HashDice = require("./HashDice")
const HashTask = require("./HashTest")
//const App = require("./server")
const App = require("./server")
// const logger = require('./lib/logger')("HashApp")
//
// async function main() {
//     const PORT = 9999;
//     App.listen(PORT, () => {
//        // logger.info(`Hash Server listening on port ${PORT}`);
//     });


// }
//
// main()
async function main1() {


    //事件监控
    const hashTask = new HashTask();
    await hashTask.init()
    // await hashTask.websocket()
    await hashTask.test()

    //await hashTask.syncBlockInfo()


    //await hashTask.updateToken(1)
    //await hashTask.parseToken()

}

main1()