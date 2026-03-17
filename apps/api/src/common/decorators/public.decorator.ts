// PATH: apps/api/src/common/decorators/public.decorator.ts
// DESC: Decorador @Public() para marcar rutas que omiten el guard JWT global

import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
