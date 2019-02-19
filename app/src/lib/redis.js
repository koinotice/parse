'use strict';

const assert = require('assert');
const Redis = require('ioredis');
const _ = require('lodash');
const isJSON = require('is-json');
const utils = require('./utils');
const is = require('is-type-of');

Redis.Command.setArgumentTransformer('hmset', function(args) {
  if (args.length === 2) {
    if (typeof Map !== 'undefined' && args[1] instanceof Map) {
      // utils is a internal module of ioredis
      return [ args[0] ].concat(utils.convertMapToArray(args[1]));
    }
    if (typeof args[1] === 'object' && args[1] !== null) {
      args[1] = _.mapValues(args[1], function(n) {

        return (is.array(n) || is.object(n)) ? JSON.stringify(n) : n;
      });

      return [ args[0] ].concat(utils.convertObjectToArray(args[1]));
    }
  }
  return args;
});

Redis.Command.setReplyTransformer('hgetall', function(result) {

  if (Array.isArray(result)) {
    const obj = {};
    for (let i = 0; i < result.length; i += 2) {
      obj[result[i]] = isJSON(result[i + 1]) ? JSON.parse(result[i + 1]) : result[i + 1];
    }
    return obj;
  }
  return result;
});
Redis.Command.setArgumentTransformer('hset', function(args) {

  if (args.length === 3) {
    if (typeof args[2] === 'object' && args[2] !== null) {
      args[2] = JSON.stringify(args[2]);
    }
  }
  return args;
});

Redis.Command.setReplyTransformer('hget', function(result) {

  result = isJSON(result) ? JSON.parse(result) : result;

  return result;
});




const {
    REDIS_HOST,
    REDIS_PORT,
    REDIS_PASSWORD,
    REDIS_IO_URL
} = process.env;


const client = new Redis(REDIS_IO_URL);
client.on('connect', function () {
    console.info('redis connect success on ');
});
client.on('error', function (error) {
    console.error(error);
});

module.exports =   {
  client
};
