if (!process.env.docker) {
    require('dotenv').config({
        path: __dirname + '/../server.env'
    });
}
// process.env.PARSE_SERVER_URL = "http://71an.com:7311/app"
// process.env.NAT_URL = "nats://71an.com:4222"

const {Parse} = require('./lib/parse');
const _ = require("lodash")

var fs = require('fs');

const eachLimit = require('async/eachLimit')

const Token = Parse.Object.extend("Token1");

async function main(){

    var token = new  Token();

    token.set("asdf",1)
    const b=await token.save()
    console.log(b.toJSON())

}
main()