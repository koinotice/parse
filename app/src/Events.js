if (!process.env.docker) {
    require('dotenv').config({
        path: __dirname + '/../server.env'
    });
}



const {
    NAT_URL,
    WALLET_MNEMONIC,
    RPC_URL,
    DEPLOYMENT_GAS_LIMIT,
    PROVIDER_URI
} = process.env;

const HDWalletProvider = require("truffle-hdwallet-provider")
const provider = new HDWalletProvider(WALLET_MNEMONIC, RPC_URL, 0, 10)


const logger = require('./lib/logger')("HashEvents")
const {client} = require('./lib/redis');

const Nats = require('nats').connect(NAT_URL);

const Web3 = require('web3');

const {address,hashabi} = require("./hashDice.json")
const Tcontract = require('truffle-contract');
const hashdice_artifact = require('./build/contracts/HashDice.json');


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

web34.eth.subscribe('newBlockHeaders', function (error, result) {
    if (!error) {
        return;
    }
    console.error(error);
}).on("data",async function (blockHeader) {
    let data = {
        number: blockHeader.number,
        hash: blockHeader.hash,
        gasLimit: blockHeader.gasLimit,
        parentHash: blockHeader.parentHash
    }
    //client.set(data.number, JSON.stringify(data));
    console.log(data)
    await BlockWatch(data)


    //await  CloseBetOrders(1)


}).on("error", console.error);


async function BlockWatch(data) {
    const that = this;

    //const blockObj = new Block();
   // data.tail = blockHash.substring(data.hash.length - 1)


    client.smembers(data.number, async (err, reply) => {
        if (reply.length != 0) {
            eachLimit(reply, 1, async (n) => {
                await  CloseBetOrders(n)
            }, function (error) {
                if (error) {
                    console.log(error)
                } else {
                    console.log("ok")
                }
            })
        }
    });


}

async function getContract(){
    const contract = Tcontract(hashdice_artifact);
    contract.setProvider(new Web3(provider).currentProvider);
    const hashContract = await  contract.at(address)
    return hashContract
}
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}


async function CloseBetOrders(roomId) {
    logger.info("CloseBetOrders roomId %s", roomId)
    //const hashContract = await that.contract.at(address)
    // console.log(provider)
    const accounts = provider.getAddresses()
    const hashContract=await getContract()
    console.log(accounts)
    const account = accounts[getRandomInt(7,9)]
    console.log(accounts, account, DEPLOYMENT_GAS_LIMIT)

    const order = await hashContract.CloseBetOrders(roomId, {from: account, gas: DEPLOYMENT_GAS_LIMIT});


    if (order.receipt) {
        const event = {
            returnValues: {
                roomId: roomId,
            },
            event: 'CloseBetOrders',
        }
        if (order.receipt.status == true) {
            await Nats.publish(address, JSON.stringify(event))
            logger.info("HashTask success blockNumber %s roomId %s", order.receipt.blockNumber + 2, roomId)
        } else {
            //如果操作失败，2个区块后重试
            await client.sadd(order.receipt.blockNumber + 2, roomId);
            logger.error("HashTask fail blockNumber %s roomId %s", order.receipt.blockNumber + 2, roomId)
        }
    }

}
