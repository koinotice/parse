const {Datastore} = require("nedb-async-await");

const Contract = Datastore({
    filename: __dirname+'/db/contract.json',
    autoload: true
});

const Block = Datastore({
    filename: __dirname+'/db/block.json',
    autoload: true
});

module.exports={
    Contract,
    Block
}
