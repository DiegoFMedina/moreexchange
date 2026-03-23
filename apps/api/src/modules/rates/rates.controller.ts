// PATH: apps/api/src/modules/rates/rates.controller.ts
// DESC: Controlador de tasas — rutas públicas con caché y rutas admin para CRUD e historial

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import { RatesService } from './rates.service';
import { CreateRateDto } from './dto/create-rate.dto';
import { UpdateRateDto } from './dto/update-rate.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

interface AuthReq {
  user: { id: string };
}

@ApiTags('rates')
@Controller('rates')
export class RatesController {
  constructor(private readonly ratesService: RatesService) {}

  @Public()
  @Get()
  @Throttle({ public: { limit: 100, ttl: 60000 } })
  @ApiOperation({ summary: 'Listar todas las tasas activas (caché 30s)' })
  findAll() {
    return this.ratesService.findAll();
  }

  @Public()
  @Get(':from/:to')
  @Throttle({ public: { limit: 100, ttl: 60000 } })
  @ApiOperation({ summary: 'Obtener tasa específica por par de divisas' })
  @ApiParam({ name: 'from', example: 'USD' })
  @ApiParam({ name: 'to', example: 'CLP' })
  findByPair(@Param('from') from: string, @Param('to') to: string) {
    return this.ratesService.findByPair(from, to);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[ADMIN] Crear nueva tasa de cambio' })
  create(@Body() dto: CreateRateDto, @Request() req: AuthReq) {
    return this.ratesService.create(dto, req.user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[ADMIN] Actualizar buyRate y/o sellRate — invalida caché' })
  update(@Param('id') id: string, @Body() dto: UpdateRateDto, @Request() req: AuthReq) {
    return this.ratesService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[ADMIN] Desactivar tasa (soft delete)' })
  remove(@Param('id') id: string, @Request() req: AuthReq) {
    return this.ratesService.remove(id, req.user.id);
  }

  @Get(':id/history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '[ADMIN] Historial de cambios paginado de una tasa' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getHistory(@Param('id') id: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.ratesService.getHistory(id, +page, +limit);
  }
}
