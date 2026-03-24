// PATH: apps/api/src/modules/chat/chat.module.ts
// DESC: Módulo de soporte vía tótem — chat en tiempo real con adjuntos y gestión de sesiones

import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AdminChatController } from './admin-chat.controller';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

const UPLOAD_DIR = './uploads/chat';
const ALLOWED_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.pdf',
  '.mp4',
  '.mov',
  '.avi',
  '.txt',
  '.doc',
  '.docx',
]);
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });
          cb(null, UPLOAD_DIR);
        },
        filename: (_req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const extension = extname(file.originalname).toLowerCase();
        const hasSafeExtension = ALLOWED_EXTENSIONS.has(extension);
        const hasSafeMimeType = ALLOWED_MIME_TYPES.has(file.mimetype);
        const ok = hasSafeExtension && hasSafeMimeType;
        cb(ok ? null : new Error('Tipo de archivo no permitido'), ok);
      },
    }),
  ],
  controllers: [ChatController, AdminChatController],
  providers: [ChatService],
})
export class ChatModule {}
