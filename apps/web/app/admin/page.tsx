// PATH: apps/web/app/admin/page.tsx
// DESC: Dashboard del panel admin — StatsCards, gráfica de historial de tasas y últimas transacciones

'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { StatsCards } from '@/components/admin/StatsCards';
import { RateHistoryChart } from '@/components/admin/RateHistoryChart';
import api from '@/lib/api';
import type { ApiResponse, ExchangeRate } from '@/types';

export default function AdminDashboard() {
  const [selectedRate, setSelectedRate] = useState<ExchangeRate | null>(null);

  const { data: rates } = useQuery<ExchangeRate[]>({
    queryKey: ['admin', 'rates-select'],
    queryFn: async (): Promise<ExchangeRate[]> => {
      const { data } = await api.get<ApiResponse<ExchangeRate[]>>('/rates');
      return data.data;
    },
  });

  useEffect(() => {
    if (rates && rates.length > 0 && !selectedRate) setSelectedRate(rates[0]);
  }, [rates]);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display font-bold text-[24px] text-gray-900">Dashboard</h1>
        <p className="text-[13px] text-gray-500 font-sans mt-1">
          Resumen operativo · {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: '2-digit', month: 'long' })}
        </p>
      </div>

      {/* Stats */}
      <StatsCards />

      {/* Gráfica */}
      <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-sans font-semibold text-[14px] text-gray-900">Historial de tasas</h2>
          <select
            value={selectedRate?.id ?? ''}
            onChange={(e) => {
              const rate = rates?.find((r) => r.id === e.target.value);
              if (rate) setSelectedRate(rate);
            }}
            className="text-[12px] border border-gray-200 rounded px-2 py-1.5 text-gray-700 bg-white focus:outline-none focus:border-blue-400"
          >
            {rates?.map((r) => (
              <option key={r.id} value={r.id}>
                {r.fromCurrency.code}/{r.toCurrency.code}
              </option>
            ))}
          </select>
        </div>

        {selectedRate && (
          <RateHistoryChart
            rateId={selectedRate.id}
            ratePair={`${selectedRate.fromCurrency.code}/${selectedRate.toCurrency.code}`}
          />
        )}
      </div>
    </div>
  );
}
