'use strict';

const Parse = require('parse/node');

const {
    REDIS_HOST,
    REDIS_PORT,
    REDIS_PASSWORD,
    REDIS_IO_URL
} = process.env;

Parse.initialize("pmker","pmker", "Zheli123");

Parse.serverURL = 'http://parse:1337/app/pmker'


module.exports =   {
    Parse
};
