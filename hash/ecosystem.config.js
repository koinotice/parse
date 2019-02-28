module.exports = {
    apps: [
        {
            name: 'HashApp',
            script: 'src/HashApp.js',
            instances: 1,
            autorestart: true,
            watch: ['./src/_server.js'],
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'development'
            },
            env_production: {
                NODE_ENV: 'production'
            }
        },
        {
            name: 'HashDice',
            script: 'src/dice.js',
            instances: 1,
            autorestart: true,
            watch: ['./src/dice.js', "./src/HashDice.js" ],
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
            script: 'src/init.js',
            instances: 1,
            autorestart: true,
            watch: ['./src/init.js', "./src/HashInit.js"],

            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'development'
            },
            env_production: {
                NODE_ENV: 'production'
            }
        },{
            name: 'HashEvent',
            script: 'src/HashEvent.js',
            instances: 1,
            autorestart: true,
            watch: ['./src/HashEvent.js' ],
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
