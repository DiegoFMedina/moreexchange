// PATH: apps/web/lib/auth.ts
// DESC: Helpers JWT client-side — guardar tokens, leer payload y verificar sesión activa

export interface TokenPayload {
  sub: string;
  email: string;
  role: 'ADMIN' | 'CLIENT';
  exp: number;
  iat: number;
}

export function decodeJwt(token: string): TokenPayload | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    return JSON.parse(json) as TokenPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJwt(token);
  if (!payload) return true;
  return Date.now() >= payload.exp * 1000;
}

export function getStoredTokens() {
  if (typeof window === 'undefined') return { accessToken: null, refreshToken: null };
  return {
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken'),
  };
}

export function storeTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

export function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

export function getCurrentUser(): TokenPayload | null {
  const { accessToken } = getStoredTokens();
  if (!accessToken || isTokenExpired(accessToken)) return null;
  return decodeJwt(accessToken);
}

export function isAdmin(): boolean {
  const user = getCurrentUser();
  return user?.role === 'ADMIN';
}
