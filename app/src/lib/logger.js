const { createLogger, format, transports } = require('winston');
const Transport = require('winston-transport');
const MESSAGE = Symbol.for('message');

function Log(clientid="hash") {
    var stan = require('node-nats-streaming').connect('test-cluster', clientid, {
        url: process.env.NAT_URL
    });

    stan.on('connect', async e => {
        console.log("stan connect",clientid)
    })
    const logger = createLogger({
        level: 'info',
        format: format.combine(
            format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
            }),
            format.errors({stack: true}),
            format.splat(),
            format.json()
        ),
        defaultMeta: {service: clientid},
        transports: [

            new transports.File({filename: '/hash/logs/hash-error.log', level: 'error'}),
            new transports.File({filename: '/hash/logs/hash.log'}),


        ]
    });


//
// Inherit from `winston-transport` so you can take advantage
// of the base functionality and `.exceptions.handle()`.
//
    class CustomTransport extends Transport {
        constructor(opts) {
            super(opts);

            //
            // Consume any custom options here. e.g.:
            // - Connection information for databases
            // - Authentication information for APIs (e.g. loggly, papertrail,
            //   logentries, etc.).
            //
        }

        log(info, callback) {
            //console.log("fuck",info,callback)
            // console.log(info[MESSAGE])
            // console.log(info.message)
            stan.publish("hash.log", (info[MESSAGE]))

            setImmediate(() => {
                this.emit('logged', info);
            });

            // Perform the writing to the remote service

            callback();
        }
    };

//
// If we're not in production then **ALSO** log to the `console`
// with the colorized simple format.
//
    if (process.env.NODE_ENV !== 'production') {
        logger.add(new transports.Console({
            format: format.combine(
                format.colorize(),
                format.simple()
            )
        }));


    }
    logger.add(new CustomTransport())
    return logger
}
module.exports=Log
