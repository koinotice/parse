const {
    BigNumber,
    ContractWrappers,
    DecodedLogEvent,
    ExchangeCancelEventArgs,
    ExchangeEvents,
    ExchangeFillEventArgs,
    orderHashUtils,
    SignedOrder,
} = require( '0x.js');

import { providerEngine } from './provider_engine';


// We subscribe to the Exchange Events to remove any filled or cancelled orders
const contractWrappers = new ContractWrappers(providerEngine, { networkId: 4 });
contractWrappers.exchange.subscribe(
    ExchangeEvents.Fill,
    {},
    (err: null | Error, decodedLogEvent?: DecodedLogEvent<ExchangeFillEventArgs>) => {
    if (err) {
        console.log('error:', err);
    } else if (decodedLogEvent) {
        const fillLog = decodedLogEvent.log;
        const orderHash = fillLog.args.orderHash;
        console.log(`Order filled ${fillLog.args.orderHash}`);
        removeOrder(orderHash);
    }
},
);