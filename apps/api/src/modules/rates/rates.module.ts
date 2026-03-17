// PATH: apps/api/src/modules/rates/rates.module.ts
// DESC: Módulo de tasas de cambio con caché en memoria integrado

import { Module } from '@nestjs/common';
import { RatesService } from './rates.service';
import { RatesController } from './rates.controller';
import { RatesCacheService } from './rates.cache.service';

@Module({
  controllers: [RatesController],
  providers: [RatesService, RatesCacheService],
  exports: [RatesService, RatesCacheService],
})
export class RatesModule {}
