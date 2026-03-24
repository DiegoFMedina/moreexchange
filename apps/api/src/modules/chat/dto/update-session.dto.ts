// PATH: apps/api/src/modules/chat/dto/update-session.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ChatStatus, FaultType } from '@prisma/client';

export class UpdateSessionStatusDto {
  @ApiProperty({ enum: ChatStatus, description: 'Nuevo estado de la sesión' })
  @IsEnum(ChatStatus)
  status!: ChatStatus;

  @ApiPropertyOptional({ enum: FaultType, description: 'Tipo de fallo (requerido al cerrar)' })
  @IsOptional()
  @IsEnum(FaultType)
  faultType?: FaultType;

  @ApiPropertyOptional({ description: 'Nota de cierre del agente' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  closingNote?: string;
}

export class FillTransferDataDto {
  @ApiPropertyOptional() @IsOptional() @IsString() bankName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() accountType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() accountNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() rut?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() accountHolder?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() amount?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
