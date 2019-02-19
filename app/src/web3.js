require('dotenv').config();
const Web3Utils = require('web3-utils');
const RPC_URL = process.env.RPC_URL;
const Web3 = require('web3');
const homeProvider = new Web3.providers.HttpProvider(RPC_URL);
const web3 = new Web3(homeProvider);
const GAS_PRICE = Web3Utils.toWei(process.env.DEPLOYMENT_GAS_PRICE, 'gwei');
const GAS_LIMIT = process.env.DEPLOYMENT_GAS_LIMIT;
const GET_RECEIPT_INTERVAL_IN_MILLISECONDS = process.env.GET_RECEIPT_INTERVAL_IN_MILLISECONDS;
const DEPLOYMENT_ACCOUNT_ADDRESS = process.env.DEPLOYMENT_ACCOUNT_ADDRESS;
const DEPLOYMENT_ACCOUNT_PRIVATE_KEY= process.env.DEPLOYMENT_ACCOUNT_PRIVATE_KEY;
const deploymentPrivateKey = Buffer.from(DEPLOYMENT_ACCOUNT_PRIVATE_KEY, 'hex')


module.exports = {
  web3,
  deploymentPrivateKey,
  RPC_URL,
  GAS_LIMIT,
  GAS_PRICE,
  GET_RECEIPT_INTERVAL_IN_MILLISECONDS
}
