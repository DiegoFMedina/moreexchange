// PATH: apps/web/types/index.ts
// DESC: Tipos TypeScript compartidos en el frontend — modelos de API, respuestas y estado UI

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  flagEmoji: string;
  decimals: number;
}

export interface ExchangeRate {
  id: string;
  fromCurrencyId: string;
  toCurrencyId: string;
  buyRate: number;
  sellRate: number;
  spread: number;
  isActive: boolean;
  updatedAt: string;
  fromCurrency: Currency;
  toCurrency: Currency;
}

export interface RateHistory {
  id: string;
  exchangeRateId: string;
  buyRate: number;
  sellRate: number;
  changedAt: string;
  changedBy?: {
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'CLIENT';
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  fromCurrencyId: string;
  toCurrencyId: string;
  fromAmount: number;
  toAmount: number;
  rateApplied: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  paymentMethod?: string;
  paymentIntentId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta: {
    timestamp: string;
    version: string;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  meta: {
    timestamp: string;
    version: string;
  };
}

export interface CalculationResult {
  fromAmount: number;
  fromCurrency: Currency;
  toAmount: number;
  toCurrency: Currency;
  rateApplied: number;
  spread: number;
  spreadAmount: number;
  rateUpdatedAt: string;
}

export interface AdminStats {
  transactionsToday: number;
  volume24h: number;
  revenueMonth: number;
  topRate: string | null;
}
