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
    const query = new Parse.Query("Order");
     query.include("token")
    const data = await query.find()
    const dc = []
    data.forEach(function (n) {
        dc.push(n.toJSON())
    })
    console.log(dc)
    const groups = _.groupBy(dc, "token")
    var obj = {}
    _.map(groups, function (e, n) {
        obj[n] = e.length;
    })

    console.log(obj)
}

main1()