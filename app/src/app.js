require('dotenv').config({
    path: __dirname + '/../server.env'
});
const ZeroClientProvider = require('web3-provider-engine/zero')

const BotFactory = require("./BotFactory")
const HashDice = require("./HashDice")
const HashTask = require("./HashTask")
const App = require("./server")

async function main() {
    const PORT = process.env.HASH_PORT || 80;
    App.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });

    const botFactory = new BotFactory()
    botFactory.start()

    const hashDice = new HashDice()
    await hashDice.init()

    const hashTask = new HashTask();
    await hashTask.init()

    const providerEngine = ZeroClientProvider({

        rpcUrl: process.env.RPC_URL,

    })

    providerEngine.on('block', async function (block) {

        await hashTask.BlockWatch(block)
    })

}



//test()
main()