// PATH: apps/api/src/modules/rates/dto/update-rate.dto.ts
// DESC: DTO para actualizar buyRate y/o sellRate de una tasa existente

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateRateDto {
  @ApiPropertyOptional({ example: 932.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @IsPositive()
  buyRate?: number;

  @ApiPropertyOptional({ example: 942.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @IsPositive()
  sellRate?: number;
}
