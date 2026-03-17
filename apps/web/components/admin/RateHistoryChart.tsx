// PATH: apps/web/components/admin/RateHistoryChart.tsx
// DESC: Gráfica de historial de tasas con Recharts — línea temporal de buyRate y sellRate

'use client';

import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import api from '@/lib/api';
import type { PaginatedResponse, RateHistory } from '@/types';

interface Props {
  rateId: string;
  ratePair: string;
}

export function RateHistoryChart({ rateId, ratePair }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['rate-history', rateId],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<RateHistory>>(
        `/rates/${rateId}/history?limit=50`,
      );
      return data.data
        .map((h) => ({
          date: new Date(h.changedAt).toLocaleDateString('es-CL', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          }),
          compra: Number(h.buyRate),
          venta: Number(h.sellRate),
        }))
        .reverse();
    },
    enabled: Boolean(rateId),
  });

  if (isLoading) {
    return <div className="h-48 bg-gray-50 rounded-lg animate-pulse" />;
  }

  if (!data?.length) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-400 text-[13px] font-sans">
        Sin historial disponible
      </div>
    );
  }

  return (
    <div>
      <p className="text-[12px] text-gray-500 font-sans mb-3 uppercase tracking-widest">
        Historial — {ratePair}
      </p>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} />
          <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} width={55} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderColor: '#e5e7eb' }}
            formatter={(value: number) => value.toFixed(2)}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line
            type="monotone"
            dataKey="compra"
            stroke="#3b82f6"
            strokeWidth={1.5}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="venta"
            stroke="#10b981"
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
