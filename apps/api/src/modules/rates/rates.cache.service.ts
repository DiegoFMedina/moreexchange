// PATH: apps/api/src/modules/rates/rates.cache.service.ts
// DESC: Servicio de caché en memoria para tasas públicas — TTL de 30 segundos con invalidación inmediata al actualizar

import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

const RATES_CACHE_KEY = 'public:rates:all';
const RATES_TTL_MS = 30_000;

@Injectable()
export class RatesCacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async getAll<T>(): Promise<T | undefined> {
    return this.cache.get<T>(RATES_CACHE_KEY);
  }

  async setAll<T>(data: T): Promise<void> {
    await this.cache.set(RATES_CACHE_KEY, data, RATES_TTL_MS);
  }

  async invalidate(): Promise<void> {
    await this.cache.del(RATES_CACHE_KEY);
  }

  rateKey(from: string, to: string): string {
    return `public:rates:${from.toUpperCase()}:${to.toUpperCase()}`;
  }

  async getRate<T>(from: string, to: string): Promise<T | undefined> {
    return this.cache.get<T>(this.rateKey(from, to));
  }

  async setRate<T>(from: string, to: string, data: T): Promise<void> {
    await this.cache.set(this.rateKey(from, to), data, RATES_TTL_MS);
  }

  async invalidateRate(from: string, to: string): Promise<void> {
    await this.cache.del(this.rateKey(from, to));
  }
}
