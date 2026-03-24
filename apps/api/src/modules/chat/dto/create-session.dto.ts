// PATH: apps/api/src/modules/chat/dto/create-session.dto.ts
// DESC: DTO para crear una sesión de soporte desde el QR del tótem

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateSessionDto {
  @ApiProperty({ description: 'ID del tótem que genera el QR' })
  @IsString()
  @IsNotEmpty()
  totemId!: string;

  @ApiProperty({ description: 'Nombre del cliente', minLength: 2 })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  clientName!: string;

  @ApiPropertyOptional({ description: 'Teléfono del cliente (opcional)' })
  @IsString()
  @IsOptional()
  clientPhone?: string;

  @ApiPropertyOptional({ description: 'Mensaje inicial al abrir la sesión' })
  @IsString()
  @IsOptional()
  initialMessage?: string;

  @ApiPropertyOptional({
    description: 'Token de la sesión anterior (para vincular tickets del mismo cliente)',
  })
  @IsString()
  @IsOptional()
  relatedSessionToken?: string;
}
