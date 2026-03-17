// PATH: apps/api/src/common/middleware/logger.middleware.ts
// DESC: Middleware de logging HTTP — registra método, URL, status y tiempo de respuesta

import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const start = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const ms = Date.now() - start;
      this.logger.log(`${method} ${originalUrl} ${statusCode} ${ms}ms — ${ip}`);
    });

    next();
  }
}
