const {providerEngine} = require('./provide');

//
// // We subscribe to the Exchange Events to remove any filled or cancelled orders
// const contractWrappers = new ContractWrappers(providerEngine, { networkId: 4 });
// contractWrappers.exchange.subscribe(
//     ExchangeEvents.Fill,
//     {},
//     (err: null | Error, decodedLogEvent?: DecodedLogEvent<ExchangeFillEventArgs>) => {
//     if (err) {
//         console.log('error:', err);
//     } else if (decodedLogEvent) {
//         const fillLog = decodedLogEvent.log;
//         const orderHash = fillLog.args.orderHash;
//         console.log(`Order filled ${fillLog.args.orderHash}`);
//         removeOrder(orderHash);
//     }
// },
// );

// import {
//     BigNumber,
//     ContractWrappers,
//     DecodedLogEvent,
//     ExchangeCancelEventArgs,
//     ExchangeEvents,
//     ExchangeFillEventArgs,
//     orderHashUtils,
//     SignedOrder,
// } from '0x.js';
providerEngine.on('block', async function (block) {
     console.log(Number.parseInt(block.number.toString('hex'), 16))
})

async function main() {
   // const a=await providerEngine.getAccountsAsync ()
    //console.log(providerEngine)
}
main()