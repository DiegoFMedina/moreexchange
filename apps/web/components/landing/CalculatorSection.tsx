// PATH: apps/web/components/landing/CalculatorSection.tsx
// DESC: Sección calculadora — moreexchange_mid_footer: pill, título, card con línea gradiente, desglose y método de pago

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
    <section id="calculator" className="py-[72px] px-6 md:px-10 bg-[#08122B]">
      <div className="text-center flex flex-col items-center">
        <motion.span
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.05 }}
          className="inline-flex items-center gap-2 bg-[rgba(0,194,255,0.1)] border border-[rgba(0,194,255,0.25)] text-[#00C2FF] text-[10px] tracking-[0.14em] uppercase py-1 px-3 rounded-full mb-4 font-medium"
        >
          Calculadora de cambio
        </motion.span>
        <motion.h2
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.15 }}
          className="font-display text-[36px] font-extrabold tracking-tight mb-2 text-white"
        >
          Calcula tu cambio <span className="text-[#00C2FF]">ahora</span>
        </motion.h2>
        <motion.p
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.25 }}
          className="text-[14px] text-white/60 leading-relaxed max-w-[480px]"
        >
          Sin registro. Sin compromiso. Usa las tasas en tiempo real.
        </motion.p>
      </div>

      <div className="max-w-[560px] mx-auto mt-10">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportReveal}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
          className="relative overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0F1E45] p-8"
        >
          <div
            className="absolute top-0 left-0 right-0 h-0.5 z-10"
            style={{
              background: 'linear-gradient(90deg, transparent, #2458F5, #00C2FF, transparent)',
            }}
          />
          <ExchangeCalculator showBreakdown showPaymentMethod />
        </motion.div>
      </div>
    </section>
  );
}
