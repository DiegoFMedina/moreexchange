// PATH: apps/api/src/modules/exchange/exchange.service.ts
// DESC: Servicio de exchange — cálculo de montos, creación de órdenes con Stripe PaymentIntent

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StripeService } from '../payments/stripe.service';
import { CalculateExchangeDto, CreateOrderDto } from './dto/create-exchange.dto';
import { TransactionStatus } from '@prisma/client';

@Injectable()
export class ExchangeService {
  private readonly logger = new Logger(ExchangeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
  ) {}

  async calculate(dto: CalculateExchangeDto) {
    const rate = await this.prisma.exchangeRate.findFirst({
      where: {
        fromCurrencyId: dto.fromCurrencyId,
        toCurrencyId: dto.toCurrencyId,
        isActive: true,
      },
      include: {
        fromCurrency: { select: { code: true, symbol: true, decimals: true } },
        toCurrency: { select: { code: true, symbol: true, decimals: true } },
      },
    });

    if (!rate) {
      throw new NotFoundException('Par de divisas no disponible');
    }

    const sellRate = Number(rate.sellRate);
    const spread = Number(rate.spread);
    const toAmount = dto.fromAmount * sellRate;
    const spreadAmount = dto.fromAmount * sellRate * spread;

    return {
      fromAmount: dto.fromAmount,
      fromCurrency: rate.fromCurrency,
      toAmount: parseFloat(toAmount.toFixed(rate.toCurrency.decimals)),
      toCurrency: rate.toCurrency,
      rateApplied: sellRate,
      spread: spread,
      spreadAmount: parseFloat(spreadAmount.toFixed(rate.toCurrency.decimals)),
      rateUpdatedAt: rate.updatedAt,
    };
  }

  async createOrder(dto: CreateOrderDto, userId: string) {
    const calcResult = await this.calculate(dto);

    const amountInCents = Math.round(dto.fromAmount * 100);

    const paymentIntent = await this.stripeService.createPaymentIntent({
      amount: amountInCents,
      currency: (calcResult.fromCurrency.code as string).toLowerCase(),
      metadata: {
        userId,
        fromCurrencyId: dto.fromCurrencyId,
        toCurrencyId: dto.toCurrencyId,
        fromAmount: dto.fromAmount.toString(),
        toAmount: calcResult.toAmount.toString(),
        rateApplied: calcResult.rateApplied.toString(),
      },
    });

    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        fromCurrencyId: dto.fromCurrencyId,
        toCurrencyId: dto.toCurrencyId,
        fromAmount: dto.fromAmount,
        toAmount: calcResult.toAmount,
        rateApplied: calcResult.rateApplied,
        status: TransactionStatus.PENDING,
        paymentMethod: dto.paymentMethod,
        paymentIntentId: paymentIntent.id,
        notes: dto.notes,
      },
    });

    this.logger.log(`Orden creada: ${transaction.id} para usuario ${userId}`);

    return {
      transactionId: transaction.id,
      clientSecret: paymentIntent.client_secret,
      calculation: calcResult,
    };
  }

  async getOrders(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.transaction.count({ where: { userId } }),
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

  async getOrderById(id: string, userId: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!transaction) {
      throw new NotFoundException('Orden no encontrada');
    }

    return transaction;
  }
}
