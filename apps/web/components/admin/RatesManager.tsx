// PATH: apps/web/components/admin/RatesManager.tsx
// DESC: Tabla de tasas con edición inline de buyRate y sellRate — invalida caché Redis al guardar

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatRate } from '@/lib/utils';
import type { ApiResponse, ExchangeRate } from '@/types';
import { RATES_KEY } from '@/hooks/useRates';

function EditableCell({
  value,
  onSave,
  loading,
}: {
  value: number;
  onSave: (v: number) => void;
  loading?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  const commit = () => {
    const parsed = parseFloat(draft);
    if (!isNaN(parsed) && parsed > 0) onSave(parsed);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        step="0.0001"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        className="w-24 bg-blue-50 border border-blue-300 text-gray-900 text-[13px] tabular-nums rounded px-2 py-1 focus:outline-none"
      />
    );
  }

  return (
    <button
      onClick={() => {
        setDraft(String(value));
        setEditing(true);
      }}
      disabled={loading}
      className="tabular-nums text-[13px] text-gray-700 hover:text-blue-600 hover:underline transition-colors"
      title="Click para editar"
    >
      {formatRate(value)}
    </button>
  );
}

export function RatesManager() {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const { data: rates, isLoading } = useQuery({
    queryKey: ['admin', 'rates'],
    queryFn: async (): Promise<ExchangeRate[]> => {
      const { data } = await api.get<ApiResponse<ExchangeRate[]>>('/rates');
      return data.data;
    },
  });

  const updateRate = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: { buyRate?: number; sellRate?: number } }) => {
      setSaving((s) => ({ ...s, [id]: true }));
      const { data } = await api.patch<ApiResponse<ExchangeRate>>(`/rates/${id}`, payload);
      return data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'rates'] });
      void queryClient.invalidateQueries({ queryKey: RATES_KEY });
    },
    onSettled: (_, __, variables) => {
      setSaving((s) => ({ ...s, [variables.id]: false }));
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-px">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-50 animate-pulse rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-gray-200">
            {['Par', 'Compra', 'Venta', 'Spread', 'Estado', 'Actualizado'].map((col) => (
              <th
                key={col}
                className="py-2.5 px-4 text-[11px] uppercase tracking-widest text-gray-400 font-sans"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rates?.map((rate) => (
            <tr
              key={rate.id}
              className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <span className="text-[14px]">{rate.fromCurrency.flagEmoji}</span>
                  <span className="font-sans font-medium text-[13px] text-gray-900">
                    {rate.fromCurrency.code}/{rate.toCurrency.code}
                  </span>
                </div>
              </td>
              <td className="py-3 px-4">
                <EditableCell
                  value={Number(rate.buyRate)}
                  onSave={(v) => updateRate.mutate({ id: rate.id, payload: { buyRate: v } })}
                  loading={saving[rate.id]}
                />
              </td>
              <td className="py-3 px-4">
                <EditableCell
                  value={Number(rate.sellRate)}
                  onSave={(v) => updateRate.mutate({ id: rate.id, payload: { sellRate: v } })}
                  loading={saving[rate.id]}
                />
              </td>
              <td className="py-3 px-4 text-[13px] text-gray-500 tabular-nums font-sans">
                {(Number(rate.spread) * 100).toFixed(2)}%
              </td>
              <td className="py-3 px-4">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[11px] font-sans ${
                    rate.isActive
                      ? 'bg-green-50 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {rate.isActive ? 'Activa' : 'Inactiva'}
                </span>
              </td>
              <td className="py-3 px-4 text-[12px] text-gray-400 font-sans">
                {new Date(rate.updatedAt).toLocaleString('es-CL', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
