module.exports = {
    apps: [
        {
            name: 'HashApi',
            script: 'src/app.js',

            // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
            //args: 'one two',
            instances: 1,
            autorestart: true,
            watch: ['./src/server.js'],
            ignore_watch: ["./src/db"],
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'development'
            },
            env_production: {
                NODE_ENV: 'production'
            }
        },
        {
            name: 'HashWatch',
            script: 'src/watch.js',

            // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
            //args: 'one two',
            instances: 1,
            autorestart: true,
            watch: ['./src/watch.js', "./src/HashDice.js","./src/EventBot.js"],
            ignore_watch: ["./src/db"],
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'development'
            },
            env_production: {
                NODE_ENV: 'production'
            }
        },
        {
            name: 'HashTask',
            script: 'src/task.js',

            instances: 1,
            autorestart: true,
            watch: ['./src/task.js', "./src/HashTask.js"],
            ignore_watch: ["./src/db"],
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'development'
            },
            env_production: {
                NODE_ENV: 'production'
            }
        },{
            name: 'HashInit',
            script: 'src/task.js',

            instances: 1,
            autorestart: true,
            watch: ['./src/init.js', "./src/HashInit.js"],
            ignore_watch: ["./src/db"],
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'development'
            },
            env_production: {
                NODE_ENV: 'production'
            }
        },{
            name: 'HashEvent',
            script: 'src/Events.js',

            instances: 2,
            autorestart: true,
            watch: ['./src/Events.js' ],
            ignore_watch: ["./src/db"],
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'development'
            },
            env_production: {
                NODE_ENV: 'production'
            }
        }

    ],

    deploy: {
        production: {
            user: 'root',
            host: '47.88.60.116',
            ref: 'origin/master',
            repo: 'git@github.com:koinotice/hash.git',
            path: '/koinotice/hash',
            'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
        }
    }
};
