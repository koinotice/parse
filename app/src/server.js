const express = require('express');
const exphbs = require('express-handlebars');
const isJSON = require('is-json');
var cors = require('cors')

const {client} = require('./lib/redis');
const _ = require('lodash');

const http = require('http')


const app = express();
app.use(express.static('public'));
app.use(cors())
app.options("/*", function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    res.send(200);
});

app.engine('.hbs', exphbs({defaultLayout: 'main', extname: '.hbs'}));
app.set('view engine', '.hbs');

const {Parse} = require('./lib/parse');

const Room = Parse.Object.extend("Room");
const Order = Parse.Object.extend("Order");
const Token = Parse.Object.extend("Token");
const Block = Parse.Object.extend("Block");

app.get('/api/tokens', async (req, res) => {

    const query = new Parse.Query(Token);

    query.ascending('symbol');// 先进先出，正序排列
    // app.logge.info(limit)
    const data = await query.find()
    return res.json({data: data});
});

app.get('/api/rooms', async (req, res) => {

    let {page, limit, owner, roomId, name, address, tokenId, desc} = req.query;


    page = parseInt(page) || 1;

    limit = parseInt(limit) || 100;

    if (limit > 100) {
        limit = 100;
    }

    const query = new Parse.Query(Room);

    query.equalTo('active', true);

    if (owner) {
        query.equalTo('creator', owner.toLowerCase());
    }
    if (roomId) {
        query.equalTo('roomId', parseInt(roomId));
    }
    if (name) {
        query.equalTo('name', name);
    }

    if (tokenId) {
        var token = new Token();
        token.id = tokenId;
        query.equalTo("token", token);
    }

    if (address) {
        query.equalTo('erc20Addr', address.toLowerCase().trim());
    }

    query.limit(limit);
    query.skip(limit * (page - 1));

    const orders = ["createdAt", "currentOrderId", "roomId", "lastLockedValue", "lastClosedOrderId", "currentOrderId"]
    //pets.includes('cat')
    if (!orders.includes(desc)) {
        desc = orders[0]
    }

    query.descending(desc);// 先进先出，正序排列
    // app.logge.info(limit)
    const data = await query.find()
    return res.json({data: data});
});


app.get('/api/orders', async (req, res) => {

    let {page, limit, owner, roomId, orderId, desc, startBlock} = req.query;
    console.log(req.params)

    page = parseInt(page) || 1;

    limit = parseInt(limit) || 100;

    if (limit > 100) {
        limit = 100;
    }

    console.log(req.query)

    const query = new Parse.Query(Order);
    if (owner) {
        query.equalTo('owner', owner.toLowerCase());
    }
    if (roomId) {
        query.equalTo('roomId', parseInt(roomId));
    }


    if (orderId) {
        query.equalTo('orderId', parseInt(orderId));
    }
    if (startBlock) {
        query.greaterThan("startBlock", startBlock)
    }

    const orders = ["createdAt", "orderId", "totalValue", "startBlock", "gain", "closed"]
    //pets.includes('cat')
    if (!orders.includes(desc)) {
        desc = orders[0]
    }

    query.limit(limit);
    query.skip(limit * (page - 1));
    query.descending(desc);// 先进先出，正序排列

    const data = await query.find()

    console.log(data)

    return res.json({data: data});
});


app.get('/api/blocks', async (req, res) => {
    const query = new Parse.Query("Block");
    query.limit(100);
    query.skip(0);
    query.descending("number");// 先进先出，正序排列

    const data = await query.find()
    const dc=[]
    data.forEach(function(n){
        dc.push(n.toJSON())
    })
    const groups=_.groupBy(dc,"tail")
    const ret=[]
    _.map(groups,function(e,n){
        var obj={}
        obj[n]=e.length;

        ret.push(obj)
    })

    return res.json({data: ret});
});


//
// app.get('/api/:key', async (req, res) => {
//     const {key} = req.params;
//     let result,data={};
//     try {
//         result =await client.get(key);
//         data = isJSON(result) ? JSON.parse(result) : result;
//     }catch (e) {
//        console.log(e)
//     }
//     return res.json({data: data});
// });
//
//
//
// app.get('/api/hash/:key', async (req, res) => {
//     const {key} = req.params;
//
//     let result,data=[];
//     try {
//         result = await client.hgetall(key.toLowerCase())
//         data=[]
//         _.each(result,function(n){
//             data.push((n))
//         })
//     }catch (e) {
//         console.log(e)
//     }
//
//     return res.json({data:data});
// });
//
// app.get('/api/room/:key', async (req, res) => {
//     const {key} = req.params;
//     let result;
//     try{
//         result = await client.get("room_" + key);
//     }catch (e) {
//         console.log(e)
//     }
//
//     return res.json({data:result});
//
// });
app.get('/api/config/time', async (req, res) => {

    const timestamp = Math.floor(Date.now() / 1000)

    return res.json({time: timestamp});
});

// app.get('/api/config/token', async (req, res) => {
//
//     const tokens = require("./tokens.json")
//     return res.json(tokens);
// });

app.get('/api/config/contract', async (req, res) => {

    const hash = require("./hashDice.json")
    return res.json(hash);
});

const Big = require('bignumber.js');
const BN = require("bn.js");

function dec(balance) {
    return new Big(10).pow(Number(18)).times(balance).toString(10)
}

function toNumber(mixed) {
    if (typeof mixed === 'number') {
        return mixed
    }

    if (mixed instanceof Big || mixed instanceof BN) {
        return mixed.toNumber()
    }

    if (typeof mixed === 'string') {
        return Number(mixed)
    }

    throw new Error('Unsupported type')
}

const formatLength = (value) => {
    value = Number(value)
    // fix bug: value == string
    if (value && typeof value === 'number') {
    } else {
        value = 0
    }
    if (value > 1000) {
        return value.toFixed(2)
    }
    if (value <= 1000 && value >= 1) {
        return value.toFixed(2)
    }
    if (value < 1 && value >= 0.001) {
        return value.toFixed(5)
    }
    if (value < 0.001 & value > 0) {
        return value.toFixed(8)
    }
    if (value === 0) {
        return 0.00
    }
}

function getAmount(amount) {
    let number
    if (amount) {
        number = (toNumber(amount) / Number('1e' + 18)).toFixed(4)
    } else {
        number = 0
    }
    return formatLength(number)

}

app.get('/api/lrc', async (req, res) => {


    const Web3 = require('web3');
    const ZeroClientProvider = require('web3-provider-engine/zero')
    const Ethjs = require('ethjs')

    const providerEngine = ZeroClientProvider({
        // supports http and websockets
        // but defaults to infura's mainnet rest api
        rpcUrl: 'https://mainnet.infura.io',
        // rpcUrl: 'http://localhost:8545',
        //rpcUrl:'wss://rinkeby.infura.io/ws'
        // rpcUrl: 'wss://mainnet.infura.io/ws',
        // rpcUrl: 'ws://localhost:8545/ws',
    })

// use the provider to instantiate Ethjs, Web3, etc
    const eth = new Ethjs(providerEngine)


    const {address, abi} = require("./lrc.json")

    const token = eth.contract(abi).at(address);

    let {value} = req.query;

    console.log(value)
    if (!/^\d+$/.test(value)) {
        return res.json({data: "输入有误"})
    }

    value = dec(value);
    console.log(value)

    const bonus = await token.getBonus(value)


    token.getBonus(value).then((totalSupply) => {
        //console.log(totalSupply[0].toString(10))
    });

    return res.json({data: getAmount(bonus[0].toString(10))});

})


app.get('/', (req, res) => {
    res.render('home');
});

// const PORT = process.env.HASH_PORT || 5555;
// app.listen(PORT, () => {
//     console.log(`Server listening on port ${PORT}`);
// });


// const port = parseInt(process.env.HASH_PORT, 10) || 80
// app.set('port', port)
// const server = http.createServer(app)
// server.listen(port)

module.exports = app