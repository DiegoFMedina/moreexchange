// PATH: apps/api/src/common/interceptors/transform.interceptor.ts
// DESC: Interceptor global que envuelve respuestas en { success, data, meta } y serializa Prisma Decimals

import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
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

// Prisma Decimal objects have an internal structure {s, e, d} that doesn't
// serialize cleanly with JSON.stringify in all contexts.
// This walks the object tree and converts any Decimal-like object to a plain string.
function isPrismaDecimal(v: unknown): boolean {
  if (v === null || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o['s'] === 'number' &&
    typeof o['e'] === 'number' &&
    Array.isArray(o['d']) &&
    typeof (v as { toFixed?: unknown }).toFixed === 'function'
  );
}

function serializeDecimals(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  // Date objects must be returned as-is so JSON.stringify emits ISO strings
  if (value instanceof Date) return value;
  if (isPrismaDecimal(value)) return (value as { toFixed: (n: number) => string }).toFixed(2);
  if (Array.isArray(value)) return value.map(serializeDecimals);
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = serializeDecimals(v);
    }
    return out;
  }
  return value;
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

        const safe = serializeDecimals(value);

        if (isPaginated(safe as unknown)) {
          const p = safe as PaginatedResponse;
          return { success: true, data: p.data, pagination: p.pagination, meta };
        }

        return { success: true, data: safe, meta };
      }),
    );
  }
}
