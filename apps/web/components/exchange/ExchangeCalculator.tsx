// PATH: apps/web/components/exchange/ExchangeCalculator.tsx
// DESC: Calculadora de cambio — tema claro, selector de divisas, cálculo en tiempo real

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useRates } from '@/hooks/useRates';
import { useCalculate } from '@/hooks/useExchange';
import { formatCurrency, formatRate } from '@/lib/utils';
import type { CalculationResult } from '@/types';

interface Props {
  compact?: boolean;
  showBreakdown?: boolean;
  showPaymentMethod?: boolean;
}

const PAYMENT_METHODS = [
  { id: 'card', label: 'Tarjeta de crédito / débito', icon: '💳' },
  { id: 'transfer', label: 'Transferencia bancaria', icon: '🏦' },
];

export function ExchangeCalculator({ compact, showBreakdown, showPaymentMethod }: Props) {
  const { data: rates } = useRates();
  const calculate = useCalculate();

  const currencies = rates
    ? Array.from(
        new Map(
          [...rates.map((r) => r.fromCurrency), ...rates.map((r) => r.toCurrency)].map((c) => [
            c.code,
            c,
          ]),
        ).values(),
      )
    : [];

  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('CLP');
  const [fromAmount, setFromAmount] = useState('');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('card');

  const findCurrencyId = (code: string) => {
    const rate = rates?.find((r) => r.fromCurrency.code === code || r.toCurrency.code === code);
    if (!rate) return null;
    return rate.fromCurrency.code === code ? rate.fromCurrencyId : rate.toCurrencyId;
  };

  const doCalculate = useCallback(async () => {
    if (!fromAmount || isNaN(Number(fromAmount)) || Number(fromAmount) <= 0) {
      setResult(null);
      return;
    }
    const fromId = findCurrencyId(fromCurrency);
    const toId = findCurrencyId(toCurrency);
    if (!fromId || !toId) return;
    try {
      const data = await calculate.mutateAsync({
        fromCurrencyId: fromId,
        toCurrencyId: toId,
        fromAmount: Number(fromAmount),
      });
      setResult(data);
    } catch {
      setResult(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromAmount, fromCurrency, toCurrency, rates]);

  useEffect(() => {
    const timer = setTimeout(doCalculate, 400);
    return () => clearTimeout(timer);
  }, [doCalculate]);

  const breakdownRows = result
    ? [
        {
          label: 'Tipo de cambio',
          value: `1 ${result.fromCurrency.code} = ${formatRate(result.rateApplied)} ${result.toCurrency.code}`,
        },
        { label: 'Spread aplicado', value: `${(result.spread * 100).toFixed(1)}%` },
        { label: 'Comisión', value: 'CLP 0', zero: true },
        {
          label: 'Total que recibes',
          value: formatCurrency(result.toAmount, result.toCurrency.code),
          big: true,
        },
      ]
    : [];

  return (
    <div className="space-y-0">
      {/* Envías */}
      <div className="mb-2">
        <label className="text-[10px] tracking-[0.12em] uppercase text-[#5C6489] mb-2 block font-medium">
          Envías
        </label>
        <div className="flex gap-2.5 mb-1">
          <select
            value={fromCurrency}
            onChange={(e) => setFromCurrency(e.target.value)}
            className="min-w-[115px] bg-[#F5F7FE] border border-[#E2E5F1] text-[#1B2141] text-[14px] font-sans rounded-lg py-3 px-3.5 focus:outline-none focus:border-[#2458F5] focus:ring-1 focus:ring-[#2458F5]/20 appearance-none cursor-pointer"
          >
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flagEmoji} {c.code}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="0.00"
            value={fromAmount}
            onChange={(e) => setFromAmount(e.target.value)}
            className="flex-1 bg-[#F5F7FE] border border-[#E2E5F1] text-[#1B2141] text-[20px] font-medium font-mono tabular-nums rounded-lg py-3 px-4 focus:outline-none focus:border-[#2458F5] focus:ring-1 focus:ring-[#2458F5]/20 placeholder:text-[#C8CDE0]"
          />
        </div>
      </div>

      {/* Swap */}
      <div className="flex items-center gap-3 my-2.5">
        <div className="flex-1 h-px bg-[#E2E5F1]" />
        <button
          type="button"
          onClick={() => {
            setFromCurrency(toCurrency);
            setToCurrency(fromCurrency);
          }}
          className="w-[34px] h-[34px] rounded-full bg-[#F5F7FE] border border-[#E2E5F1] flex items-center justify-center flex-shrink-0 hover:border-[#2458F5] hover:bg-[#2458F5]/5 transition-colors text-[#5C6489]"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M2 5l3-3 3 3M5 2v9M12 9l-3 3-3-3M9 11V2" />
          </svg>
        </button>
        <div className="flex-1 h-px bg-[#E2E5F1]" />
      </div>

      {/* Recibes */}
      <div className="mb-4">
        <label className="text-[10px] tracking-[0.12em] uppercase text-[#5C6489] mb-2 block font-medium">
          Recibes
        </label>
        <div className="flex gap-2.5 mb-1">
          <select
            value={toCurrency}
            onChange={(e) => setToCurrency(e.target.value)}
            className="min-w-[115px] bg-[#F5F7FE] border border-[#E2E5F1] text-[#1B2141] text-[14px] font-sans rounded-lg py-3 px-3.5 focus:outline-none focus:border-[#2458F5] focus:ring-1 focus:ring-[#2458F5]/20 appearance-none cursor-pointer"
          >
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flagEmoji} {c.code}
              </option>
            ))}
          </select>
          <div className="flex-1 bg-[#F5F7FE] border border-[#E2E5F1] rounded-lg py-3 px-4 flex items-center">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.span
                  key={result.toAmount}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[20px] font-medium font-mono tabular-nums text-[#2458F5]"
                >
                  {formatCurrency(result.toAmount, result.toCurrency.code)}
                </motion.span>
              ) : (
                <span className="text-[#C8CDE0] font-mono">—</span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Desglose */}
      {showBreakdown && (
        <div className="bg-[#F5F7FE] border border-[#E2E5F1] rounded-[10px] py-4 px-5 my-4">
          {breakdownRows.length > 0 ? (
            breakdownRows.map((row, i) => (
              <div
                key={row.label}
                className={`flex justify-between items-center py-1.5 ${i > 0 ? 'border-t border-[#E2E5F1]' : ''}`}
              >
                <span
                  className={`text-[12px] font-sans ${row.big ? 'font-medium text-[#1B2141]' : 'text-[#5C6489]'}`}
                >
                  {row.label}
                </span>
                <span
                  className={`font-mono text-[13px] tabular-nums ${
                    row.big
                      ? 'text-[18px] font-medium text-[#2458F5]'
                      : row.zero
                        ? 'text-[#059669]'
                        : 'text-[#1B2141]'
                  }`}
                >
                  {row.value}
                </span>
              </div>
            ))
          ) : (
            <>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-[12px] text-[#5C6489]">Tipo de cambio</span>
                <span className="font-mono text-[13px] text-[#1B2141]">—</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-t border-[#E2E5F1]">
                <span className="text-[12px] text-[#5C6489]">Spread aplicado</span>
                <span className="font-mono text-[13px] text-[#1B2141]">0.8%</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-t border-[#E2E5F1]">
                <span className="text-[12px] text-[#5C6489]">Comisión</span>
                <span className="font-mono text-[13px] text-[#059669]">CLP 0</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-t border-[#E2E5F1]">
                <span className="text-[12px] font-medium text-[#1B2141]">Total que recibes</span>
                <span className="font-mono text-[18px] font-medium text-[#2458F5]">—</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Método de pago */}
      {showPaymentMethod && (
        <div className="mb-5">
          <label className="text-[10px] tracking-[0.12em] uppercase text-[#5C6489] mb-2.5 block font-medium">
            Método de pago
          </label>
          <div className="flex flex-col gap-2">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setPaymentMethod(method.id)}
                className={`w-full flex items-center gap-3 py-3 px-4 rounded-lg border text-[13px] font-sans transition-all text-left ${
                  paymentMethod === method.id
                    ? 'border-[#2458F5] bg-[#2458F5]/5 text-[#1B2141]'
                    : 'border-[#E2E5F1] bg-[#F5F7FE] text-[#1B2141] hover:border-[#C8CDE0]'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border-[1.5px] flex-shrink-0 ${
                    paymentMethod === method.id
                      ? 'border-[#2458F5] bg-[#2458F5]'
                      : 'border-[#C8CDE0]'
                  }`}
                />
                <span className="flex-1">{method.label}</span>
                <span className="text-[13px] opacity-50">{method.icon}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!compact && (
        <>
          <Link
            href="/exchange"
            className="block w-full py-[15px] rounded-lg text-[15px] font-medium font-sans tracking-wide text-center text-white bg-[#2458F5] transition-colors hover:bg-[#1A3FBF] disabled:opacity-40 disabled:pointer-events-none mb-3 shadow-sm"
          >
            Continuar con el cambio →
          </Link>
          <p className="text-center text-[11px] text-[#5C6489]">
            <strong className="text-[#1B2141]">Sin registro previo.</strong> Tasa bloqueada por 1
            hora al confirmar.
          </p>
        </>
      )}
    </div>
  );
}
