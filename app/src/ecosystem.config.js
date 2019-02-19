module.exports = {
    apps: [{
        name: 'HashApi',
        script: 'server.js',

        // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
        //args: 'one two',
        instances: 1,
        autorestart: true,
        watch: true,
        max_memory_restart: '1G',
        env: {
            NODE_ENV: 'development'
        },
        env_production: {
            NODE_ENV: 'production'
        }
    },
        {
            name: 'HashGenv',
            script: 'genv.js',

            instances: 1,
            autorestart: true,
            watch: true,
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
