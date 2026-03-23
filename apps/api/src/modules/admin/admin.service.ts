// PATH: apps/api/src/modules/admin/admin.service.ts
// DESC: Servicio admin — métricas de negocio, listado de usuarios y transacciones con filtros

import { Injectable } from '@nestjs/common';
import { Prisma, TransactionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [transactionsToday, completedToday, completedThisMonth, mostQueriedRate] =
      await Promise.all([
        this.prisma.transaction.count({
          where: { createdAt: { gte: startOfDay } },
        }),
        this.prisma.transaction.findMany({
          where: { status: TransactionStatus.COMPLETED, createdAt: { gte: startOfDay } },
          select: { fromAmount: true },
        }),
        this.prisma.transaction.findMany({
          where: { status: TransactionStatus.COMPLETED, createdAt: { gte: startOfMonth } },
          select: { fromAmount: true },
        }),
        this.prisma.rateHistory.groupBy({
          by: ['exchangeRateId'],
          _count: { exchangeRateId: true },
          orderBy: { _count: { exchangeRateId: 'desc' } },
          take: 1,
        }),
      ]);

    const volume24h = completedToday.reduce((sum, t) => sum + Number(t.fromAmount), 0);
    const revenueMonth = completedThisMonth.reduce((sum, t) => sum + Number(t.fromAmount), 0);

    let topRate = null;
    if (mostQueriedRate.length > 0) {
      topRate = await this.prisma.exchangeRate.findUnique({
        where: { id: mostQueriedRate[0].exchangeRateId },
        include: {
          fromCurrency: { select: { code: true } },
          toCurrency: { select: { code: true } },
        },
      });
    }

    return {
      transactionsToday,
      volume24h: parseFloat(volume24h.toFixed(2)),
      revenueMonth: parseFloat(revenueMonth.toFixed(2)),
      topRate: topRate ? `${topRate.fromCurrency.code}/${topRate.toCurrency.code}` : null,
    };
  }

  async getUsers(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: Prisma.UserWhereInput = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          isActive: true,
          createdAt: true,
          _count: { select: { transactions: true } },
        },
      }),
      this.prisma.user.count({ where }),
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

  async updateUser(id: string, isActive: boolean) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: { id: true, email: true, isActive: true },
    });
  }

  async getTransactions(
    page = 1,
    limit = 20,
    filters: {
      status?: TransactionStatus;
      fromDate?: string;
      toDate?: string;
      userId?: string;
      currencyId?: string;
    } = {},
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.TransactionWhereInput = {};

    if (filters.status) where.status = filters.status;
    if (filters.userId) where.userId = filters.userId;
    if (filters.fromDate || filters.toDate) {
      where.createdAt = {
        ...(filters.fromDate ? { gte: new Date(filters.fromDate) } : {}),
        ...(filters.toDate ? { lte: new Date(filters.toDate) } : {}),
      };
    }
    if (filters.currencyId) {
      where.OR = [{ fromCurrencyId: filters.currencyId }, { toCurrencyId: filters.currencyId }];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.transaction.count({ where }),
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
