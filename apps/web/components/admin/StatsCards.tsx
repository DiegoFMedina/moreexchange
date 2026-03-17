// PATH: apps/web/components/admin/StatsCards.tsx
// DESC: 4 tarjetas de métricas del dashboard admin — volumen 24h, transacciones hoy, tasa top, ingresos mes

'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { ApiResponse, AdminStats } from '@/types';

function StatCard({
  title,
  value,
  subtitle,
  color = 'blue',
}: {
  title: string;
  value: string;
  subtitle?: string;
  color?: 'blue' | 'green' | 'orange' | 'purple';
}) {
  const colors = {
    blue: 'bg-blue-50 border-blue-100',
    green: 'bg-green-50 border-green-100',
    orange: 'bg-orange-50 border-orange-100',
    purple: 'bg-purple-50 border-purple-100',
  };

  return (
    <div className={`rounded-lg border p-5 ${colors[color]}`}>
      <p className="text-[11px] uppercase tracking-widest text-gray-500 font-sans mb-2">{title}</p>
      <p className="font-display font-bold text-[28px] text-gray-900 tabular-nums leading-none">
        {value}
      </p>
      {subtitle && (
        <p className="text-[12px] text-gray-500 font-sans mt-1.5">{subtitle}</p>
      )}
    </div>
  );
}

export function StatsCards() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async (): Promise<AdminStats> => {
      const { data } = await api.get<ApiResponse<AdminStats>>('/admin/stats');
      return data.data;
    },
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-gray-100 p-5 h-28 animate-pulse bg-gray-50" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard
        title="Volumen 24h"
        value={data ? formatCurrency(data.volume24h, 'USD') : '—'}
        subtitle="Transacciones completadas"
        color="blue"
      />
      <StatCard
        title="Transacciones hoy"
        value={data ? String(data.transactionsToday) : '—'}
        subtitle="Todas las órdenes"
        color="green"
      />
      <StatCard
        title="Tasa más consultada"
        value={data?.topRate ?? '—'}
        subtitle="Últimas 24h"
        color="orange"
      />
      <StatCard
        title="Ingresos del mes"
        value={data ? formatCurrency(data.revenueMonth, 'USD') : '—'}
        subtitle="Operaciones completadas"
        color="purple"
      />
    </div>
  );
}
