// PATH: apps/api/src/modules/api-keys/api-keys.service.ts
// DESC: Servicio de API Keys — genera claves seguras, guarda solo el hash SHA-256, revoca por ID

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(userId: string) {
    return this.prisma.apiKey.findMany({
      where: { userId, isActive: true },
      select: {
        id: true,
        name: true,
        lastUsedAt: true,
        expiresAt: true,
        rateLimit: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateApiKeyDto, userId: string) {
    const rawKey = `mex_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const apiKey = await this.prisma.apiKey.create({
      data: {
        userId,
        name: dto.name,
        keyHash,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
      select: {
        id: true,
        name: true,
        expiresAt: true,
        rateLimit: true,
        createdAt: true,
      },
    });

    return {
      ...apiKey,
      key: rawKey,
      warning: 'Guarda esta clave ahora — no se mostrará de nuevo.',
    };
  }

  async revoke(id: string, userId: string) {
    const existing = await this.prisma.apiKey.findUnique({ where: { id } });

    if (!existing || !existing.isActive) {
      throw new NotFoundException('API Key no encontrada');
    }

    if (existing.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para revocar esta clave');
    }

    await this.prisma.apiKey.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'API Key revocada correctamente' };
  }
}
