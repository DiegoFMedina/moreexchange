// PATH: apps/web/components/landing/WhyUsSection.tsx
// DESC: Sección "Por qué elegirnos" — estilo moreexchange_mid_footer: grid 2x2, tag-val, why-icon

'use client';

import { motion } from 'framer-motion';

const FEATURES = [
  {
    tagVal: '0.8%',
    title: 'Tasas competitivas',
    description:
      'Spreads desde 0.8%. Actualizamos nuestras tasas en tiempo real para ofrecerte el mejor precio del mercado.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 2v14M5 6l4-4 4 4M5 12l4 4 4-4" />
      </svg>
    ),
  },
  {
    tagVal: '100%',
    title: 'Seguro y regulado',
    description:
      'Transacciones protegidas con SSL, verificación de identidad y cumplimiento normativo bajo regulación chilena.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 1L2 5v5c0 4 3 7 7 8 4-1 7-4 7-8V5L9 1z" />
      </svg>
    ),
  },
  {
    tagVal: '< 5 min',
    title: 'Proceso en minutos',
    description:
      'Desde que inicias el cambio hasta que recibes el dinero, el proceso completo toma menos de 5 minutos.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="9" cy="9" r="7" />
        <path d="M9 5v4l3 2" />
      </svg>
    ),
  },
  {
    tagVal: '7 días',
    title: 'Soporte en español',
    description:
      'Equipo chileno disponible para ayudarte en todo el proceso. Sin chatbots, sin esperas interminables.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M15 11a6 6 0 01-9 5.2L3 17l.8-3A6 6 0 1115 11z" />
      </svg>
    ),
  },
];

export function WhyUsSection() {
  return (
    <section className="py-12 sm:py-[72px] px-4 sm:px-6 md:px-10 bg-[#0F1E45] overflow-x-hidden">
      <div className="text-center flex flex-col items-center">
        <motion.span
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
          className="inline-flex items-center gap-2 bg-[rgba(0,194,255,0.1)] border border-[rgba(0,194,255,0.25)] text-[#00C2FF] text-[10px] tracking-[0.14em] uppercase py-1 px-3 rounded-full mb-4 font-medium"
        >
          Por qué elegirnos
        </motion.span>
        <motion.h2
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          className="font-display text-[36px] font-extrabold tracking-tight text-white"
        >
          La diferencia <span className="text-[#00C2FF]">More Exchange</span>
        </motion.h2>
      </div>

      <div className="max-w-[900px] mx-auto mt-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/[0.06] border border-white/[0.06] rounded-xl overflow-hidden">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.12 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: [0.05, 0.15, 0.25, 0.35][i] ?? 0.45 }}
              className="bg-[#08122B] p-6 sm:p-8 md:p-9 hover:bg-[#162254] hover:-translate-y-0.5 transition-all duration-[250ms] group min-w-0"
            >
              <div className="w-10 h-10 rounded-[10px] bg-[rgba(0,194,255,0.1)] border border-[rgba(0,194,255,0.25)] flex items-center justify-center mb-5 text-[#00C2FF] transition-transform duration-200 group-hover:scale-110">
                {feature.icon}
              </div>
              <div className="font-mono text-[22px] font-medium text-[#00C2FF] mb-1.5">
                {feature.tagVal}
              </div>
              <h3 className="text-[16px] font-medium text-white mb-2.5">
                {feature.title}
              </h3>
              <p className="text-[13px] text-white/60 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
