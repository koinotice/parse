if (!process.env.docker) {
    require('dotenv').config({
        path: __dirname + '/../server.env'
    });
}

const {
    NAT_URL,

} = process.env;
const logger = require('./lib/logger')("HashEvents")

const Nats = require('nats').connect(NAT_URL);

const Web3 = require('web3');

const {address,hashabi} = require("./hashDice.json")


const web34 = new Web3( "wss://rinkeby.infura.io/ws" )


const instance = new web34.eth.Contract(hashabi, address);

instance.events.allEvents(  (error, event) => {
   // console.log(1,event);
}).on('data', (event) => {

    logger.info('Event %s params %s', event.event, JSON.stringify(event.returnValues));

    Nats.publish(address, JSON.stringify(event));
}).on('changed', (event) => {
    //console.log(3,event);
}).on('error', (error) => {
    console.error(error);
});
