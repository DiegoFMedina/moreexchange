// PATH: apps/api/src/common/logger/winston.config.ts
// DESC: Configuración de Winston para logging estructurado JSON en producción y pretty en desarrollo

import * as winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

export const winstonConfig: winston.LoggerOptions = {
  level: isProduction ? 'info' : 'debug',
  format: isProduction
    ? winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      )
    : winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
          const ctx = context ? `[${context}]` : '';
          const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} ${level} ${ctx} ${message}${extra}`;
        }),
      ),
  transports: [
    new winston.transports.Console(),
    ...(isProduction
      ? [
          new winston.transports.File({
            filename: '/var/log/cambios/api-error.log',
            level: 'error',
          }),
          new winston.transports.File({
            filename: '/var/log/cambios/api-combined.log',
          }),
        ]
      : []),
  ],
};
