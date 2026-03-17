// PATH: apps/web/hooks/useExchange.ts
// DESC: Hook para calcular montos de cambio y crear órdenes de pago

import { useMutation, useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ApiResponse, CalculationResult, Transaction, PaginatedResponse } from '@/types';

interface CalculateParams {
  fromCurrencyId: string;
  toCurrencyId: string;
  fromAmount: number;
}

interface CreateOrderParams extends CalculateParams {
  paymentMethod: string;
  notes?: string;
}

interface OrderResult {
  transactionId: string;
  clientSecret: string;
  calculation: CalculationResult;
}

export function useCalculate() {
  return useMutation({
    mutationFn: async (params: CalculateParams): Promise<CalculationResult> => {
      const { data } = await api.post<ApiResponse<CalculationResult>>('/exchange/calculate', params);
      return data.data;
    },
  });
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: async (params: CreateOrderParams): Promise<OrderResult> => {
      const { data } = await api.post<ApiResponse<OrderResult>>('/exchange/order', params);
      return data.data;
    },
  });
}

export function useOrders(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['orders', page, limit],
    queryFn: async (): Promise<PaginatedResponse<Transaction>> => {
      const { data } = await api.get<PaginatedResponse<Transaction>>(
        `/exchange/orders?page=${page}&limit=${limit}`,
      );
      return data;
    },
  });
}
