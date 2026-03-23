// PATH: apps/api/src/modules/chat/dto/create-totem.dto.ts
// DESC: DTO para crear y actualizar tótems/cajeros

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTotemDto {
  @ApiProperty({ description: 'Nombre del tótem', example: 'Tótem Sucursal Centro' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Ubicación física del tótem',
    example: 'Sucursal Av. Providencia 1234',
  })
  @IsString()
  @IsNotEmpty()
  location!: string;

  @ApiPropertyOptional({ description: 'Descripción adicional del tótem' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateTotemDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
