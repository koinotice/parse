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
const logger = require('./lib/logger')("HashApp2")
const {Parse} = require('./lib/parse');

const Room = Parse.Object.extend("Room");
const Order = Parse.Object.extend("Order");
const Block = Parse.Object.extend("Block")
async function main() {

    const hashDice = new HashDice()
    await hashDice.init()
    await hashDice.blockInfo()


}

main()