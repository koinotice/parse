
const Parse = require('parse/node');


Parse.initialize("pmker","pmker", "Zheli123");
//javascriptKey is required only if you have it on server.

Parse.serverURL = 'http://0.0.0.0:7311/app/pmker'

const Room = Parse.Object.extend("Room");
const Order = Parse.Object.extend("Order");

async function main(roomId,roundId,orderId){

    try{
        const room = new Parse.Query(roomId);
        room.equalTo('roomId', parseInt(roomId));
        const roomInfo=await roomInfo.first()

        var query = new Parse.Query(Order);
        query.equalTo('roomId', parseInt(roomId));
        query.equalTo('roundId', parseInt(roundId));
        query.equalTo('orderId', parseInt(orderId));
        let order=await query.first()

        if(order==undefined){

            order = new Order();
        }

        order.set("roomId",parseInt(roomId))
        order.set("roundId",parseInt(roundId))
        order.set("orderId",parseInt(orderId))
        order.set("roomName",roomInfo.get("name"))
        order.set(orderInfo)
        await order.save()

    }catch (e) {
        console.log(e)
    }
}
main()