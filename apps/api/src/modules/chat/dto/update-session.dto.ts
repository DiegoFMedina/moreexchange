// PATH: apps/api/src/modules/chat/dto/update-session.dto.ts
// DESC: DTO para actualizar el estado de una sesión de soporte

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ChatStatus } from '@prisma/client';

export class UpdateSessionStatusDto {
  @ApiProperty({ enum: ChatStatus, description: 'Nuevo estado de la sesión' })
  @IsEnum(ChatStatus)
  status!: ChatStatus;
}
