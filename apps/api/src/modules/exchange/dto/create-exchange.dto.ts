// PATH: apps/api/src/modules/exchange/dto/create-exchange.dto.ts
// DESC: DTO para calcular y crear órdenes de cambio

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsPositive, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CalculateExchangeDto {
  @ApiProperty({ example: 'clid_usd' })
  @IsString()
  @IsNotEmpty()
  fromCurrencyId!: string;

  @ApiProperty({ example: 'clid_clp' })
  @IsString()
  @IsNotEmpty()
  toCurrencyId!: string;

  @ApiProperty({ example: 100 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  fromAmount!: number;
}

export class CreateOrderDto extends CalculateExchangeDto {
  @ApiProperty({ example: 'card' })
  @IsString()
  @IsNotEmpty()
  paymentMethod!: string;

  @ApiPropertyOptional({ example: 'Pago de prueba' })
  @IsOptional()
  @IsString()
  notes?: string;
}
