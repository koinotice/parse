const {Contract,Block}=require("./Models")
const EventBot = require('./EventBot')

class BotFactory {
    constructor() {
        this.instantiated = false
        this.activeBots = []
        this.contractIndexes = {}
    }

    async start() {
        const contracts = await Contract.find({})
        console.log(contracts)
        contracts.map(contract => {
            //console.log(contract.address)
            this.startListening(contract.address,contract.abi)
        })
    }

    async startListening(contractAddress,abi) {
        console.log(`(re)starting listener for ${contractAddress}`)

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
