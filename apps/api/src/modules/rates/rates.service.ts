// PATH: apps/api/src/modules/rates/rates.service.ts
// DESC: Servicio de tasas — CRUD, historial, caché Redis y registro automático de RateHistory

import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RatesCacheService } from './rates.cache.service';
import { CreateRateDto } from './dto/create-rate.dto';
import { UpdateRateDto } from './dto/update-rate.dto';

/** Convierte Decimal de Prisma a number para la respuesta JSON (evita NaN en el frontend). */
function toPlainRate(rate: {
  buyRate: unknown;
  sellRate: unknown;
  spread: unknown;
  [k: string]: unknown;
}) {
  return {
    ...rate,
    buyRate: Number(rate.buyRate),
    sellRate: Number(rate.sellRate),
    spread: Number(rate.spread),
  };
}

@Injectable()
export class RatesService {
  private readonly logger = new Logger(RatesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RatesCacheService,
  ) {}

  async findAll() {
    const cached = await this.cache.getAll<unknown[]>();
    if (cached?.length) return cached;

    const rates = await this.prisma.exchangeRate.findMany({
      where: { isActive: true },
      include: {
        fromCurrency: {
          select: { code: true, name: true, symbol: true, flagEmoji: true, decimals: true },
        },
        toCurrency: {
          select: { code: true, name: true, symbol: true, flagEmoji: true, decimals: true },
        },
      },
      orderBy: [{ fromCurrency: { code: 'asc' } }, { toCurrency: { code: 'asc' } }],
    });

    const serialized = rates.map(toPlainRate);
    await this.cache.setAll(serialized);
    return serialized;
  }

  async findByPair(from: string, to: string) {
    const cached = await this.cache.getRate<unknown>(from, to);
    if (cached) return cached;

    const rate = await this.prisma.exchangeRate.findFirst({
      where: {
        isActive: true,
        fromCurrency: { code: from.toUpperCase() },
        toCurrency: { code: to.toUpperCase() },
      },
      include: {
        fromCurrency: {
          select: { code: true, name: true, symbol: true, flagEmoji: true, decimals: true },
        },
        toCurrency: {
          select: { code: true, name: true, symbol: true, flagEmoji: true, decimals: true },
        },
      },
    });

    if (!rate) {
      throw new NotFoundException(`Tasa ${from}/${to} no encontrada`);
    }

    const serialized = toPlainRate(rate);
    await this.cache.setRate(from, to, serialized);
    return serialized;
  }

  async create(dto: CreateRateDto, adminId: string) {
    const existing = await this.prisma.exchangeRate.findUnique({
      where: {
        fromCurrencyId_toCurrencyId: {
          fromCurrencyId: dto.fromCurrencyId,
          toCurrencyId: dto.toCurrencyId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Ya existe una tasa para este par de divisas');
    }

    const spread = parseFloat(((dto.sellRate - dto.buyRate) / dto.sellRate).toFixed(4));

    const rate = await this.prisma.exchangeRate.create({
      data: {
        fromCurrencyId: dto.fromCurrencyId,
        toCurrencyId: dto.toCurrencyId,
        buyRate: dto.buyRate,
        sellRate: dto.sellRate,
        spread,
        updatedById: adminId,
      },
      include: {
        fromCurrency: { select: { code: true, name: true, symbol: true, flagEmoji: true } },
        toCurrency: { select: { code: true, name: true, symbol: true, flagEmoji: true } },
      },
    });

    await this.prisma.rateHistory.create({
      data: {
        exchangeRateId: rate.id,
        buyRate: dto.buyRate,
        sellRate: dto.sellRate,
        changedById: adminId,
      },
    });

    await this.cache.invalidate();
    this.logger.log(`Tasa creada: ${rate.id} por admin ${adminId}`);
    return toPlainRate(rate);
  }

  async update(id: string, dto: UpdateRateDto, adminId: string) {
    const existing = await this.prisma.exchangeRate.findUnique({ where: { id } });
    if (!existing || !existing.isActive) {
      throw new NotFoundException('Tasa no encontrada');
    }

    const newBuyRate = dto.buyRate ?? Number(existing.buyRate);
    const newSellRate = dto.sellRate ?? Number(existing.sellRate);
    const spread = parseFloat(((newSellRate - newBuyRate) / newSellRate).toFixed(4));

    const [updated] = await this.prisma.$transaction([
      this.prisma.exchangeRate.update({
        where: { id },
        data: { buyRate: newBuyRate, sellRate: newSellRate, spread, updatedById: adminId },
        include: {
          fromCurrency: { select: { code: true, name: true, symbol: true, flagEmoji: true } },
          toCurrency: { select: { code: true, name: true, symbol: true, flagEmoji: true } },
        },
      }),
      this.prisma.rateHistory.create({
        data: {
          exchangeRateId: id,
          buyRate: newBuyRate,
          sellRate: newSellRate,
          changedById: adminId,
        },
      }),
    ]);

    await this.cache.invalidate();
    this.logger.log(`Tasa actualizada: ${id} por admin ${adminId}`);
    return toPlainRate(updated);
  }

  async remove(id: string, adminId: string) {
    const existing = await this.prisma.exchangeRate.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Tasa no encontrada');

    await this.prisma.exchangeRate.update({
      where: { id },
      data: { isActive: false, updatedById: adminId },
    });

    await this.cache.invalidate();
    this.logger.log(`Tasa desactivada: ${id} por admin ${adminId}`);
    return { message: 'Tasa desactivada correctamente' };
  }

  async getHistory(id: string, page = 1, limit = 20) {
    const existing = await this.prisma.exchangeRate.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Tasa no encontrada');

    const skip = (page - 1) * limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.rateHistory.findMany({
        where: { exchangeRateId: id },
        orderBy: { changedAt: 'desc' },
        skip,
        take: limit,
        include: {
          changedBy: { select: { email: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.rateHistory.count({ where: { exchangeRateId: id } }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }
}
