// PATH: apps/api/src/modules/admin/admin.module.ts
// DESC: Módulo de administración con acceso a estadísticas, usuarios y transacciones

import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
