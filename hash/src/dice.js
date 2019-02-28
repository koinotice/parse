if (!process.env.docker) {
    require('dotenv').config({
        path: __dirname + '/../server.env'
    });
}

process.env.PARSE_SERVER_URL = "http://71an.com:7311/app"

const HashDice = require("./HashDice")

async function main() {

    //事件处理
    const hashDice = new HashDice()
    await hashDice.init()
    await hashDice.updateBetOrder(2,1)

}

main()