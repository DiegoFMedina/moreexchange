// PATH: apps/api/src/modules/admin/admin.controller.ts
// DESC: Controlador admin — todos los endpoints requieren rol ADMIN

import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role, TransactionStatus } from '@prisma/client';
import { AdminService } from './admin.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class ToggleUserDto {
  @ApiPropertyOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive!: boolean;
}

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth('access-token')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: '[ADMIN] Métricas del negocio' })
  getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  @ApiOperation({ summary: '[ADMIN] Listar usuarios con paginación' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  getUsers(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
  ) {
    return this.adminService.getUsers(+page, +limit, search);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: '[ADMIN] Activar o desactivar usuario' })
  updateUser(@Param('id') id: string, @Body() dto: ToggleUserDto) {
    return this.adminService.updateUser(id, dto.isActive);
  }

  @Get('transactions')
  @ApiOperation({ summary: '[ADMIN] Todas las transacciones con filtros' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: TransactionStatus })
  @ApiQuery({ name: 'fromDate', required: false, type: String })
  @ApiQuery({ name: 'toDate', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'currencyId', required: false, type: String })
  getTransactions(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: TransactionStatus,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('userId') userId?: string,
    @Query('currencyId') currencyId?: string,
  ) {
    return this.adminService.getTransactions(+page, +limit, {
      status,
      fromDate,
      toDate,
      userId,
      currencyId,
    });
  }
}
