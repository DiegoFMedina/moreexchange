// PATH: apps/api/src/modules/exchange/exchange.controller.ts
// DESC: Controlador de exchange — cálculo público y órdenes autenticadas

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ExchangeService } from './exchange.service';
import { CalculateExchangeDto, CreateOrderDto } from './dto/create-exchange.dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthReq { user: { id: string } }

@ApiTags('exchange')
@Controller('exchange')
export class ExchangeController {
  constructor(private readonly exchangeService: ExchangeService) {}

  @Public()
  @Post('calculate')
  @ApiOperation({ summary: 'Calcular monto resultante sin crear orden (público)' })
  calculate(@Body() dto: CalculateExchangeDto) {
    return this.exchangeService.calculate(dto);
  }

  @Post('order')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Crear orden y PaymentIntent de Stripe [JWT]' })
  createOrder(@Body() dto: CreateOrderDto, @Request() req: AuthReq) {
    return this.exchangeService.createOrder(dto, req.user.id);
  }

  @Get('orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Listar órdenes del usuario autenticado [JWT]' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getOrders(
    @Request() req: AuthReq,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.exchangeService.getOrders(req.user.id, +page, +limit);
  }

  @Get('orders/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Detalle de orden [JWT]' })
  getOrder(@Param('id') id: string, @Request() req: AuthReq) {
    return this.exchangeService.getOrderById(id, req.user.id);
  }
}
