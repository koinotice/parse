if (!process.env.docker) {
    require('dotenv').config({
        path: __dirname + '/../server.env'
    });
}
const BotFactory = require("./BotFactory")
const HashDice = require("./HashDice")

async function main() {

    //事件处理
    const hashDice = new HashDice()
    await hashDice.init()

    //事件监控
    const botFactory = new BotFactory()
    botFactory.start()


}

main()