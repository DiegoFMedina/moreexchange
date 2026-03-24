const LOCAL_FALLBACK_API = 'http://localhost:3001/v1';
const LOCAL_FALLBACK_WEB = 'http://localhost:3000';

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function ensureV1Path(value: string): string {
  const base = trimTrailingSlash(value);
  return base.endsWith('/v1') ? base : `${base}/v1`;
}

export function resolveApiUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (fromEnv) {
    return ensureV1Path(fromEnv);
  }

  // In browser production builds, avoid hard-coding localhost when env is missing.
  if (typeof window !== 'undefined') {
    return ensureV1Path(window.location.origin);
  }

  return LOCAL_FALLBACK_API;
}

export function resolveApiBaseUrl(): string {
  const apiUrl = resolveApiUrl();
  return trimTrailingSlash(apiUrl).replace(/\/v1$/, '');
}

export function resolveWebBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_WEB_URL?.trim();
  if (fromEnv) {
    return trimTrailingSlash(fromEnv);
  }

  if (typeof window !== 'undefined') {
    return trimTrailingSlash(window.location.origin);
  }

  return LOCAL_FALLBACK_WEB;
}
