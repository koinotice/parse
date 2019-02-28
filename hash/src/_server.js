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

    let {page, limit, owner, roomId, orderId, desc, startBlock,closed} = req.query;


    page = parseInt(page) || 1;

    limit = parseInt(limit) || 100;

    if (limit > 100) {
        limit = 100;
    }


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
    if (closed) {
        query.equalTo('closed', closed=="false"?false:true);
    }
    if (startBlock) {
        query.greaterThan("startBlock", startBlock)
    }

    const orders = ["createdAt", "orderId", "totalValue", "startBlock", "gain", "closed"]
    //pets.includes('cat')
    if (!orders.includes(desc)) {
        desc = orders[0]
    }
    query.include("token");
    query.limit(limit);
    query.skip(limit * (page - 1));
    query.descending(desc);// 先进先出，正序排列

    const data = await query.find()


    return res.json({data: data});
});


app.get('/api/blocks', async (req, res) => {
    const query = new Parse.Query("Block");
    query.limit(100);
    query.skip(0);
    query.descending("number");// 先进先出，正序排列

    const data = await query.find()
    const dc = []
    data.forEach(function (n) {
        dc.push(n.toJSON())
    })
    const groups = _.groupBy(dc, "tail")
    var obj = {}
    _.map(groups, function (e, n) {
        obj[n] = e.length;
    })
    return res.json({data: obj});
});

app.get('/api/blocks', async (req, res) => {
    const query = new Parse.Query("Block");
    query.limit(1);
    query.skip(0);
    query.descending("number");
    const data = await query.find()
    return res.json({data: data[0]});
});



app.get('/api/config/contract', async (req, res) => {

    const hash = require("./hashDice.json")
    return res.json(hash);
});


app.get('/', (req, res) => {
    res.render('home');
});


module.exports = app