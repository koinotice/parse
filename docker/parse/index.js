let express = require('express');
let ParseServer = require('parse-server').ParseServer;
let ParseDashboard = require('parse-dashboard');
let db = require("./database");
let app = express();
let parseArray = process.env.APP_IDS.split(',');
let dashboardArray = [];


console.log(process.env)
// Parse Server
parseArray.forEach(appId =>
{
    dashboardArray.push({
        'serverURL': `/app/${appId}`,
        'masterKey': process.env.PARSE_MASTER_KEY,
        'appId': appId,
        'appName': appId
    });

    let parseApp = new ParseServer({
        //serverURL: process.env.SERVER_URL,
        masterKey: process.env.PARSE_MASTER_KEY,
        appId: appId,
        databaseURI: db.buildConnectionUrl(process.env, appId),
        liveQuery: {
            classNames: ["Room", "Order","Token","Block"] // List of classes to support for query subscriptions
        }
       // cloud: "./cloud/"+appId,
    });

    // Serve the Parse apps on the /app URL prefix
    app.use(`/app/${appId}`, parseApp);
});

// Parse Dashboard
let dashboard = new ParseDashboard({
    'apps': dashboardArray,
    'users': [{
        'user': process.env.DASHBOARD_USERNAME,
        'pass': process.env.DASHBOARD_PASSWORD
    }]
}, {
    allowInsecureHTTP: true
});

app.use('/dashboard/', dashboard);

// Parse Server plays nicely with the rest of your web routes
app.get('/', (req, res) => res.status(200).send('Welcome to Parse Server'));

let port = process.env.PARSE_PORT || 1337;
app.listen(port, () => console.log(`Parse Server is running on port ${port}.`));
