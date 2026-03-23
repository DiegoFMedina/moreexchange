// PATH: apps/api/src/app.module.ts
// DESC: Módulo raíz de NestJS — configuración global, caché en memoria, throttler y todos los módulos de dominio

import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { RatesModule } from './modules/rates/rates.module';
import { ExchangeModule } from './modules/exchange/exchange.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { UsersModule } from './modules/users/users.module';
import { AdminModule } from './modules/admin/admin.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';
import { ChatModule } from './modules/chat/chat.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),

    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: () => [
        { name: 'public', ttl: 60000, limit: 100 },
        { name: 'auth', ttl: 60000, limit: 20 },
        { name: 'api-key', ttl: 60000, limit: 500 },
      ],
    }),

    // Cache en memoria — suficiente para desarrollo y demo
    CacheModule.register({
      isGlobal: true,
      ttl: 30000,
      max: 200,
    }),

    // Archivos estáticos para adjuntos del chat
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),

    PrismaModule,
    AuthModule,
    RatesModule,
    ExchangeModule,
    PaymentsModule,
    UsersModule,
    AdminModule,
    ApiKeysModule,
    ChatModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
