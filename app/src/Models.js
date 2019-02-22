const {Datastore} = require("nedb-async-await");

const Contract = Datastore({
    filename: './db/contract.json',
    autoload: true
});

const Block = Datastore({
    filename: './db/block.json',
    autoload: true
});

module.exports={
    Contract,
    Block
}
