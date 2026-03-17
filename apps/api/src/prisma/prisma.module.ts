// PATH: apps/api/src/prisma/prisma.module.ts
// DESC: Módulo global de Prisma — expone PrismaService en toda la aplicación

import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
