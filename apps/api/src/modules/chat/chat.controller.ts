// PATH: apps/api/src/modules/chat/chat.controller.ts
// DESC: Endpoints públicos del chat de soporte — accesibles sin autenticación para los clientes desde los tótems

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CreateSessionDto } from './dto/create-session.dto';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('sessions')
  @ApiOperation({ summary: 'Crear sesión de soporte desde QR del tótem' })
  createSession(@Body() dto: CreateSessionDto) {
    return this.chatService.createSession(dto);
  }

  @Get('sessions/:token')
  @ApiOperation({ summary: 'Obtener sesión y mensajes por token (cliente)' })
  getSession(@Param('token') token: string) {
    return this.chatService.getSessionByToken(token);
  }

  @Get('sessions/:token/messages')
  @ApiOperation({ summary: 'Polling de mensajes nuevos (cliente)' })
  getMessages(@Param('token') token: string, @Query('since') since?: string) {
    return this.chatService.getMessages(token, since);
  }

  @Post('sessions/:token/messages')
  @ApiOperation({ summary: 'Enviar mensaje como cliente (soporta adjuntos)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('attachments', 5))
  sendMessage(
    @Param('token') token: string,
    @Body('content') content: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.chatService.addClientMessageWithAttachments(token, content, files ?? []);
  }

  @Get('totems/:id')
  @ApiOperation({ summary: 'Información pública del tótem (para pantalla bienvenida)' })
  getTotem(@Param('id') id: string) {
    return this.chatService.getTotem(id);
  }
}
