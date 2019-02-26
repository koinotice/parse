if (!process.env.docker) {
    require('dotenv').config({
        path: __dirname + '/../server.env'
    });
}
process.env.PARSE_SERVER_URL="http://71an.com:7311/app"
process.env.NAT_URL="nats://71an.com:4222"

const {Parse} = require('./lib/parse');
const _=require("lodash")
const Room = Parse.Object.extend("Room");
const Order = Parse.Object.extend("Order");
const Block = Parse.Object.extend("Block")
const Nats = require('nats').connect("nats://71an.com:4222");

async function main() {
    const query = new Parse.Query("Block");


    query.limit(100);
    query.skip(0);
    query.descending("number");// 先进先出，正序排列
    // app.logge.info(limit)

    // var pipeline = [
    //     {group: {objectId: '$tail', count: {$sum: 1}}}
    // ];
    const data = await query.find()
    const dc=[]
    data.forEach(function(n){
        dc.push(n.toJSON())
    })
    const groups=_.groupBy(dc,"tail")
    const res=[]
    _.map(groups,function(e,n){
        var obj={}
        obj[n]=e.length;

        res.push(obj)
    })

    console.log(res)


}
async function main1(){
    const that = this
    //logger.info("System reset Orders modify start")

    var query = new Parse.Query(Order);
     query.doesNotExist('block');
    //query.equalTo('block',[]);
    query.limit(2);
    let orders = await query.find()


    await Promise.all(orders.map(async event => {
        // event.set("block",[])
        // event.save()
        console.log(event.get("roomId"),event.get("orderId"))
        Nats.publish("orderBlock", JSON.stringify([event.get("roomId"),event.get("orderId")]))

        Nats.publish("orderBlock", JSON.stringify([1,39]))

    }))

    //logger.info("System reset Orders Success")
}
main1()