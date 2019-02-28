const _ = require('lodash');
//const logger = require('./lib/logger')("HashEngie")
const eachLimit = require('async/eachLimit')
const Web3 = require('web3');
const {
    NAT_URL,
    WALLET_MNEMONIC,
    SOCKET_PROVIDER_URI,
    DEPLOYMENT_GAS_LIMIT,
    HTTP_PROVIDER_URI
} = process.env;

//const Nats = require('nats').connect(NAT_URL);

//const {client} = require('./lib/redis');
const HDWalletProvider = require("./lib/hdwallet")

const Contract = require('truffle-contract');
const ZeroClientProvider = require('./lib/zero')
const RpcSubprovider = require('web3-provider-engine/subproviders/rpc')

const engine =  ZeroClientProvider({
    rpcUrl:  HTTP_PROVIDER_URI,
})

const web3 = new Web3(engine)

const rpcSubprovider = new RpcSubprovider({rpcUrl: HTTP_PROVIDER_URI})

const provider =new  HDWalletProvider(WALLET_MNEMONIC, engine, 0, 5)

provider.engine.addProvider(rpcSubprovider)
provider.engine.start()


const TargetContract = require("./hashDice.json")
const hashdice_artifact = require('./build/contracts/HashDice.json');

const contract = Contract(hashdice_artifact);

contract.setProvider(new Web3(provider).currentProvider);
async function initContract(){
    const HashContract =await contract.at(TargetContract.address)
    return HashContract
}
const hashDice=new web3.eth.Contract(TargetContract.hashabi, TargetContract.address)


module.exports={
    engine,
    provider,
    initContract,
    hashDice,
    web3
}
