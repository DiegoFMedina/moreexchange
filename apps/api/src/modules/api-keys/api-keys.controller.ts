// PATH: apps/api/src/modules/api-keys/api-keys.controller.ts
// DESC: Controlador de API Keys — todos los endpoints requieren JWT

import { Body, Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthReq {
  user: { id: string };
}

@ApiTags('api-keys')
@Controller('api-keys')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  @ApiOperation({ summary: 'Listar mis API Keys activas [JWT]' })
  findAll(@Request() req: AuthReq) {
    return this.apiKeysService.findAllByUser(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear nueva API Key — el valor plano se muestra UNA sola vez [JWT]' })
  create(@Body() dto: CreateApiKeyDto, @Request() req: AuthReq) {
    return this.apiKeysService.create(dto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revocar API Key [JWT]' })
  revoke(@Param('id') id: string, @Request() req: AuthReq) {
    return this.apiKeysService.revoke(id, req.user.id);
  }
}
