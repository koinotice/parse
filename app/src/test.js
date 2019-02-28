if (!process.env.docker) {
    require('dotenv').config({
        path: __dirname + '/../server.env'
    });
}
const ZeroClientProvider = require('web3-provider-engine/zero')
const HashTest = require("./HashTest")

const {getAmount}=require("./lib/format")
async function main() {

    //开奖任务
    // const hashTask = new HashTest();
    // await hashTask.init()
    // await hashTask.test()
    const b=NumbergetAmount(567800000000000000,18)
    console.log(typeof b)

}

main()