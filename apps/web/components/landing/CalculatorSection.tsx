// PATH: apps/web/components/landing/CalculatorSection.tsx
// DESC: Sección calculadora — tema claro, card con sombra y línea gradiente marca

'use client';

import { motion } from 'framer-motion';
import { ExchangeCalculator } from '@/components/exchange/ExchangeCalculator';

const viewportReveal = { once: true, amount: 0.12 };
const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: viewportReveal,
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
};

export function CalculatorSection() {
  return (
    <section
      id="calculator"
      className="py-12 sm:py-[72px] px-4 sm:px-6 md:px-10 bg-[#F5F7FE] overflow-x-hidden"
    >
      <div className="text-center flex flex-col items-center">
        <motion.span
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.05 }}
          className="inline-flex items-center gap-2 bg-[#E8EAF6] border border-[#C8CDE0] text-[#243a85] text-[10px] tracking-[0.14em] uppercase py-1 px-3 rounded-full mb-4 font-medium"
        >
          Calculadora de cambio
        </motion.span>
        <motion.h2
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.15 }}
          className="font-display text-[28px] sm:text-[36px] font-extrabold tracking-tight mb-2 text-[#1B2141] px-2"
        >
          Calcula tu cambio <span className="text-[#2458F5]">ahora</span>
        </motion.h2>
        <motion.p
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.25 }}
          className="text-[13px] sm:text-[14px] text-[#5C6489] leading-relaxed max-w-[480px] px-2"
        >
          Sin registro. Sin compromiso. Usa las tasas en tiempo real.
        </motion.p>
      </div>

      <div className="max-w-[560px] mx-auto mt-8 sm:mt-10 px-2 sm:px-0">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportReveal}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
          className="relative overflow-hidden rounded-2xl border border-[#E2E5F1] bg-white shadow-widget p-4 sm:p-6 md:p-8 min-w-0"
        >
          <div
            className="absolute top-0 left-0 right-0 h-[3px] z-10"
            style={{
              background:
                'linear-gradient(90deg, transparent, #243a85, #2458F5, #00AEEF, transparent)',
            }}
          />
          <ExchangeCalculator showBreakdown showPaymentMethod />
        </motion.div>
      </div>
    </section>
  );
}
