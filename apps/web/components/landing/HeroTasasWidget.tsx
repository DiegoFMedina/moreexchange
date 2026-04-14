// PATH: apps/web/components/landing/HeroTasasWidget.tsx
// DESC: Widget "Tasas de hoy" para hero — tema claro, card con sombra, datos desde API

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRates } from '@/hooks/useRates';
import type { ExchangeRate } from '@/types';

function fmtN(n: number): string {
  if (Number.isNaN(n) || !Number.isFinite(n)) return '—';
  if (n >= 100) return n.toLocaleString('es-CL', { maximumFractionDigits: 0 });
  if (n >= 1)
    return n.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

type Filter = 'all' | 'usd' | 'eur' | 'rem';

function filterRates(rates: ExchangeRate[], active: Filter): ExchangeRate[] {
  if (active === 'all') return rates;
  if (active === 'rem') {
    return rates.filter(
      (r) =>
        r.toCurrency.code === 'CLP' ||
        r.toCurrency.code === 'COP' ||
        r.toCurrency.code === 'PEN' ||
        r.fromCurrency.code === 'CLP',
    );
  }
  return rates.filter(
    (r) =>
      r.fromCurrency.code.toUpperCase() === active.toUpperCase() ||
      r.toCurrency.code.toUpperCase() === active.toUpperCase(),
  );
}

const MAX_ROWS = 6;

export function HeroTasasWidget() {
  const { data: rates, isLoading, error, dataUpdatedAt, refetch, isRefetching } = useRates();
  const [filter, setFilter] = useState<Filter>('all');
  const [countdown, setCountdown] = useState(30);

  const filtered = rates ? filterRates(rates, filter) : [];
  const visible = filtered.slice(0, MAX_ROWS);

  useEffect(() => {
    if (dataUpdatedAt == null) return;
    const elapsed = Math.floor((Date.now() - dataUpdatedAt) / 1000);
    setCountdown(Math.max(0, 30 - elapsed));
  }, [dataUpdatedAt]);

  useEffect(() => {
    const t = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-xl border border-[#E2E5F1] bg-white shadow-widget max-w-full w-full">
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] z-10"
        style={{
          background: 'linear-gradient(90deg, #243a85, #2458F5, #00AEEF)',
        }}
      />
      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 pt-4 pb-3">
        <span className="text-[13px] font-medium text-[#1B2141] truncate">Tasas de hoy</span>
        <div className="flex items-center gap-1.5 text-[10px] text-[#059669] uppercase tracking-wider shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse-dot" />
          En vivo
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 px-3 sm:px-4 pb-3">
        {(['all', 'usd', 'eur', 'rem'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`py-1.5 px-2.5 sm:px-3 rounded-full border text-[10px] sm:text-[11px] font-sans transition-all ${
              filter === f
                ? 'bg-[#2458F5]/10 border-[#2458F5]/30 text-[#2458F5] font-medium'
                : 'border-[#E2E5F1] bg-transparent text-[#5C6489] hover:border-[#C8CDE0] hover:text-[#243a85]'
            }`}
          >
            {f === 'all' ? 'Todos' : f === 'rem' ? 'Remesas' : f.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto overflow-y-hidden -mx-1 px-1 pr-2">
        <div className="min-w-[260px]">
          <div className="grid grid-cols-[minmax(0,1fr)_56px_56px_44px] sm:grid-cols-[minmax(0,1fr)_72px_72px_64px] gap-0 px-3 sm:px-4 py-2 border-t border-b border-[#E2E5F1] bg-[#F5F7FE]">
            <div className="text-[9px] tracking-wider uppercase text-[#8B92B0] font-medium truncate">
              Par
            </div>
            <div className="text-[9px] tracking-wider uppercase text-[#8B92B0] font-medium text-right">
              Compra
            </div>
            <div className="text-[9px] tracking-wider uppercase text-[#8B92B0] font-medium text-right">
              Venta
            </div>
            <div className="text-[9px] tracking-wider uppercase text-[#8B92B0] font-medium text-right">
              %
            </div>
          </div>

          <div className="min-h-[120px]">
            {isLoading && (
              <div className="py-8 text-center text-[12px] text-[#8B92B0]">Cargando tasas...</div>
            )}
            {!isLoading && error && (
              <div className="py-6 text-center text-[12px] text-[#5C6489] space-y-2">
                <p>No se pudieron cargar las tasas.</p>
                <p className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => refetch()}
                    disabled={isRefetching}
                    className="text-[#2458F5] hover:underline disabled:opacity-50"
                  >
                    {isRefetching ? 'Reintentando…' : 'Reintentar'}
                  </button>
                  <span className="text-[#C8CDE0]">·</span>
                  <Link href="/rates" className="text-[#2458F5] hover:underline">
                    Ver tasas
                  </Link>
                </p>
              </div>
            )}
            {!isLoading && !error && visible.length === 0 && (
              <div className="py-8 text-center text-[12px] text-[#8B92B0]">
                Sin tasas disponibles
              </div>
            )}
            {!isLoading &&
              visible.length > 0 &&
              visible.map((rate) => {
                const spreadNum = Number(rate.spread);
                const spreadPct = Number.isFinite(spreadNum) ? spreadNum * 100 : 0;
                const isDown = spreadPct >= 2;
                return (
                  <Link
                    key={rate.id}
                    href="/exchange"
                    className="grid grid-cols-[minmax(0,1fr)_56px_56px_44px] sm:grid-cols-[minmax(0,1fr)_72px_72px_64px] gap-0 px-3 sm:px-4 py-2.5 border-b border-[#E2E5F1] last:border-b-0 items-center hover:bg-[#F5F7FE] transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="relative flex w-[30px] h-[18px] shrink-0">
                        <span className="absolute left-0 w-[18px] h-[18px] rounded-full flex items-center justify-center text-[11px] bg-[#F0F2FA] border border-[#E2E5F1]">
                          {rate.fromCurrency.flagEmoji}
                        </span>
                        <span className="absolute left-[11px] top-[2px] w-[14px] h-[14px] rounded-full flex items-center justify-center text-[8px] bg-[#F0F2FA] border border-[#E2E5F1]">
                          {rate.toCurrency.flagEmoji}
                        </span>
                      </div>
                      <span className="text-[12px] sm:text-[13px] font-medium text-[#1B2141] truncate">
                        {rate.fromCurrency.code}/{rate.toCurrency.code}
                      </span>
                    </div>
                    <div className="font-mono text-[12px] sm:text-[13px] text-[#1B2141] text-right tabular-nums truncate">
                      {fmtN(Number(rate.buyRate))}
                    </div>
                    <div className="font-mono text-[12px] sm:text-[13px] font-medium text-[#1B2141] text-right tabular-nums truncate">
                      {fmtN(Number(rate.sellRate))}
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex items-center gap-0.5 py-0.5 px-1.5 rounded-lg text-[10px] font-mono font-medium ${
                          isDown ? 'bg-red-50 text-[#DC2626]' : 'bg-emerald-50 text-[#059669]'
                        }`}
                      >
                        {isDown ? '▼' : '▲'}
                        {Number.isFinite(spreadNum) ? spreadPct.toFixed(2) : '—'}%
                      </span>
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-3 border-t border-[#E2E5F1] bg-[#FAFBFE]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#8B92B0]">
            {dataUpdatedAt
              ? new Date(dataUpdatedAt).toLocaleTimeString('es-CL', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })
              : '—'}
          </span>
          <div className="w-[50px] h-0.5 bg-[#E2E5F1] rounded overflow-hidden">
            <div
              className="h-full bg-[#2458F5] rounded transition-[width] duration-1000"
              style={{ width: `${(countdown / 30) * 100}%` }}
            />
          </div>
        </div>
        <Link
          href="/rates"
          className="bg-[#2458F5] text-white py-2 px-3.5 rounded-md text-[11px] font-medium hover:bg-[#1A3FBF] transition-colors whitespace-nowrap shrink-0 shadow-sm"
        >
          Ver todas →
        </Link>
      </div>
    </div>
  );
}
