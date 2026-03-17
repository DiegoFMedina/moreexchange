// PATH: apps/web/components/landing/HowItWorksSection.tsx
// DESC: Sección "Cómo funciona" — estilo moreexchange_mid_footer: 3 pasos con círculo, conector, botones

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const STEPS = [
  {
    step: '01',
    title: 'Elige tu divisa',
    description:
      'Selecciona el par de monedas y el monto que deseas cambiar. La calculadora muestra el resultado en tiempo real.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="9" cy="9" r="3" />
        <path d="M9 2v2M9 14v2M2 9h2M14 9h2" />
      </svg>
    ),
  },
  {
    step: '02',
    title: 'Confirma el monto',
    description:
      'Revisa el desglose: monto base, spread aplicado y monto final. Sin comisiones ocultas, sin letra chica.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 9l4 4 6-7" />
      </svg>
    ),
  },
  {
    step: '03',
    title: 'Recibe tu dinero',
    description:
      'Paga con tarjeta o transferencia. El cambio se acredita en tu cuenta en minutos. Sin esperas.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="5" width="14" height="10" rx="2" />
        <path d="M2 9h14M6 13h2" />
      </svg>
    ),
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-[72px] px-6 md:px-10 bg-[#08122B]">
      <div className="text-center flex flex-col items-center">
        <motion.span
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
          className="inline-flex items-center gap-2 bg-[rgba(0,194,255,0.1)] border border-[rgba(0,194,255,0.25)] text-[#00C2FF] text-[10px] tracking-[0.14em] uppercase py-1 px-3 rounded-full mb-4 font-medium"
        >
          Cómo funciona
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          className="font-display text-[36px] font-extrabold tracking-tight text-white"
        >
          Tres pasos. <span className="text-[#00C2FF]">Sin complicaciones.</span>
        </motion.h2>
      </div>

      <div className="max-w-[900px] mx-auto mt-14 relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          <div
            className="hidden md:block absolute top-7 left-[calc(33.33%-1px)] w-1/3 h-px bg-[#2458F5]/40"
            aria-hidden
          />
          <div
            className="hidden md:block absolute top-7 left-[calc(66.66%-1px)] w-1/3 h-px bg-[#2458F5]/40"
            aria-hidden
          />

          {STEPS.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.12 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: [0.05, 0.15, 0.25][i] ?? 0.35 }}
              className={`relative py-0 px-6 md:px-8 group ${i === 0 ? 'md:pl-0' : ''} ${i === STEPS.length - 1 ? 'md:pr-0' : ''}`}
            >
              <div className="w-14 h-14 rounded-full bg-[#0F1E45] border border-[#2458F5] flex items-center justify-center mb-6 relative z-[1] text-[#00C2FF] transition-all duration-300 group-hover:scale-110 group-hover:border-[#00C2FF] group-hover:bg-[rgba(36,88,245,0.22)]">
                {s.icon}
              </div>
              <div className="font-mono text-[11px] tracking-wider text-white/60 mb-3">
                {s.step}
              </div>
              <h3 className="text-[16px] font-medium text-white mb-2.5">
                {s.title}
              </h3>
              <p className="text-[13px] text-white/60 leading-relaxed">
                {s.description}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mt-12">
          <Link
            href="/exchange"
            className="inline-flex items-center justify-center bg-[#2458F5] text-white py-3.5 px-8 rounded-lg text-[14px] font-medium font-sans hover:bg-[#1A3FBF] transition-colors"
          >
            Empezar ahora →
          </Link>
          <Link
            href="/sucursales"
            className="inline-flex items-center justify-center bg-transparent border border-white/15 text-white/60 py-3.5 px-8 rounded-lg text-[14px] font-sans hover:text-white hover:border-white/25 transition-colors"
          >
            Ver sucursales
          </Link>
        </div>
      </div>
    </section>
  );
}
