'use strict';

const Parse = require('parse/node');


const {

    PARSE_SERVER_URL,
    PARSE_ID,
    PARSE_MASTER_KEY
} = process.env;

Parse.initialize(PARSE_ID,PARSE_ID, PARSE_MASTER_KEY);

Parse.serverURL = PARSE_SERVER_URL+"/"+PARSE_ID

console.log(PARSE_SERVER_URL+"/"+PARSE_ID)

module.exports =   {
    Parse
};
