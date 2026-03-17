// PATH: apps/api/src/modules/rates/dto/create-rate.dto.ts
// DESC: DTO para crear una nueva tasa de cambio entre dos divisas

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRateDto {
  @ApiProperty({ example: 'clid_usd' })
  @IsString()
  @IsNotEmpty()
  fromCurrencyId!: string;

  @ApiProperty({ example: 'clid_clp' })
  @IsString()
  @IsNotEmpty()
  toCurrencyId!: string;

  @ApiProperty({ example: 930.0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @IsPositive()
  buyRate!: number;

  @ApiProperty({ example: 940.0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @IsPositive()
  sellRate!: number;
}
