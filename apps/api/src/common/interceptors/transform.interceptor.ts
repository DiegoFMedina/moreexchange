// PATH: apps/api/src/common/interceptors/transform.interceptor.ts
// DESC: Interceptor global que envuelve todas las respuestas exitosas en { success: true, data: ..., meta: {...} }

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface PaginatedResponse {
  data: unknown[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

function isPaginated(value: unknown): value is PaginatedResponse {
  return (
    value !== null &&
    typeof value === 'object' &&
    'data' in (value as object) &&
    'pagination' in (value as object)
  );
}

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((value) => {
        const meta = {
          timestamp: new Date().toISOString(),
          version: '1.0',
        };

        if (isPaginated(value)) {
          return {
            success: true,
            data: value.data,
            pagination: value.pagination,
            meta,
          };
        }

        return {
          success: true,
          data: value,
          meta,
        };
      }),
    );
  }
}
