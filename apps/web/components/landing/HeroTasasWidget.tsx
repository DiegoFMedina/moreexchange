// PATH: apps/web/components/landing/HeroTasasWidget.tsx
// DESC: Widget "Tasas de hoy" para el hero — moreexchange_hero_tasas_widget.html, datos desde API

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRates } from '@/hooks/useRates';
import type { ExchangeRate } from '@/types';

function fmtN(n: number): string {
  if (Number.isNaN(n) || !Number.isFinite(n)) return '—';
  if (n >= 100) return n.toLocaleString('es-CL', { maximumFractionDigits: 0 });
  if (n >= 1) return n.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
  const { data: rates, isLoading, dataUpdatedAt } = useRates();
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
    <div className="relative overflow-hidden rounded-[14px] border border-white/[0.09] bg-[#0F1E45]">
      <div
        className="absolute top-0 left-0 right-0 h-0.5 z-10"
        style={{
          background: 'linear-gradient(90deg, transparent, #2458F5, #00C2FF, transparent)',
        }}
      />
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <span className="text-[13px] font-medium text-white">Tasas de hoy</span>
        <div className="flex items-center gap-1.5 text-[10px] text-[#00C2FF] uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00C2FF] animate-pulse-dot" />
          En vivo
        </div>
      </div>

      <div className="flex gap-0 px-4 pb-3">
        {(['all', 'usd', 'eur', 'rem'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`py-1.5 px-3.5 rounded-full border text-[11px] font-sans transition-all mr-1.5 ${
              filter === f
                ? 'bg-[rgba(36,88,245,0.2)] border-[rgba(36,88,245,0.5)] text-white'
                : 'border-white/[0.07] bg-transparent text-white/45 hover:border-white/20 hover:text-white'
            }`}
          >
            {f === 'all' ? 'Todos' : f === 'rem' ? 'Remesas' : f.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_72px_72px_64px] gap-0 px-4 py-2 border-t border-white/[0.07] border-b border-white/[0.07]">
        <div className="text-[9px] tracking-wider uppercase text-white/45 font-medium">Par</div>
        <div className="text-[9px] tracking-wider uppercase text-white/45 font-medium text-right">Compra</div>
        <div className="text-[9px] tracking-wider uppercase text-white/45 font-medium text-right">Venta</div>
        <div className="text-[9px] tracking-wider uppercase text-white/45 font-medium text-right">%</div>
      </div>

      <div className="min-h-[120px]">
        {isLoading && (
          <div className="py-8 text-center text-[12px] text-white/45">Cargando tasas...</div>
        )}
        {!isLoading && visible.length === 0 && (
          <div className="py-8 text-center text-[12px] text-white/45">Sin tasas disponibles</div>
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
                className="grid grid-cols-[1fr_72px_72px_64px] gap-0 px-4 py-2.5 border-b border-white/[0.07] last:border-b-0 items-center hover:bg-[rgba(36,88,245,0.07)] transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="relative flex w-[30px] h-[18px] shrink-0">
                    <span className="absolute left-0 w-[18px] h-[18px] rounded-full flex items-center justify-center text-[11px] bg-[#162254] border border-white/[0.08]">
                      {rate.fromCurrency.flagEmoji}
                    </span>
                    <span className="absolute left-[11px] top-[2px] w-[14px] h-[14px] rounded-full flex items-center justify-center text-[8px] bg-[#162254] border border-white/[0.08]">
                      {rate.toCurrency.flagEmoji}
                    </span>
                  </div>
                  <span className="text-[13px] font-medium text-white truncate">
                    {rate.fromCurrency.code}/{rate.toCurrency.code}
                  </span>
                </div>
                <div className="font-mono text-[13px] text-white text-right tabular-nums">
                  {fmtN(Number(rate.buyRate))}
                </div>
                <div className="font-mono text-[13px] font-medium text-white text-right tabular-nums">
                  {fmtN(Number(rate.sellRate))}
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center gap-0.5 py-0.5 px-1.5 rounded-lg text-[10px] font-mono font-medium ${
                      isDown ? 'bg-[rgba(255,92,92,0.1)] text-[#FF5C5C]' : 'bg-[rgba(0,229,160,0.1)] text-[#00E5A0]'
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

      <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.07]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/45">
            {dataUpdatedAt
              ? new Date(dataUpdatedAt).toLocaleTimeString('es-CL', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })
              : '—'}
          </span>
          <div className="w-[50px] h-0.5 bg-white/[0.08] rounded overflow-hidden">
            <div
              className="h-full bg-[#00C2FF] rounded transition-[width] duration-1000"
              style={{ width: `${(countdown / 30) * 100}%` }}
            />
          </div>
        </div>
        <Link
          href="/rates"
          className="bg-[#2458F5] text-white py-2 px-3.5 rounded-md text-[11px] font-medium hover:bg-[#1A3FBF] transition-colors whitespace-nowrap"
        >
          Ver todas →
        </Link>
      </div>
    </div>
  );
}
