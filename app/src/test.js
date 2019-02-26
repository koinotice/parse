if (!process.env.docker) {
    require('dotenv').config({
        path: __dirname + '/../server.env'
    });
}

const {Parse} = require('./lib/parse');
const _=require("lodash")
const Room = Parse.Object.extend("Room");
const Order = Parse.Object.extend("Order");
const Block = Parse.Object.extend("Block")
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

main()