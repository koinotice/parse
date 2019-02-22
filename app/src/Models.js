const {Datastore} = require("nedb-async-await");

const Contract = Datastore({
    filename: __dirname+'/db/contract.json',
    autoload: true
});



module.exports={
    Contract

}
