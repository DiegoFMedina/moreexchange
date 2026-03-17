// PATH: apps/api/src/modules/users/users.module.ts
// DESC: Módulo de usuarios — exporta UsersService para uso en otros módulos

import { Module } from '@nestjs/common';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
