// PATH: apps/web/components/landing/LiveRatesSection.tsx
// DESC: Sección "Tasas en vivo" alineada a moreexchange_tasas_section.html — tag, título, última actualización, countdown, filtros, tabla con badges y CTA

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRates } from '@/hooks/useRates';
import type { ExchangeRate } from '@/types';

function fmtN(n: number): string {
  if (Number.isNaN(n) || !Number.isFinite(n)) return '—';
  if (n >= 100) return n.toLocaleString('es-CL', { maximumFractionDigits: 0 });
  if (n >= 1) return n.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

function pairDescription(rate: ExchangeRate): string {
  const a = rate.fromCurrency.name.replace(/\s+/g, ' ').trim();
  const b = rate.toCurrency.name.replace(/\s+/g, ' ').trim();
  return `${a} · ${b}`;
}

type Filter = 'all' | 'usd' | 'eur' | 'clp' | 'remesas';

function filterRates(rates: ExchangeRate[], active: Filter): ExchangeRate[] {
  if (active === 'all') return rates;
  if (active === 'remesas') {
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

function RateRow({ rate }: { rate: ExchangeRate }) {
  const spreadNum = Number(rate.spread);
  const spreadPct = Number.isFinite(spreadNum) ? spreadNum * 100 : 0;
  const isDown = spreadPct >= 2;

  return (
    <tr className="border-b border-white/[0.06] last:border-b-0 hover:bg-[#0F1E45] transition-colors cursor-pointer">
      <td className="py-4 px-5" style={{ width: 260 }}>
        <div className="flex items-center gap-3">
          <div className="relative flex items-center w-9 h-6 flex-shrink-0">
            <span className="absolute left-0 w-6 h-6 rounded-full flex items-center justify-center text-[13px] bg-[#162254] border border-white/10">
              {rate.fromCurrency.flagEmoji}
            </span>
            <span className="absolute left-3.5 w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] bg-[#162254] border border-white/10">
              {rate.toCurrency.flagEmoji}
            </span>
          </div>
          <div>
            <div className="font-medium text-white text-[14px] tracking-wide">
              {rate.fromCurrency.code}/{rate.toCurrency.code}
            </div>
            <div className="text-[11px] text-white/40 mt-0.5">{pairDescription(rate)}</div>
          </div>
        </div>
      </td>
      <td className="py-4 px-5 text-right font-mono text-[14px] text-white tabular-nums">
        {fmtN(Number(rate.buyRate))}
      </td>
      <td className="py-4 px-5 text-right font-mono text-[15px] font-medium text-white tabular-nums">
        {fmtN(Number(rate.sellRate))}
      </td>
      <td className="py-4 px-5 text-right">
        <span
          className={`inline-flex items-center gap-1 py-1 px-2.5 rounded-full text-[12px] font-mono font-medium ${
            isDown ? 'bg-[rgba(255,92,92,0.1)] text-[#FF5C5C]' : 'bg-[rgba(0,229,160,0.1)] text-[#00E5A0]'
          }`}
        >
          <span className="text-[10px]">{isDown ? '▼' : '▲'}</span>
          {Number.isFinite(spreadNum) ? spreadPct.toFixed(2) : '—'}%
        </span>
      </td>
      <td className="py-4 px-5 text-right">
        <Link
          href="/exchange"
          className="inline-block border border-[#2458F5] text-[#00C2FF] py-1.5 px-3.5 rounded-md text-[12px] font-sans hover:bg-[#2458F5] hover:text-white transition-colors whitespace-nowrap"
        >
          Cambiar →
        </Link>
      </td>
    </tr>
  );
}

export function LiveRatesSection() {
  const { data: rates, isLoading, error, dataUpdatedAt } = useRates();
  const [filter, setFilter] = useState<Filter>('all');
  const [countdown, setCountdown] = useState(30);

  const filteredRates = rates ? filterRates(rates, filter) : [];

  useEffect(() => {
    if (dataUpdatedAt == null) return;
    const elapsed = Math.floor((Date.now() - dataUpdatedAt) / 1000);
    setCountdown(Math.max(0, 30 - elapsed));
  }, [dataUpdatedAt]);

  useEffect(() => {
    const t = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const viewportReveal = { once: true, amount: 0.12 };
  const fadeUp = {
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: viewportReveal,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  };

  return (
    <section className="bg-[#08122B] font-sans text-white py-16 px-6 lg:px-10">
      <div className="max-w-5xl mx-auto">
        {/* sec-top */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
          <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.05 }}>
            <div className="inline-flex items-center gap-2 bg-[rgba(0,194,255,0.1)] border border-[rgba(0,194,255,0.25)] text-[#00C2FF] text-[10px] tracking-[0.14em] uppercase py-1 px-3 rounded-full font-medium mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00C2FF] animate-pulse-dot" />
              Actualización cada 30 seg
            </div>
            <h2 className="font-display text-[32px] font-extrabold text-white tracking-tight">
              Tasas <span className="text-[#00C2FF]">en vivo</span>
            </h2>
          </motion.div>
          <motion.div
            className="text-right"
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.15 }}
          >
            <div className="text-[11px] text-white/40 mb-1">Última actualización</div>
            <div className="font-mono text-[13px] text-[#00C2FF]">
              {dataUpdatedAt
                ? new Date(dataUpdatedAt).toLocaleTimeString('es-CL', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })
                : '—'}
            </div>
            <div className="flex items-center gap-2 justify-end mt-2 text-[11px] text-white/40">
              <span>Próxima en {countdown}s</span>
              <div className="w-20 h-1 bg-white/[0.08] rounded overflow-hidden">
                <div
                  className="h-full bg-[#00C2FF] rounded transition-[width] duration-1000"
                  style={{ width: `${(countdown / 30) * 100}%` }}
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* filter-row */}
        <motion.div
          className="flex flex-wrap gap-2 mb-6"
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.25 }}
        >
          {(['all', 'usd', 'eur', 'clp', 'remesas'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full border text-[12px] font-sans transition-all ${
                filter === f
                  ? 'bg-[#2458F5] border-[#2458F5] text-white font-medium'
                  : 'border-white/[0.06] bg-transparent text-white/40 hover:border-white/20 hover:text-white'
              }`}
            >
              {f === 'all' ? 'Todos' : f === 'remesas' ? 'Remesas' : f.toUpperCase()}
            </button>
          ))}
        </motion.div>

        {/* table */}
        <motion.div
          className="rounded-xl overflow-hidden border border-white/[0.06]"
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.35 }}
        >
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#0F1E45] border-b border-white/[0.06]">
                <th className="py-3.5 px-5 text-left text-[10px] uppercase tracking-widest text-white/40 font-medium">
                  Par
                </th>
                <th className="py-3.5 px-5 text-right text-[10px] uppercase tracking-widest text-white/40 font-medium">
                  Compra
                </th>
                <th className="py-3.5 px-5 text-right text-[10px] uppercase tracking-widest text-white/40 font-medium">
                  Venta
                </th>
                <th className="py-3.5 px-5 text-right text-[10px] uppercase tracking-widest text-white/40 font-medium">
                  Spread
                </th>
                <th className="py-3.5 px-5 text-right w-24" />
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-white/40 text-sm">
                    Cargando tasas...
                  </td>
                </tr>
              )}
              {!isLoading && (error || !rates?.length) && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-white/40 text-sm">
                    No se pudieron cargar las tasas. Intenta de nuevo.
                  </td>
                </tr>
              )}
              {!isLoading && filteredRates.length > 0 && filteredRates.map((rate) => (
                <RateRow key={rate.id} rate={rate} />
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* tbl-footer */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-5"
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.45 }}
        >
          <Link
            href="/rates"
            className="order-2 sm:order-1 text-[13px] border border-white/[0.06] text-white/40 hover:border-white/20 hover:text-white py-2.5 px-6 rounded-lg transition-colors w-fit"
          >
            Ver todas las divisas →
          </Link>
          <p className="order-1 sm:order-2 text-[11px] text-white/40 max-w-[500px] leading-relaxed">
            <strong className="text-white/60">Precios referenciales</strong> sujetos a cambio. Tasa vigente en
            sucursal Casa Central San Sebastián 2814, Las Condes. Consulte precio en otras sucursales.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
