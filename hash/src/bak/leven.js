if (!process.env.docker) {
    require('dotenv').config({
        path: __dirname + '/../server.env'
    });
}
const {
    NAT_URL,
    WALLET_MNEMONIC,
    SOCKET_PROVIDER_URI,
    DEPLOYMENT_GAS_LIMIT,
    HTTP_PROVIDER_URI
} = process.env;

const {engine,provider,initContract,web3,hashDice}=require("./engine")

async function main() {
    const accounts = provider.getAddresses()
    // const account = accounts[1]
    // console.log(accounts, account)

    // const account = await web3.eth.getAccounts(function(e){
    //     console.log(e)
    // })
     const HashContract=await initContract()

     //let room = await HashContract.GetRoomInfo(16) ;
     let room = await hashDice.methods.GetRoomInfo(16).call() ;
     console.log(room)

    //
    // const order = await HashContract.SubmitBetOrder(1, 0, "0x1", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], {
    //     from: accounts[0],
    //     gas: DEPLOYMENT_GAS_LIMIT
    // });


   // console.log("order test", order)
    // //


}

async function main1() {
    const accounts = provider.getAddresses()
    const account = accounts[1]
    console.log(accounts, account)


}

main();