if (!process.env.docker) {
    require('dotenv').config({
        path: __dirname + '/../server.env'
    });
}
process.env.PARSE_SERVER_URL = "http://71an.com:7311/app"
process.env.NAT_URL = "nats://71an.com:4222"

const {Parse} = require('./lib/parse');
const _ = require("lodash")

var fs = require('fs');

const eachLimit = require('async/eachLimit')

const Token = Parse.Object.extend("Token");


async function main1() {
    const that = this


    fs.readdir("../public/logo", async function (err, items) {
        var p=["0x37f44cabc8fc42efff4ca8e62f230f84afdf86cb","0x564E021D1eC3a1686c5337722864977F9beEf83a","0x477dFD81af7DF0EdeC1B425909e4d9558776A735","0xff3c82c878d249c6d6afbfddf4caa2a48192c65e","0xc9f95b34f728bce8a056d24ec27f056af0a3443f"]
        var c=["AAA","View","Age","Yue","Moon"]

        var tokens=require("./tokens.json")

        var i=0;
        eachLimit(items ,1,async function(item){
            let coin = {
                "symbol": item.replace(".png", ""),
                "name": item.replace(".png", "") + " Token",
                "digits": 18,
                "address": "0x37f44cabc8fc42efff4ca8e62f230f84afdf86cb",
                "logo": "http://47.244.53.52:7300/logo/" + item,
                "step": 10
            }
            if(i<5){
               coin.symbol=tokens[i].symbol

               coin.digits=tokens[i].digits
               coin.address=tokens[i].address.toLocaleLowerCase()
            }
            i++
           // console.log(coin)
            const token = new Token();
            token.set("hot" , false)
            token.set("count",0)
            token.set(coin)
            if(i<=16){
                const b=await token.save()
                console.log(b)
            }


        })


    });
    // //logger.info("System reset Orders modify start")
    // const tokens = require("./tokens.json")
    //
    // var query = new Parse.Query(Token);
    //
    //
    // eachLimit(tokens, 1, async function (token) {
    //
    //
    //     token.address = token.address.toLowerCase().trim()
    //
    //
    //     query.equalTo('address', token.address);
    //     let room = await query.first()
    //
    //
    //     if (room == undefined) {
    //         room = new Token();
    //     }
    //     token.hot = false
    //     token.count = 0
    //     room.set(token)
    //     await room.save()
    // })
    //
    // logger.info("System reset Tokens Success")
}

main1()