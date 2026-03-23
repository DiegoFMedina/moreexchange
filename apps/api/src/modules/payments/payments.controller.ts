// PATH: apps/api/src/modules/payments/payments.controller.ts
// DESC: Controlador de pagos — webhook Stripe (sin auth, verifica firma) e historial de pagos

import {
  Controller,
  Get,
  Headers,
  Post,
  Query,
  RawBodyRequest,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request as ExpressRequest } from 'express';

interface AuthReq {
  user: { id: string };
}

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Webhook Stripe — sin auth, verifica firma HMAC' })
  handleWebhook(
    @Request() req: RawBodyRequest<ExpressRequest>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!req.rawBody) {
      return { received: false };
    }
    return this.paymentsService.handleWebhook(req.rawBody, signature);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Historial de pagos del usuario autenticado [JWT]' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getHistory(@Request() req: AuthReq, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.paymentsService.getPaymentHistory(req.user.id, +page, +limit);
  }
}
