// PATH: apps/api/src/modules/payments/payments.module.ts
// DESC: Módulo de pagos — expone StripeService para ser usado por ExchangeModule

import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { StripeService } from './stripe.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, StripeService],
  exports: [StripeService, PaymentsService],
})
export class PaymentsModule {}
