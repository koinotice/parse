if (!process.env.docker) {
    require('dotenv').config({
        path: __dirname + '/../server.env'
    });
}

const App = require("./server")
const logger = require('./lib/logger')("HashApp")

async function main() {
    const PORT = process.env.HASH_PORT || 80;
    App.listen(PORT, () => {
        logger.info(`Hash Server listening on port ${PORT}`);
    });
}

main()