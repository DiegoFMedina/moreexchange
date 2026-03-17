// PATH: apps/web/components/rates/RatesTable.tsx
// DESC: Tabla de tasas estilo terminal financiero — filas densas, números tabulares, indicador alza/baja con spring

'use client';

import { motion } from 'framer-motion';
import { useRates } from '@/hooks/useRates';
import { formatRate } from '@/lib/utils';
import type { ExchangeRate } from '@/types';

function AnimatedRate({ value, prev }: { value: number; prev?: number }) {
  const num = Number(value);
  const changed = prev !== undefined && prev !== num && !Number.isNaN(num);
  return (
    <motion.span
      key={num}
      className="tabular-nums rate-value"
      animate={changed ? { color: ['#00b4d8', '#eef0f8'] } : {}}
      transition={{ duration: 0.4 }}
      style={{ color: '#eef0f8' }}
    >
      {formatRate(num)}
    </motion.span>
  );
}

function ChangeIndicator({ spread }: { spread: number }) {
  const num = Number(spread);
  if (Number.isNaN(num) || !Number.isFinite(num)) {
    return <span className="text-[12px] text-text-secondary">—</span>;
  }
  const isPositive = num < 0.02;
  return (
    <span
      className="inline-flex items-center gap-1 text-[12px] tabular-nums"
      style={{ color: isPositive ? '#00c896' : '#ff4d6a' }}
    >
      {isPositive ? '▲' : '▼'} {(num * 100).toFixed(2)}%
    </span>
  );
}

function RateRow({ rate }: { rate: ExchangeRate }) {
  return (
    <motion.tr
      className="group border-b border-[#1c2240] hover:bg-[#151d38] transition-all duration-150 cursor-default"
      whileHover={{}}
      style={{}}
    >
      {/* Par */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <span className="text-[15px]">{rate.fromCurrency.flagEmoji}</span>
          <span className="font-sans font-medium text-[13px] text-text-primary tabular-nums">
            {rate.fromCurrency.code}/{rate.toCurrency.code}
          </span>
        </div>
      </td>

      {/* Compra */}
      <td className="py-3 px-4 text-right">
        <span className="font-sans text-[13px] tabular-nums text-text-primary">
          <AnimatedRate value={Number(rate.buyRate) ?? 0} />
        </span>
      </td>

      {/* Venta */}
      <td className="py-3 px-4 text-right">
        <span className="font-sans text-[13px] tabular-nums text-text-primary">
          <AnimatedRate value={Number(rate.sellRate) ?? 0} />
        </span>
      </td>

      {/* Spread */}
      <td className="py-3 px-4 text-right">
        <ChangeIndicator spread={Number(rate.spread) ?? 0} />
      </td>
    </motion.tr>
  );
}

export function RatesTable() {
  const { data: rates, isLoading, error, dataUpdatedAt } = useRates();

  if (isLoading) {
    return (
      <div className="space-y-px">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 bg-[#0c0f1a] animate-pulse rounded-sm" />
        ))}
      </div>
    );
  }

  if (error || !rates?.length) {
    return (
      <div className="py-10 text-center text-text-secondary text-[14px] font-sans">
        No se pudieron cargar las tasas. Intenta de nuevo.
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#1c2240]">
              {['Par', 'Compra', 'Venta', 'Spread'].map((col, i) => (
                <th
                  key={col}
                  className={`py-2 px-4 text-[11px] uppercase tracking-widest text-text-secondary font-sans ${
                    i > 0 ? 'text-right' : 'text-left'
                  }`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rates.map((rate) => (
              <RateRow key={rate.id} rate={rate} />
            ))}
          </tbody>
        </table>
      </div>

      {dataUpdatedAt && (
        <p className="mt-3 text-right text-[11px] text-text-secondary font-sans opacity-60">
          Actualizado{' '}
          {new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(
            new Date(dataUpdatedAt),
          )}
        </p>
      )}
    </div>
  );
}
