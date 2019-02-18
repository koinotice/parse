'use strict';

const Parse = require('parse/node');


Parse.initialize("pmker","pmker", "Zheli123");
//javascriptKey is required only if you have it on server.

Parse.serverURL = 'http://localhost:7311/app/pmker'

module.exports =   {
    Parse
};
