// PATH: apps/api/src/modules/chat/chat.service.ts
// DESC: Servicio de soporte vía tótem — gestiona sesiones, mensajes, adjuntos y tótems

import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ChatStatus, MessageSender } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateTotemDto, UpdateTotemDto } from './dto/create-totem.dto';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Tótems ────────────────────────────────────────────────────────────────

  async createTotem(dto: CreateTotemDto) {
    return this.prisma.totem.create({
      data: { name: dto.name, location: dto.location, description: dto.description },
    });
  }

  async getTotems() {
    return this.prisma.totem.findMany({
      include: {
        _count: { select: { sessions: true } },
        sessions: {
          where: { status: ChatStatus.OPEN },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTotem(id: string) {
    const totem = await this.prisma.totem.findUnique({
      where: { id },
      include: { _count: { select: { sessions: true } } },
    });
    if (!totem) throw new NotFoundException('Tótem no encontrado');
    return totem;
  }

  async updateTotem(id: string, dto: UpdateTotemDto) {
    const totem = await this.prisma.totem.findUnique({ where: { id } });
    if (!totem) throw new NotFoundException('Tótem no encontrado');
    return this.prisma.totem.update({ where: { id }, data: dto });
  }

  // ─── Sesiones (cliente) ────────────────────────────────────────────────────

  async createSession(dto: CreateSessionDto) {
    const totem = await this.prisma.totem.findUnique({ where: { id: dto.totemId } });
    if (!totem) throw new NotFoundException('Tótem no encontrado');
    if (!totem.isActive) throw new BadRequestException('El tótem está desactivado');

    const session = await this.prisma.chatSession.create({
      data: {
        totemId: dto.totemId,
        clientName: dto.clientName,
        clientPhone: dto.clientPhone,
      },
      include: { totem: true },
    });

    if (dto.initialMessage?.trim()) {
      await this.prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          content: dto.initialMessage.trim(),
          sender: MessageSender.CLIENT,
        },
      });
    }

    return session;
  }

  async getSessionByToken(token: string) {
    const session = await this.prisma.chatSession.findUnique({
      where: { token },
      include: {
        totem: true,
        messages: {
          include: { attachments: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!session) throw new NotFoundException('Sesión no encontrada');
    return session;
  }

  async getMessages(token: string, since?: string) {
    const session = await this.prisma.chatSession.findUnique({ where: { token } });
    if (!session) throw new NotFoundException('Sesión no encontrada');

    return this.prisma.chatMessage.findMany({
      where: {
        sessionId: session.id,
        ...(since ? { createdAt: { gt: new Date(since) } } : {}),
      },
      include: { attachments: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addClientMessageWithAttachments(
    token: string,
    content: string,
    files: Express.Multer.File[],
  ) {
    if (!content?.trim() && (!files || files.length === 0)) {
      throw new BadRequestException('El mensaje no puede estar vacío');
    }

    const session = await this.prisma.chatSession.findUnique({ where: { token } });
    if (!session) throw new UnauthorizedException('Sesión inválida');
    if (session.status === ChatStatus.CLOSED) {
      throw new BadRequestException('Esta sesión está cerrada');
    }

    return this.prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        content: content?.trim() || '📎 Adjunto',
        sender: MessageSender.CLIENT,
        ...(files.length > 0 && {
          attachments: {
            create: files.map((f) => ({
              filename: f.originalname,
              url: `/uploads/chat/${f.filename}`,
              mimeType: f.mimetype,
              size: f.size,
            })),
          },
        }),
      },
      include: { attachments: true },
    });
  }

  // ─── Sesiones (admin) ──────────────────────────────────────────────────────

  async getAllSessions(
    page: number,
    limit: number,
    filters: { status?: ChatStatus; totemId?: string; search?: string },
  ) {
    const where: Record<string, unknown> = {};
    if (filters.status) where.status = filters.status;
    if (filters.totemId) where.totemId = filters.totemId;
    if (filters.search) {
      where.clientName = { contains: filters.search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.chatSession.findMany({
        where,
        include: {
          totem: { select: { id: true, name: true, location: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { attachments: { select: { id: true } } },
          },
          _count: { select: { messages: true } },
        },
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.chatSession.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async getSessionById(id: string) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id },
      include: {
        totem: true,
        messages: {
          include: { attachments: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!session) throw new NotFoundException('Sesión no encontrada');
    return session;
  }

  async getAdminMessages(sessionId: string, since?: string) {
    const session = await this.prisma.chatSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Sesión no encontrada');

    return this.prisma.chatMessage.findMany({
      where: {
        sessionId,
        ...(since ? { createdAt: { gt: new Date(since) } } : {}),
      },
      include: { attachments: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addAdminMessage(sessionId: string, dto: CreateMessageDto, files: Express.Multer.File[]) {
    const session = await this.prisma.chatSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Sesión no encontrada');
    if (session.status === ChatStatus.CLOSED) {
      throw new BadRequestException('Esta sesión está cerrada');
    }

    if (session.status === ChatStatus.RESOLVED) {
      await this.prisma.chatSession.update({
        where: { id: sessionId },
        data: { status: ChatStatus.OPEN, closedAt: null },
      });
    }

    return this.prisma.chatMessage.create({
      data: {
        sessionId,
        content: dto.content?.trim() || '📎 Adjunto',
        sender: MessageSender.ADMIN,
        ...(files.length > 0 && {
          attachments: {
            create: files.map((f) => ({
              filename: f.originalname,
              url: `/uploads/chat/${f.filename}`,
              mimeType: f.mimetype,
              size: f.size,
            })),
          },
        }),
      },
      include: { attachments: true },
    });
  }

  async updateSessionStatus(id: string, status: ChatStatus) {
    const session = await this.prisma.chatSession.findUnique({ where: { id } });
    if (!session) throw new NotFoundException('Sesión no encontrada');

    return this.prisma.chatSession.update({
      where: { id },
      data: {
        status,
        closedAt:
          status === ChatStatus.CLOSED || status === ChatStatus.RESOLVED ? new Date() : null,
      },
      include: { totem: true },
    });
  }

  async getChatStats() {
    const [totalSessions, openSessions, resolvedSessions, totalMessages] = await Promise.all([
      this.prisma.chatSession.count(),
      this.prisma.chatSession.count({ where: { status: ChatStatus.OPEN } }),
      this.prisma.chatSession.count({ where: { status: ChatStatus.RESOLVED } }),
      this.prisma.chatMessage.count(),
    ]);

    return { totalSessions, openSessions, resolvedSessions, totalMessages };
  }
}
