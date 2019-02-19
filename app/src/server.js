const express = require('express');
const exphbs = require('express-handlebars');
require('dotenv').config({
    path: __dirname + '/../../parse.env'
});



const isJSON = require('is-json');
var cors = require('cors')

const {client} = require('./lib/redis');
const _ = require('lodash');


const app = express();
app.use(express.static('public'));
app.use(cors())
app.options("/*", function(req, res, next){
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


app.get('/api/rooms', async (req, res) => {

    let {page,limit} = req.query;
    console.log(req.params)

    page = parseInt(page) || 1;

    limit = parseInt(limit) || 100;

    if (limit > 100) {
        limit = 100;
    }

    const query = new Parse.Query(Room);

    query.equalTo('active', true);
    query.limit(limit);
    query.skip(limit * (page - 1));
    query.descending('createdAt');// 先进先出，正序排列
    // app.logge.info(limit)
    const data= await query.find()
    return res.json({data: data});
});


app.get('/api/order', async (req, res) => {

    let {page,limit,owner,roomId,roundId,orderId} = req.query;
    console.log(req.params)

    page = parseInt(page) || 1;

    limit = parseInt(limit) || 100;

    if (limit > 100) {
        limit = 100;
    }

    console.log(req.query)

    const query = new Parse.Query(Order);
    if(owner){
        query.equalTo('owner', owner);
    }
    if(roomId){
        query.equalTo('roomId', parseInt(roomId));
    }

    if(roundId){
        query.equalTo('roundId', parseInt(roundId));
    }

    if(orderId){
        query.equalTo('orderId', parseInt(orderId));
    }



    query.limit(limit);
    query.skip(limit * (page - 1));
    query.descending('createdAt');// 先进先出，正序排列

    const data= await query.find()

    console.log(data)

    return res.json({data: data});
});





app.get('/api/:key', async (req, res) => {
    const {key} = req.params;
    let result,data={};
    try {
        result =await client.get(key);
        data = isJSON(result) ? JSON.parse(result) : result;
    }catch (e) {
       console.log(e)
    }
    return res.json({data: data});
});



app.get('/api/hash/:key', async (req, res) => {
    const {key} = req.params;

    let result,data=[];
    try {
        result = await client.hgetall(key.toLowerCase())
        data=[]
        _.each(result,function(n){
            data.push((n))
        })
    }catch (e) {
        console.log(e)
    }

    return res.json({data:data});
});

app.get('/api/room/:key', async (req, res) => {
    const {key} = req.params;
    let result;
    try{
        result = await client.get("room_" + key);
    }catch (e) {
        console.log(e)
    }

    return res.json({data:result});

});
app.get('/api/config/time', async (req, res) => {

    const timestamp = Math.floor(Date.now() / 1000)

    return res.json({time: timestamp});
});

app.get('/api/config/token', async (req, res) => {

    const tokens = require("./tokens.json")
    return res.json(tokens);
});

app.get('/api/config/contract', async (req, res) => {

    const hash = require("./hashDice.json")
    return res.json(hash);
});
app.get('/', (req, res) => {
    res.render('home');
});

const PORT = process.env.HASH_PORT || 5555;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
