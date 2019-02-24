if (!process.env.docker) {
    require('dotenv').config({
        path: __dirname + '/../server.env'
    });
}
const ZeroClientProvider = require('web3-provider-engine/zero')
const BotFactory = require("./BotFactory")
const HashDice = require("./HashDice")
const HashTask = require("./HashTask")
const App = require("./server")
const logger = require('./lib/logger')("HashApp")

async function main() {
    const PORT = process.env.HASH_PORT || 80;
    App.listen(PORT, () => {
        logger.info(`Hash Server listening on port ${PORT}`);
    });




    //事件处理
    const hashDice = new HashDice()
    await hashDice.init()

    //事件监控
    const botFactory = new BotFactory()
    botFactory.start()

    //开奖任务
    const hashTask = new HashTask();
    await hashTask.init()
    await hashTask.websocket()

    const providerEngine = ZeroClientProvider({
        rpcUrl: process.env.RPC_URL,
    })

    //区块监控
    providerEngine.on('block', async function (block) {
        await hashTask.BlockWatch(block)
    })

}

main()