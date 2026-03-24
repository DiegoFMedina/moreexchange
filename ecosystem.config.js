// PATH: ecosystem.config.js
// DESC: Configuración PM2 para gestionar los procesos web (Next.js) y api (NestJS) en producción

require('dotenv').config();

module.exports = {
  apps: [
    {
      name: 'cambios-web',
      script: 'pnpm',
      args: 'run start',
      cwd: './apps/web',
      instances: 2,
      exec_mode: 'cluster',
      max_memory_restart: '512M',
      restart_delay: 3000,
      max_restarts: 10,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT_WEB || 3000,
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      },
      error_file: '/var/log/cambios/web-error.log',
      out_file: '/var/log/cambios/web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
    },
    {
      name: 'cambios-api',
      script: 'dist/src/main.js',
      cwd: './apps/api',
      instances: 2,
      exec_mode: 'cluster',
      max_memory_restart: '512M',
      restart_delay: 3000,
      max_restarts: 10,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT_API: process.env.PORT_API || 3001,
        DATABASE_URL: process.env.DATABASE_URL,
        REDIS_URL: process.env.REDIS_URL,
        JWT_SECRET: process.env.JWT_SECRET,
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
        JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
        JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
        STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
        ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
        ADMIN_EMAIL: process.env.ADMIN_EMAIL,
      },
      error_file: '/var/log/cambios/api-error.log',
      out_file: '/var/log/cambios/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
    },
  ],
};
