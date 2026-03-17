// PATH: apps/web/app/admin/rates/page.tsx
// DESC: Página de gestión de tasas — tabla con edición inline y gráfica de historial

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RatesManager } from '@/components/admin/RatesManager';
import { RateHistoryChart } from '@/components/admin/RateHistoryChart';
import api from '@/lib/api';
import type { ApiResponse, ExchangeRate } from '@/types';

export default function AdminRatesPage() {
  const [selectedRate, setSelectedRate] = useState<ExchangeRate | null>(null);

  const { data: rates } = useQuery({
    queryKey: ['admin', 'rates'],
    queryFn: async (): Promise<ExchangeRate[]> => {
      const { data } = await api.get<ApiResponse<ExchangeRate[]>>('/rates');
      return data.data;
    },
  });

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="font-display font-bold text-[24px] text-gray-900">Gestión de tasas</h1>
        <p className="text-[13px] text-gray-500 font-sans mt-1">
          Edita directamente en la tabla. Los cambios se reflejan en el sitio público al instante.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <RatesManager />
      </div>

      {/* Historial al seleccionar */}
      {selectedRate ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-sans font-semibold text-[14px] text-gray-900">
              Historial — {selectedRate.fromCurrency.code}/{selectedRate.toCurrency.code}
            </h2>
            <button
              onClick={() => setSelectedRate(null)}
              className="text-[12px] text-gray-400 hover:text-gray-700"
            >
              Cerrar
            </button>
          </div>
          <RateHistoryChart
            rateId={selectedRate.id}
            ratePair={`${selectedRate.fromCurrency.code}/${selectedRate.toCurrency.code}`}
          />
        </div>
      ) : (
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-6 text-center">
          <p className="text-[13px] text-gray-400 font-sans">
            Selecciona una tasa de la tabla para ver su historial de cambios
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {rates?.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRate(r)}
                className="px-3 py-1.5 text-[12px] border border-gray-200 rounded-md text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                {r.fromCurrency.flagEmoji} {r.fromCurrency.code}/{r.toCurrency.code}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
