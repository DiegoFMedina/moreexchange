// PATH: apps/api/src/modules/api-keys/dto/create-api-key.dto.ts
// DESC: DTO para crear una nueva API Key con nombre descriptivo

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsOptional, IsDateString } from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'Integración ERP' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
