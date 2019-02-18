const Web3 = require('web3');
const assert = require("assert")
const HDWalletProvider = require("truffle-hdwallet-provider")
const fs = require("fs")
const {PROVIDER_URI, WALLET_MNEMONIC, GAS_PRICE, GAS_LIMIT,HASH_DICE_ADDRESS,REDIS_URL,REDIS_PORT} = require("./env.json")
const {address} = require("./hashDice.json")
const provider = new Web3.providers.HttpProvider("http://localhost:8545")
const provider1 = new HDWalletProvider(WALLET_MNEMONIC, PROVIDER_URI, 0, 5)

const eachLimit = require('async/eachLimit')
const ethUtil = require("ethereumjs-util")
const Big = require("bignumber.js")
const BN = require("bn.js")


const {Parse} = require('./lib/parse');

const Room = Parse.Object.extend("Room");
const Order = Parse.Object.extend("Order");


var web3 = new Web3(provider1);
const contract = require('truffle-contract');

const pelo_artifact = require('./build/contracts/PeloponnesianToken.json');
const testtoken_artifact = require('./build/contracts/TestToken.json');
const hashdice_artifact = require('./build/contracts/HashDice.json');
const TestToken = contract(testtoken_artifact);
const HashDice = contract(hashdice_artifact);

const {client} = require('./lib/redis');
const _ = require('lodash');
 

//TestToken.setProvider(web3.currentProvider);
HashDice.setProvider(web3.currentProvider);


const DECIMICAL = 10 ** 18;

const app = {};

//const store = require("./contract.json").store

app.hashdiceAddress = address;

console.log(app)
//app.tokenAddress = store.token;

// 初始化配置信息
async function init() {

    //app.token = await TestToken.at(app.tokenAddress)
    app.hashdice = await HashDice.at(app.hashdiceAddress)
    app.accounts = await web3.eth.getAccounts()
    //await getBetOrder(2,2,1)
    //events()
    // await CloseRound.apply(this,[5,1])
}

init();


const web34 = new Web3(new Web3.providers.WebsocketProvider("wss://rinkeby.infura.io/ws"))
//const web3 = new Web3(new Web3.providers.WebsocketProvider("ws://127.0.0.1:9546"))
const contractJson = require('./build/contracts/HashDice.json');


const instance = new web34.eth.Contract(contractJson.abi, app.hashdiceAddress);


//监听区块高度，去开奖
var subscription = web34.eth.subscribe('newBlockHeaders', function (error, result) {
    if (!error) {
        return;
    }

    console.error(error);
}).on("data", function (blockHeader) {
    let data = {
        number: blockHeader.number,
        hash: blockHeader.hash,
        gasLimit: blockHeader.gasLimit,
        parentHash: blockHeader.parentHash
    }
    //client.set(data.number, JSON.stringify(data));
    console.log(data)

    client.get(data.number, async (err, reply)=> {
        if(reply!=null){
            let data=JSON.parse(reply)

            eachLimit(data, 1, async (n) => {
                await CloseRound.apply(this,n)
                console.log(n)
            }, function (error) {

                if (error) {
                    console.log(error)
                } else {
                    console.log("ok")
                }
            })

        }

    });
    // let roundInfo = client.get(34234)
    //
    //  console.log(roundInfo)
    // if (roundInfo) {
    //     let info = JSON.parse(roundInfo)
    //     console.log(info)
    //
    // }


}).on("error", console.error);

// instance.events.allEvents(
//     (errors, events) => {
//         if (!errors) {
//             console.log(events)
//         }
//         console.log(errors)
//     }
// );



