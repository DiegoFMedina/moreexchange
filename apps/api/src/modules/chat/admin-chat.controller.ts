// PATH: apps/api/src/modules/chat/admin-chat.controller.ts
// DESC: Endpoints del panel admin para el módulo de soporte — requiere rol ADMIN

import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ChatStatus, Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateTotemDto, UpdateTotemDto } from './dto/create-totem.dto';
import { UpdateSessionStatusDto } from './dto/update-session.dto';

@ApiTags('admin-chat')
@Controller('admin/chat')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth('access-token')
export class AdminChatController {
  constructor(private readonly chatService: ChatService) {}

  // ─── Stats ─────────────────────────────────────────────────────────────────

  @Get('stats')
  @ApiOperation({ summary: '[ADMIN] Estadísticas del módulo de soporte' })
  getStats() {
    return this.chatService.getChatStats();
  }

  // ─── Tótems ─────────────────────────────────────────────────────────────────

  @Get('totems')
  @ApiOperation({ summary: '[ADMIN] Listar tótems' })
  getTotems() {
    return this.chatService.getTotems();
  }

  @Post('totems')
  @ApiOperation({ summary: '[ADMIN] Crear nuevo tótem' })
  createTotem(@Body() dto: CreateTotemDto) {
    return this.chatService.createTotem(dto);
  }

  @Patch('totems/:id')
  @ApiOperation({ summary: '[ADMIN] Actualizar tótem (nombre, ubicación, estado)' })
  updateTotem(@Param('id') id: string, @Body() dto: UpdateTotemDto) {
    return this.chatService.updateTotem(id, dto);
  }

  // ─── Sesiones ────────────────────────────────────────────────────────────────

  @Get('sessions')
  @ApiOperation({ summary: '[ADMIN] Listar sesiones con filtros' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ChatStatus })
  @ApiQuery({ name: 'totemId', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  getSessions(
    @Query('page') page = 1,
    @Query('limit') limit = 30,
    @Query('status') status?: ChatStatus,
    @Query('totemId') totemId?: string,
    @Query('search') search?: string,
  ) {
    return this.chatService.getAllSessions(+page, +limit, { status, totemId, search });
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: '[ADMIN] Detalle de sesión con todos sus mensajes' })
  getSession(@Param('id') id: string) {
    return this.chatService.getSessionById(id);
  }

  @Get('sessions/:id/messages')
  @ApiOperation({ summary: '[ADMIN] Polling de mensajes nuevos (admin)' })
  getMessages(@Param('id') id: string, @Query('since') since?: string) {
    return this.chatService.getAdminMessages(id, since);
  }

  @Post('sessions/:id/messages')
  @ApiOperation({ summary: '[ADMIN] Responder en una sesión (soporta adjuntos)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('attachments', 5))
  sendMessage(
    @Param('id') id: string,
    @Body() dto: CreateMessageDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.chatService.addAdminMessage(id, dto, files ?? []);
  }

  @Patch('sessions/:id/status')
  @ApiOperation({ summary: '[ADMIN] Cambiar estado de sesión (OPEN/RESOLVED/CLOSED)' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateSessionStatusDto) {
    return this.chatService.updateSessionStatus(id, dto.status);
  }
}
