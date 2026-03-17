// PATH: apps/api/src/modules/api-keys/api-keys.module.ts
// DESC: Módulo de API Keys para integración de terceros

import { Module } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { ApiKeysController } from './api-keys.controller';

@Module({
  controllers: [ApiKeysController],
  providers: [ApiKeysService],
})
export class ApiKeysModule {}
