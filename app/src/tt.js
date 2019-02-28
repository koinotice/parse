if (!process.env.docker) {
    require('dotenv').config({
        path: __dirname + '/../server.env'
    });
}
 process.env.PARSE_SERVER_URL = "http://71an.com:7311/app"
// process.env.NAT_URL = "nats://71an.com:4222"

const {Parse} = require('./lib/parse');
const _ = require("lodash")

var fs = require('fs');

const eachLimit = require('async/eachLimit')

const Order = Parse.Object.extend("Order");


async function main1() {
    const that = this


    const query = new Parse.Query(Order);
    var a= new  Boolean("false")
    console.log(a)
    query.equalTo('closed', a);


    const data = await query.find()

    //console.log(data)
}

main1()