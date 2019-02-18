'use strict';

const Parse = require('parse/node');


Parse.initialize("app1","pmker", "Zheli123");
//javascriptKey is required only if you have it on server.

Parse.serverURL = 'http://localhost:1337/app/app1'

module.exports =   {
    Parse
};
