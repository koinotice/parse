
const TX_DEFAULTS = { gas: 400000 };
const MNEMONIC = 'concert load couple harbor equip island argue ramp clarify fence smart topic';
const BASE_DERIVATION_PATH = `44'/60'/0'/0`;

// export const GANACHE_CONFIGS: NetworkSpecificConfigs = {
//     rpcUrl: 'http://127.0.0.1:8545',
//     networkId: GANACHE_NETWORK_ID,
// };
// export const KOVAN_CONFIGS: NetworkSpecificConfigs = {
//     rpcUrl: 'https://kovan.infura.io/',
//     networkId: KOVAN_NETWORK_ID,
// };
// export const ROPSTEN_CONFIGS: NetworkSpecificConfigs = {
//     rpcUrl: 'https://ropsten.infura.io/',
//     networkId: ROPSTEN_NETWORK_ID,
// };
// export const RINKEBY_CONFIGS: NetworkSpecificConfigs = {
//     rpcUrl: 'https://rinkeby.infura.io/',
//     networkId: RINKEBY_NETWORK_ID,
// };
const NETWORK_CONFIGS = {
    rpcUrl: 'https://rinkeby.infura.io/',
    networkId: 4,
}; // or KOVAN_CONFIGS or ROPSTEN_CONFIGS or RINKEBY_CONFIGS
module.exports={
    TX_DEFAULTS,
    MNEMONIC,
    BASE_DERIVATION_PATH,
    NETWORK_CONFIGS
}