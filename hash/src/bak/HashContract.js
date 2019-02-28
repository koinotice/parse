const {Contract} = require("./Models")
const Web3 = require('web3')
const logger = require('./lib/logger')("hashContract")
const eachLimit = require('async/eachLimit')

/** This will watch for events that have not been processed yet and send a webhook
 */
class HashContract {
    constructor() {
        const {address,hashabi}=require("./hashDice.json")
        this.contractAddress = address
        this.contractABI = hashabi
    }

    async socketContract() {
        const that = this;
        var provider = new Web3.providers.WebsocketProvider(process.env.PROVIDER_URI);
        const web3 = new Web3(provider);
        provider.on('error', e => {
            logger.error('WS Infura Error %s', e);
        });

        provider.on('end', e => {
            logger.log('WS closed');
            logger.log('Attempting to reconnect...');
            provider = new Web3.providers.WebsocketProvider(process.env.PROVIDER_URI);
            provider.on('connect', function () {
                logger.log('WSS Reconnected');
            });
            web3.setProvider(provider);

        });
       return  new web3.eth.Contract(this.contractABI, this.contractAddress)


    }
    async httpContract() {
        const that = this;
         var provider = new Web3.providers.HttpProvider(process.env.HTTP_PROVIDER_URI);


        const web3 = new Web3(provider);


        return  new web3.eth.Contract(this.contractABI, this.contractAddress)


    }



}

module.exports = HashContract
