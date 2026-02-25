module.exports = {
  apps: [
    {
      name: 'et-id-api',
      script: 'src/api_server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'et-id-bot',
      script: 'npm',
      args: 'run dev',
      cwd: 'tg-bot',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    },
    {
      name: 'et-id-cleanup',
      script: 'src/utils/cleanup.js',
      instances: 1,
      cron_restart: '0 0 * * *', // Run every midnight
      autorestart: false,
      watch: false
    }
  ]
};
