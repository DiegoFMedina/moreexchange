// PATH: apps/api/src/common/decorators/roles.decorator.ts
// DESC: Decorador @Roles() para especificar los roles requeridos en una ruta

import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
