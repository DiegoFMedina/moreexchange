// PATH: apps/web/app/admin/transactions/page.tsx
// DESC: Página de transacciones del admin — listado con filtros de estado, fecha y moneda

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { PaginatedResponse, Transaction } from '@/types';

const STATUS_LABELS: Record<Transaction['status'], { label: string; color: string }> = {
  PENDING: { label: 'Pendiente', color: 'text-yellow-700 bg-yellow-50' },
  PROCESSING: { label: 'Procesando', color: 'text-blue-700 bg-blue-50' },
  COMPLETED: { label: 'Completada', color: 'text-green-700 bg-green-50' },
  FAILED: { label: 'Fallida', color: 'text-red-700 bg-red-50' },
  REFUNDED: { label: 'Reembolsada', color: 'text-gray-700 bg-gray-100' },
};

export default function AdminTransactionsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'transactions', page, status, fromDate, toDate],
    queryFn: async (): Promise<PaginatedResponse<Transaction & { user: { email: string; firstName: string; lastName: string } }>> => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (status) params.set('status', status);
      if (fromDate) params.set('fromDate', fromDate);
      if (toDate) params.set('toDate', toDate);
      const { data } = await api.get(`/admin/transactions?${params.toString()}`);
      return data;
    },
  });

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="font-display font-bold text-[24px] text-gray-900">Transacciones</h1>
        <p className="text-[13px] text-gray-500 font-sans mt-1">
          {data?.pagination.total ?? 0} transacciones en total
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="text-[13px] border border-gray-200 rounded-md px-3 py-2 text-gray-700 bg-white focus:outline-none focus:border-blue-400"
        >
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([val, { label }]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>

        <input
          type="date"
          value={fromDate}
          onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
          className="text-[13px] border border-gray-200 rounded-md px-3 py-2 text-gray-700 bg-white focus:outline-none focus:border-blue-400"
        />
        <span className="text-[13px] text-gray-400">→</span>
        <input
          type="date"
          value={toDate}
          onChange={(e) => { setToDate(e.target.value); setPage(1); }}
          className="text-[13px] border border-gray-200 rounded-md px-3 py-2 text-gray-700 bg-white focus:outline-none focus:border-blue-400"
        />

        {(status || fromDate || toDate) && (
          <button
            onClick={() => { setStatus(''); setFromDate(''); setToDate(''); setPage(1); }}
            className="text-[12px] text-blue-600 hover:underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-100">
              {['ID', 'Usuario', 'Operación', 'Monto', 'Estado', 'Fecha'].map((col) => (
                <th
                  key={col}
                  className="py-2.5 px-4 text-left text-[11px] uppercase tracking-widest text-gray-400 font-sans"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td colSpan={6} className="py-3 px-4">
                    <div className="h-4 bg-gray-50 animate-pulse rounded" />
                  </td>
                </tr>
              ))}
            {data?.data.map((tx) => {
              const s = STATUS_LABELS[tx.status];
              return (
                <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-[11px] text-gray-400 font-mono">
                    {tx.id.slice(0, 8)}...
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-[13px] text-gray-900 font-sans">{tx.user.firstName} {tx.user.lastName}</p>
                    <p className="text-[11px] text-gray-400">{tx.user.email}</p>
                  </td>
                  <td className="py-3 px-4 text-[13px] text-gray-600 font-sans tabular-nums">
                    {tx.fromCurrencyId} → {tx.toCurrencyId}
                  </td>
                  <td className="py-3 px-4 text-[13px] text-gray-900 tabular-nums font-sans">
                    {formatCurrency(Number(tx.fromAmount), tx.fromCurrencyId)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-sans ${s.color}`}>
                      {s.label}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[12px] text-gray-400 font-sans">
                    {formatDate(tx.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {data && data.pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-[12px] text-gray-500 font-sans">
            Página {data.pagination.page} de {data.pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              disabled={!data.pagination.hasPrev}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 text-[12px] border border-gray-200 rounded text-gray-700 disabled:opacity-40 hover:border-blue-400 hover:text-blue-600"
            >
              ← Anterior
            </button>
            <button
              disabled={!data.pagination.hasNext}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 text-[12px] border border-gray-200 rounded text-gray-700 disabled:opacity-40 hover:border-blue-400 hover:text-blue-600"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
