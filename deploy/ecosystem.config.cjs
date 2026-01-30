module.exports = {
  apps: [{
    name: 'outvoted',
    cwd: '/var/www/outvoted/backend',
    script: 'server.js',
    interpreter: 'node',
    env: {
      NODE_ENV: 'production'
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M'
  }]
};
