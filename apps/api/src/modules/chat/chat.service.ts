// PATH: apps/api/src/modules/chat/chat.service.ts
// DESC: Servicio de soporte vía tótem — gestiona sesiones, mensajes, adjuntos, tótems y tickets

import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import {
  ChatStatus,
  FaultType,
  MessageSender,
  MessageType,
  TransferRequestStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateTotemDto, UpdateTotemDto } from './dto/create-totem.dto';
import { FillTransferDataDto } from './dto/update-session.dto';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  // Prisma Decimal objects serialize as {s,e,d} in JSON — convert to plain string
  private serializeTransferRequest<T extends { amount?: unknown }>(
    tr: T,
  ): T & { amount?: string | null } {
    if (!tr) return tr;
    return {
      ...tr,
      amount: tr.amount != null ? String(tr.amount) : null,
    };
  }

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

    // Resolver sesión relacionada (ticket anterior del mismo cliente)
    let relatedSessionId: string | undefined;
    if (dto.relatedSessionToken?.trim()) {
      const related = await this.prisma.chatSession.findUnique({
        where: { token: dto.relatedSessionToken.trim() },
        select: { id: true },
      });
      if (related) relatedSessionId = related.id;
    }

    const createdSession = await this.prisma.chatSession.create({
      data: {
        totemId: dto.totemId,
        clientName: dto.clientName,
        clientPhone: dto.clientPhone,
        ...(relatedSessionId ? { relatedSessionId } : {}),
      },
    });

    // Mensaje de sistema para notificar al admin si es sesión vinculada
    if (relatedSessionId) {
      await this.prisma.chatMessage.create({
        data: {
          sessionId: createdSession.id,
          content: `Ticket abierto como continuación de una sesión anterior del mismo cliente.`,
          sender: MessageSender.SYSTEM,
          messageType: MessageType.TEXT,
        },
      });
    }

    if (dto.initialMessage?.trim()) {
      await this.prisma.chatMessage.create({
        data: {
          sessionId: createdSession.id,
          content: dto.initialMessage.trim(),
          sender: MessageSender.CLIENT,
          messageType: MessageType.TEXT,
        },
      });
    }

    return this.prisma.chatSession.findUnique({
      where: { id: createdSession.id },
      include: {
        totem: true,
        messages: {
          include: { attachments: true },
          orderBy: { createdAt: 'asc' },
        },
        transferRequest: true,
        relatedSession: {
          select: {
            id: true,
            token: true,
            clientName: true,
            faultType: true,
            startedAt: true,
            closedAt: true,
            status: true,
          },
        },
      },
    });
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
        transferRequest: true,
        relatedSession: {
          select: {
            id: true,
            token: true,
            clientName: true,
            faultType: true,
            startedAt: true,
            closedAt: true,
            status: true,
          },
        },
        continuedBy: {
          select: { id: true, token: true, status: true, startedAt: true, faultType: true },
          orderBy: { startedAt: 'asc' },
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
              url: `/v1/uploads/chat/${f.filename}`,
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
          transferRequest: { select: { id: true, status: true } },
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
        transferRequest: true,
        relatedSession: {
          select: {
            id: true,
            token: true,
            clientName: true,
            faultType: true,
            closingNote: true,
            startedAt: true,
            closedAt: true,
            status: true,
          },
        },
        continuedBy: {
          select: { id: true, token: true, status: true, startedAt: true, faultType: true },
          orderBy: { startedAt: 'asc' },
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
              url: `/v1/uploads/chat/${f.filename}`,
              mimeType: f.mimetype,
              size: f.size,
            })),
          },
        }),
      },
      include: { attachments: true },
    });
  }

  async updateSessionStatus(
    id: string,
    status: ChatStatus,
    faultType?: FaultType,
    closingNote?: string,
  ) {
    const session = await this.prisma.chatSession.findUnique({ where: { id } });
    if (!session) throw new NotFoundException('Sesión no encontrada');

    const isClosing = status === ChatStatus.CLOSED || status === ChatStatus.RESOLVED;
    if (isClosing && !faultType) {
      throw new BadRequestException('Debes indicar el tipo de fallo al cerrar el ticket');
    }

    const updated = await this.prisma.chatSession.update({
      where: { id },
      data: {
        status,
        faultType: faultType ?? undefined,
        closingNote: closingNote ?? undefined,
        closedAt: isClosing ? new Date() : null,
      },
      include: {
        totem: true,
        messages: { include: { attachments: true }, orderBy: { createdAt: 'asc' } },
        transferRequest: true,
        relatedSession: {
          select: {
            id: true,
            token: true,
            clientName: true,
            faultType: true,
            startedAt: true,
            closedAt: true,
            status: true,
          },
        },
        continuedBy: {
          select: { id: true, token: true, status: true, startedAt: true, faultType: true },
          orderBy: { startedAt: 'asc' },
        },
      },
    });

    // Mensaje de sistema al cerrar para que el cliente lo vea
    if (isClosing) {
      await this.prisma.chatMessage.create({
        data: {
          sessionId: id,
          content: `El agente cerró el ticket. Motivo: ${faultType}${closingNote ? ` — ${closingNote}` : ''}`,
          sender: MessageSender.SYSTEM,
          messageType: MessageType.TEXT,
        },
      });
    }

    return updated;
  }

  // ─── Transfer request ──────────────────────────────────────────────────────

  async sendTransferForm(sessionId: string) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: { transferRequest: true },
    });
    if (!session) throw new NotFoundException('Sesión no encontrada');
    if (session.status === ChatStatus.CLOSED) {
      throw new BadRequestException('La sesión está cerrada');
    }

    // Create or reset the transfer request
    let transferRequest = session.transferRequest;
    if (!transferRequest) {
      transferRequest = await this.prisma.transferRequest.create({
        data: { sessionId },
      });
    } else {
      transferRequest = await this.prisma.transferRequest.update({
        where: { sessionId },
        data: { status: TransferRequestStatus.PENDING },
      });
    }

    // System message so client sees the form
    const msg = await this.prisma.chatMessage.create({
      data: {
        sessionId,
        content: 'El agente te solicita que completes el formulario de devolución.',
        sender: MessageSender.ADMIN,
        messageType: MessageType.TRANSFER_FORM,
      },
      include: { attachments: true },
    });

    return { message: msg, transferRequest: this.serializeTransferRequest(transferRequest) };
  }

  async fillTransferData(token: string, dto: FillTransferDataDto) {
    const session = await this.prisma.chatSession.findUnique({
      where: { token },
      include: { transferRequest: true },
    });
    if (!session) throw new UnauthorizedException('Sesión inválida');
    if (!session.transferRequest)
      throw new BadRequestException('No hay formulario de transferencia activo');
    if (session.transferRequest.status !== TransferRequestStatus.PENDING) {
      throw new BadRequestException('El formulario ya fue completado');
    }

    const transferRequest = await this.prisma.transferRequest.update({
      where: { sessionId: session.id },
      data: {
        bankName: dto.bankName,
        accountType: dto.accountType,
        accountNumber: dto.accountNumber,
        rut: dto.rut,
        accountHolder: dto.accountHolder,
        amount: dto.amount ? parseFloat(dto.amount) : undefined,
        currency: dto.currency,
        notes: dto.notes,
        status: TransferRequestStatus.FILLED,
      },
    });

    const summary = [
      dto.bankName && `Banco: ${dto.bankName}`,
      dto.accountType && `Tipo: ${dto.accountType}`,
      dto.accountNumber && `Cuenta: ${dto.accountNumber}`,
      dto.rut && `RUT: ${dto.rut}`,
      dto.accountHolder && `Titular: ${dto.accountHolder}`,
      dto.amount && `Monto: ${dto.amount} ${dto.currency ?? ''}`,
    ]
      .filter(Boolean)
      .join(' | ');

    const msg = await this.prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        content: `Datos de transferencia enviados: ${summary}`,
        sender: MessageSender.CLIENT,
        messageType: MessageType.TRANSFER_DATA,
      },
      include: { attachments: true },
    });

    return { message: msg, transferRequest: this.serializeTransferRequest(transferRequest) };
  }

  async uploadVoucher(sessionId: string, file: Express.Multer.File) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: { transferRequest: true },
    });
    if (!session) throw new NotFoundException('Sesión no encontrada');
    if (!session.transferRequest)
      throw new BadRequestException('No hay solicitud de transferencia en esta sesión');

    const voucherUrl = `/v1/uploads/chat/${file.filename}`;

    await this.prisma.transferRequest.update({
      where: { sessionId },
      data: { voucherUrl, status: TransferRequestStatus.TRANSFERRED },
    });

    const msg = await this.prisma.chatMessage.create({
      data: {
        sessionId,
        content: 'El agente ha enviado el comprobante de transferencia.',
        sender: MessageSender.ADMIN,
        messageType: MessageType.VOUCHER,
        attachments: {
          create: [
            {
              filename: file.originalname,
              url: voucherUrl,
              mimeType: file.mimetype,
              size: file.size,
            },
          ],
        },
      },
      include: { attachments: true },
    });

    return { message: msg };
  }

  async getTransferRequest(sessionId: string) {
    const tr = await this.prisma.transferRequest.findUnique({ where: { sessionId } });
    if (!tr) throw new NotFoundException('No hay solicitud de transferencia');
    return tr;
  }

  // ─── Stats & dashboard ─────────────────────────────────────────────────────

  async getChatStats() {
    const [totalSessions, openSessions, pendingSessions, resolvedSessions, totalMessages] =
      await Promise.all([
        this.prisma.chatSession.count(),
        this.prisma.chatSession.count({ where: { status: ChatStatus.OPEN } }),
        this.prisma.chatSession.count({ where: { status: ChatStatus.PENDING } }),
        this.prisma.chatSession.count({ where: { status: ChatStatus.RESOLVED } }),
        this.prisma.chatMessage.count(),
      ]);

    return { totalSessions, openSessions, pendingSessions, resolvedSessions, totalMessages };
  }

  async getDashboard(from?: string, to?: string) {
    const dateFilter =
      from || to
        ? {
            startedAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : undefined;

    const [byFaultType, byStatus, byTotem, transferStats, recentClosed] = await Promise.all([
      // Fault type breakdown (closed/resolved sessions)
      this.prisma.chatSession.groupBy({
        by: ['faultType'],
        where: {
          faultType: { not: null },
          ...(dateFilter ?? {}),
        },
        _count: { _all: true },
        orderBy: { _count: { faultType: 'desc' } },
      }),

      // Status breakdown
      this.prisma.chatSession.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),

      // Tickets per totem
      this.prisma.chatSession.groupBy({
        by: ['totemId'],
        _count: { _all: true },
        orderBy: { _count: { totemId: 'desc' } },
        take: 10,
      }),

      // Transfer request stats
      this.prisma.transferRequest.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),

      // Last 20 closed tickets for the report table
      this.prisma.chatSession.findMany({
        where: {
          status: { in: [ChatStatus.CLOSED, ChatStatus.RESOLVED] },
          ...(dateFilter ?? {}),
        },
        include: {
          totem: { select: { name: true, location: true } },
          transferRequest: { select: { status: true, amount: true, currency: true } },
        },
        orderBy: { closedAt: 'desc' },
        take: 20,
      }),
    ]);

    // Enrich totemId with totem names
    const totemIds = byTotem.map((t) => t.totemId);
    const totems = await this.prisma.totem.findMany({
      where: { id: { in: totemIds } },
      select: { id: true, name: true, location: true },
    });
    const totemMap = Object.fromEntries(totems.map((t) => [t.id, t]));

    return {
      byFaultType: byFaultType.map((r) => ({
        faultType: r.faultType,
        count: r._count._all,
      })),
      byStatus: byStatus.map((r) => ({ status: r.status, count: r._count._all })),
      byTotem: byTotem.map((r) => ({
        totem: totemMap[r.totemId] ?? { id: r.totemId, name: 'Desconocido' },
        count: r._count._all,
      })),
      transferStats: transferStats.map((r) => ({ status: r.status, count: r._count._all })),
      recentClosed,
    };
  }
}
