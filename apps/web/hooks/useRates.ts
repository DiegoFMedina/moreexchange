// PATH: apps/web/hooks/useRates.ts
// DESC: Hook React Query para tasas de cambio con polling automático cada 30 segundos

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ApiResponse, ExchangeRate } from '@/types';

export const RATES_KEY = ['rates'] as const;

async function fetchRates(): Promise<ExchangeRate[]> {
  const { data } = await api.get<ApiResponse<ExchangeRate[]>>('/rates');
  return data.data;
}

async function fetchRatePair(from: string, to: string): Promise<ExchangeRate> {
  const { data } = await api.get<ApiResponse<ExchangeRate>>(`/rates/${from}/${to}`);
  return data.data;
}

export function useRates() {
  return useQuery({
    queryKey: RATES_KEY,
    queryFn: fetchRates,
    refetchInterval: 30_000,
    staleTime: 30_000,
    retry: 0, // fallo rápido para mostrar error (CORS, URL incorrecta, etc.)
  });
}

export function useRatePair(from: string, to: string) {
  return useQuery({
    queryKey: [...RATES_KEY, from, to],
    queryFn: () => fetchRatePair(from, to),
    enabled: Boolean(from && to),
    refetchInterval: 30_000,
  });
}
