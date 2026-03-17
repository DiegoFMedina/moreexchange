// PATH: apps/web/components/rates/RatesWidget.tsx
// DESC: Widget compacto de tasas con polling 30s — para incrustar en otras páginas

'use client';

import { useRates } from '@/hooks/useRates';
import { RatesTable } from './RatesTable';

export function RatesWidget() {
  const { isFetching } = useRates();

  return (
    <div className="relative">
      {isFetching && (
        <div className="absolute top-0 right-0 flex items-center gap-1.5 text-[11px] text-accent font-sans">
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          Actualizando...
        </div>
      )}
      <RatesTable />
    </div>
  );
}
