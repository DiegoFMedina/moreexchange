// PATH: apps/web/components/landing/HeroSection.tsx
// DESC: Hero claro con gradiente suave azul marca, grid texto+widget, trust badges, stats bar

'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { HeroTasasWidget } from '@/components/landing/HeroTasasWidget';

const staggerDelays = [0.05, 0.15, 0.25, 0.35, 0.45];

const TRUST_ITEMS = [
  'Tasa bloqueada 1h',
  'Sin letra chica',
  'Soporte 7 días',
  '18 puntos de atención',
];

const STATS = [
  { value: '+5.000', label: 'Transacciones' },
  { value: '6', label: 'Divisas disponibles' },
  { value: '< 5 min', label: 'Tiempo promedio' },
  { value: '18', label: 'Puntos de atención' },
  { value: '7', label: 'Días de soporte' },
];

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 8 8"
      className="w-2 h-2 shrink-0 stroke-[#059669]"
      fill="none"
      strokeWidth="2.5"
    >
      <polyline points="1,4 3,6 7,2" />
    </svg>
  );
}

export function HeroSection() {
  return (
    <div
      className="font-sans w-full min-w-0 [overflow-x:clip]"
      style={{
        background:
          'radial-gradient(ellipse 80% 55% at 62% 0%, rgba(36,58,133,0.06) 0%, transparent 60%), radial-gradient(ellipse 40% 35% at 8% 85%, rgba(0,174,239,0.04) 0%, transparent 55%), #FFFFFF',
      }}
    >
      <section className="relative w-full min-w-0">
        <div className="absolute inset-0 z-0 dot-grid pointer-events-none" aria-hidden />
        {/* Toro: fondo sutil */}
        <div
          className="absolute top-0 right-0 z-0 select-none pointer-events-none w-[55%] h-full"
          style={{ bottom: '-60px' }}
          aria-hidden
        >
          <Image
            src="/toro.png"
            alt=""
            fill
            className="object-contain object-center"
            sizes="50vw"
            priority={false}
            style={{ opacity: 0.1 }}
          />
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-0 px-4 sm:px-6 lg:px-10 pt-20 sm:pt-24 lg:pt-28 pb-0 lg:items-start max-w-[1400px] mx-auto">
          {/* Columna izquierda */}
          <div className="pr-0 lg:pr-10 pb-8 sm:pb-12 lg:pb-[52px]">
            <div className="max-w-xl min-w-0">
              {/* Tag pill */}
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: staggerDelays[0] }}
                className="mb-6"
              >
                <span className="inline-flex items-center gap-1.5 bg-[#E8EAF6] border border-[#C8CDE0] text-[#243a85] text-[10px] tracking-[0.14em] uppercase py-1.5 px-3 rounded-full font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2458F5] animate-pulse-dot" />
                  Tasas en tiempo real
                </span>
              </motion.div>

              {/* H1 */}
              <motion.h1
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: staggerDelays[1] }}
                className="font-display text-[36px] sm:text-[44px] lg:text-[56px] font-extrabold leading-[1.02] tracking-[-0.025em] mb-2"
              >
                <span className="text-[#8c8fc0]">Cambia divisas</span>
                <br />
                <span className="text-[#2458F5]">sin sorpresas.</span>
                <br />
                <span className="text-[#8c8fc0]">Envía dinero</span>
                <br />
                <span className="text-[#1B2141]">al mundo.</span>
              </motion.h1>

              {/* Sub */}
              <motion.p
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: staggerDelays[2] }}
                className="text-[14px] sm:text-[15px] leading-[1.7] text-[#5C6489] max-w-[400px] mb-6 sm:mb-8 font-light"
              >
                USD, EUR, GBP, BRL y más — directo a tu cuenta o a quien más quieres. Tasas
                competitivas, proceso en minutos.
              </motion.p>

              {/* Toggle */}
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: staggerDelays[3] }}
                className="mb-8"
              >
                <div className="inline-flex rounded-lg bg-[#F0F2FA] border border-[#E2E5F1] p-1 gap-0 max-w-full">
                  <span className="px-3 sm:px-5 py-2 rounded-md bg-[#2458F5] text-white text-[12px] sm:text-[13px] font-medium whitespace-nowrap shadow-sm">
                    Cambio de divisas
                  </span>
                  <Link
                    href="/exchange"
                    className="px-3 sm:px-5 py-2 rounded-md text-[12px] sm:text-[13px] text-[#5C6489] hover:text-[#243a85] transition-colors whitespace-nowrap"
                  >
                    Remesas
                  </Link>
                </div>
              </motion.div>

              {/* Trust row */}
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: staggerDelays[4] }}
                className="flex flex-wrap gap-x-4 gap-y-3 sm:gap-5"
              >
                {TRUST_ITEMS.map((label) => (
                  <div
                    key={label}
                    className="flex items-center gap-1.5 text-[11px] sm:text-[12px] text-[#5C6489]"
                  >
                    <span className="w-4 h-4 rounded-full border border-[#059669]/30 bg-[#059669]/10 flex items-center justify-center shrink-0">
                      <CheckIcon />
                    </span>
                    {label}
                  </div>
                ))}
              </motion.div>
            </div>
          </div>

          {/* Widget Tasas de hoy */}
          <motion.div
            className="w-full min-w-0 lg:max-w-[360px]"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: staggerDelays[2] }}
          >
            <div className="animate-float">
              <HeroTasasWidget />
            </div>
          </motion.div>
        </div>

        {/* Barra de stats */}
        <div className="relative z-10 border-t border-[#E2E5F1]/50 grid grid-cols-1 sm:flex sm:flex-wrap lg:flex-nowrap py-3 sm:py-[22px] px-4 sm:px-6 lg:px-10 bg-white/60 backdrop-blur-sm">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.65,
                ease: [0.22, 1, 0.36, 1],
                delay: staggerDelays[i] ?? 0.5,
              }}
              className="flex-1 min-w-0 py-3 px-4 border-b border-[#E2E5F1] last:border-b-0 sm:border-b-0 sm:border-r sm:border-[#E2E5F1] sm:last:border-r-0 text-center"
            >
              <p className="font-display text-[22px] sm:text-[26px] font-bold text-[#1B2141] mb-0.5 tabular-nums leading-tight">
                {i === 0 && <span className="text-[#2458F5]">+</span>}
                {stat.value}
              </p>
              <p className="text-[12px] text-[#5C6489]">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
