if (!process.env.docker) {
    require('dotenv').config({
        path: __dirname + '/../server.env'
    });
}
const ZeroClientProvider = require('web3-provider-engine/zero')
const HashTask = require("./HashTask")

async function main() {

    //开奖任务
    const hashTask = new HashTask();
    await hashTask.init()
    await hashTask.websocket()

    // await hashTask.setOrderBlockInfo([1,1])

    const providerEngine = ZeroClientProvider({
        rpcUrl: process.env.RPC_URL,
    })

    //区块监控
    providerEngine.on('block', async function (block) {
        await hashTask.BlockWatch(block)
    })

}

main()