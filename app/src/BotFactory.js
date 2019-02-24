const {Contract,Block}=require("./Models")
const EventBot = require('./EventBot')
const logger = require('./lib/logger')("bot")

class BotFactory {
    constructor() {
        this.instantiated = false
        this.activeBots = []
        this.contractIndexes = {}
    }

    async start() {
        const contracts = await Contract.find({})
        contracts.map(contract => {
            this.startListening(contract.address,contract.abi)
        })

        logger.info("BotFactory start  " )

    }

    async startListening(contractAddress,abi) {
        logger.info(`Starting listener for ${contractAddress}`)

        const botIndex = this.contractIndexes[contractAddress]
        if (botIndex) {
            const activeBot = this.activeBots[botIndex]
            if (!activeBot.running)
                    activeBot.start()

        } else {
            const newBot = new EventBot(contractAddress,  (abi))
            const newIndex = this.activeBots.push(newBot) - 1
            this.contractIndexes[contractAddress] = newIndex
            newBot.start()
        }
    }
}

module.exports = BotFactory
