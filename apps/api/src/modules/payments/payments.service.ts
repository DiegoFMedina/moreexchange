// PATH: apps/api/src/modules/payments/payments.service.ts
// DESC: Servicio de pagos — procesa webhooks Stripe y actualiza estado de transacciones

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StripeService } from './stripe.service';
import { TransactionStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
  ) {}

  handleWebhook(rawBody: Buffer, signature: string) {
    let event;
    try {
      event = this.stripeService.constructWebhookEvent(rawBody, signature);
    } catch (err) {
      this.logger.error(`Webhook firma inválida: ${(err as Error).message}`);
      throw new BadRequestException('Firma de webhook inválida');
    }

    this.processEvent(event).catch((err) => {
      this.logger.error(`Error procesando evento ${event.type}: ${(err as Error).message}`);
    });

    return { received: true };
  }

  private async processEvent(event: { type: string; data: { object: unknown } }) {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(event.data.object as { id: string });
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object as { id: string });
        break;
      default:
        this.logger.debug(`Evento no procesado: ${event.type}`);
    }
  }

  private async handlePaymentSucceeded(paymentIntent: { id: string }) {
    await this.prisma.transaction.updateMany({
      where: { paymentIntentId: paymentIntent.id },
      data: { status: TransactionStatus.COMPLETED },
    });
    this.logger.log(`Transacción completada: paymentIntent=${paymentIntent.id}`);
  }

  private async handlePaymentFailed(paymentIntent: { id: string }) {
    await this.prisma.transaction.updateMany({
      where: { paymentIntentId: paymentIntent.id },
      data: { status: TransactionStatus.FAILED },
    });
    this.logger.warn(`Pago fallido: paymentIntent=${paymentIntent.id}`);
  }

  async getPaymentHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where: {
          userId,
          status: {
            in: [TransactionStatus.COMPLETED, TransactionStatus.FAILED, TransactionStatus.REFUNDED],
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({
        where: {
          userId,
          status: {
            in: [TransactionStatus.COMPLETED, TransactionStatus.FAILED, TransactionStatus.REFUNDED],
          },
        },
      }),
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
