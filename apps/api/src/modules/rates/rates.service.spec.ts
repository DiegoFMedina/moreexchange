// PATH: apps/api/src/modules/rates/rates.service.spec.ts
// DESC: Tests unitarios del servicio de tasas con Prisma mockeado via jest-mock-extended

import { Test, TestingModule } from '@nestjs/testing';
import { RatesService } from './rates.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RatesCacheService } from './rates.cache.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('RatesService', () => {
  let service: RatesService;
  let prisma: DeepMockProxy<PrismaService>;
  let cache: DeepMockProxy<RatesCacheService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatesService,
        { provide: PrismaService, useValue: mockDeep<PrismaService>() },
        { provide: RatesCacheService, useValue: mockDeep<RatesCacheService>() },
      ],
    }).compile();

    service = module.get<RatesService>(RatesService);
    prisma = module.get(PrismaService);
    cache = module.get(RatesCacheService);
  });

  describe('findAll', () => {
    it('devuelve datos del caché si existen', async () => {
      const mockRates = [{ id: '1', buyRate: 930, sellRate: 940 }];
      cache.getAll.mockResolvedValue(mockRates);

      const result = await service.findAll();

      expect(result).toEqual(mockRates);
      expect(prisma.exchangeRate.findMany).not.toHaveBeenCalled();
    });

    it('consulta la BD si el caché está vacío y guarda el resultado', async () => {
      const mockRates = [{ id: '1', buyRate: 930, sellRate: 940 }];
      cache.getAll.mockResolvedValue(undefined);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prisma.exchangeRate.findMany.mockResolvedValue(mockRates as any);

      const result = await service.findAll();

      expect(result).toEqual(mockRates);
      expect(cache.setAll).toHaveBeenCalledWith(mockRates);
    });
  });

  describe('findByPair', () => {
    it('lanza NotFoundException si el par no existe', async () => {
      cache.getRate.mockResolvedValue(undefined);
      prisma.exchangeRate.findFirst.mockResolvedValue(null);

      await expect(service.findByPair('USD', 'XYZ')).rejects.toThrow(NotFoundException);
    });

    it('devuelve la tasa correctamente', async () => {
      const mockRate = { id: '1', buyRate: 930, sellRate: 940 };
      cache.getRate.mockResolvedValue(undefined);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prisma.exchangeRate.findFirst.mockResolvedValue(mockRate as any);

      const result = await service.findByPair('USD', 'CLP');
      expect(result).toEqual(mockRate);
    });
  });

  describe('remove', () => {
    it('lanza NotFoundException si la tasa no existe', async () => {
      prisma.exchangeRate.findUnique.mockResolvedValue(null);

      await expect(service.remove('invalid-id', 'admin-id')).rejects.toThrow(NotFoundException);
    });
  });
});
