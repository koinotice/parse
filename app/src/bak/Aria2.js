const _ = require('lodash');
const winston = require('winston')
const moment = require('moment')
const https = require('https')
const {client} = require('./lib/redis');

const logger = winston.createLogger({
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});
const axios = require("axios");

const Aria2 = require("aria2");

const parseM3u8 = source => {

    const sourceUrl = source
        .split("/")
        .slice(0, -1)
        .join("/");
    return new Promise(async (resolve, reject) => {
        try {
            const { status, data } = await axios.get(source, {
                timeout: 200000,
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false,
                    agent: false
                })
            });
            console.log(status,data)
            if (status === 200) {
                const infoList = data.split("\n").filter(item => item.length > 0).filter(item => !item.startsWith("#"));
                if (data.includes("#EXT-X-STREAM-INF")) {
                    if(infoList[0].startsWith('http')){
                        resolve(await parseM3u8(infoList[0]));
                    }else{
                        resolve(await parseM3u8(`${sourceUrl}/${infoList[0]}`));
                    }
                } else {
                    resolve(
                        infoList.map(item => {
                            if (item.startsWith("http")) {
                                return item;
                            } else {
                                return `${sourceUrl}/${item}`;
                            }
                        })
                    );
                }
            }
        } catch (e) {
            reject(e);
        }
    });
};
class Aria2Down {
    constructor() {
        this.stan = require('node-nats-streaming').connect('test-cluster', 'aria2',{
            url:process.env.NAT_URL
        });


        this.aria2 = new Aria2({
            host: process.env.ARIA2_URL,
            port: process.env.ARIA2_PORT,
            secure: false,
            secret: '',
            path: '/jsonrpc'
        });
    }

    async init() {
        var that=this;
        this.stan.on('connect',async e=>{
            console.log("connect")

            var opts = this.stan.subscriptionOptions().setStartWithLastReceived();
           // opts.setDeliverAllAvailable();
            var subscription =await this.stan.subscribe('aria2', opts);
            subscription.on('message', async function (msg) {
                console.log('Received a message [' + msg.getSequence() + '] ' + msg.getData());
                var params=JSON.parse(msg.getData())
                var isexit=await client.get(params.url)
                if(isexit!=1){

                }else{
                    that.down(params)
                    await client.set(params.url,1)
                }
            });

            var subscription1 =await this.stan.subscribe('aria2_m3u8', opts);
            subscription1.on('message',async function (msg) {
                console.log('Received a message [' + msg.getSequence() + '] ' + msg.getData());

                var params=JSON.parse(msg.getData())
                var isexit=await client.get(params.url)
                if(isexit!=1){

                }else{
                    that.m3u8(params)
                    await client.set(params.url,1)
                }
            });

        })


    }
    async test(){
        this.stan.on('connect',async e=> {
            await this.stan.publish('aria2_m3u8', JSON.stringify({
                url: "https://zuikzy.wb699.com/ppvod/7E8976C46779EECFCA198E024F38853E.m3u8",
                dir: 2
            }))

            await this.stan.publish('aria2', JSON.stringify({
                url: "https://zuikzy.wb699.com/ppvod/7E8976C46779EECFCA198E024F38853E.m3u8",
                dir: 3
            }))
        })
    }

    async down(data) {
        var dir=moment().format("yyyyMMddHHmm")+data.dir
        await aria2.call("addUri", [data.url], { dir: "/aria2/downloads/"+dir });
    }

    async m3u8(data){
        console.log(data.url)
        var dir=moment().format("yyyyMMddHHmm")+data.dir

        const urls=await parseM3u8(data.url)
        console.log(urls)
        const multicall = []
        urls.forEach(function (n) {
            let a= ["addUri",[n], { dir: "/aria2/downloads/"+dir }];
            multicall.push(a)
        })

        await this.aria2.multicall(multicall);
    }





}


module.exports = Aria2Down


