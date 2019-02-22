require('dotenv').config({
    path: __dirname + '/../server.env'
});

const HashDice = require("./HashDice")
const HashTask = require("./HashTask")

async function main() {


    const hashDice = new HashDice()
    await hashDice.init()

    const hashTask = new HashTask();
    await hashTask.init()
    //await hashTask.CloseRound(165,1)
    await hashTask.BlockWatch()

}


main()