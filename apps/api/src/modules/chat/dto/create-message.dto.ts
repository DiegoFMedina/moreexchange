// PATH: apps/api/src/modules/chat/dto/create-message.dto.ts
// DESC: DTO para enviar un mensaje en una sesión de chat

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({ description: 'Contenido del mensaje' })
  @IsString()
  @IsNotEmpty()
  content!: string;
}
