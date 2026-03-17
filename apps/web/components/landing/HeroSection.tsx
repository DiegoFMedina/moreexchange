// PATH: apps/web/components/landing/HeroSection.tsx
// DESC: Hero alineado a moreexchange_hero_brand_azul — grid, tag pill, h1 en 4 líneas, toggle, trust, card con línea gradiente, barra de stats

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
    <svg viewBox="0 0 8 8" className="w-2 h-2 shrink-0 stroke-[#00C2FF]" fill="none" strokeWidth="2.5">
      <polyline points="1,4 3,6 7,2" />
    </svg>
  );
}

export function HeroSection() {
  return (
    <div
      className="font-sans text-white"
      style={{
        background:
          'radial-gradient(ellipse 80% 55% at 62% 0%, rgba(36,88,245,0.2) 0%, transparent 60%), radial-gradient(ellipse 40% 35% at 8% 85%, rgba(0,194,255,0.08) 0%, transparent 55%), #0A1530',
      }}
    >
      {/* Hero grid: texto izquierda | card derecha. Sin overflow-hidden para que el toro pueda extenderse. */}
      <section className="relative">
        <div className="absolute inset-0 z-0 dot-grid pointer-events-none opacity-[0.04]" aria-hidden />
        {/* Toro: fondo que cubre hero + barra de stats y se extiende un poco hacia abajo para evitar corte brusco */}
        <div
          className="absolute top-0 left-0 right-0 z-0 select-none pointer-events-none"
          style={{ bottom: '-120px' }}
          aria-hidden
        >
          <Image
            src="/toro.png"
            alt=""
            fill
            className="object-cover object-right object-bottom"
            sizes="100vw"
            priority={false}
            style={{ opacity: 0.09 }}
          />
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-0 px-6 lg:px-10 pt-24 lg:pt-28 pb-0 lg:items-start max-w-[1400px] mx-auto">
          {/* Columna izquierda */}
          <div className="pr-0 lg:pr-10 pb-12 lg:pb-[52px]">
            <div className="max-w-xl">
              {/* Tag pill — d1 */}
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: staggerDelays[0] }}
                className="mb-6"
              >
                <span className="inline-flex items-center gap-1.5 bg-[rgba(0,194,255,0.12)] border border-[rgba(0,194,255,0.3)] text-[#00C2FF] text-[10px] tracking-[0.14em] uppercase py-1.5 px-3 rounded-full font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00C2FF] animate-pulse-dot" />
                  Tasas en tiempo real
                </span>
              </motion.div>

              {/* H1 — d2 */}
              <motion.h1
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: staggerDelays[1] }}
                className="font-display text-[56px] lg:text-[56px] font-extrabold leading-[1.02] tracking-[-0.025em] mb-2"
              >
                <span className="text-white/20">Cambia divisas</span>
                <br />
                <span className="text-[#00C2FF]">sin sorpresas.</span>
                <br />
                <span className="text-white/20">Envía dinero</span>
                <br />
                al mundo.
              </motion.h1>

              {/* Sub — d3 */}
              <motion.p
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: staggerDelays[2] }}
                className="text-[15px] leading-[1.7] text-white/45 max-w-[400px] mb-8 font-light"
              >
                USD, EUR, GBP, BRL y más — directo a tu cuenta o a quien más quieres. Tasas competitivas, proceso en minutos.
              </motion.p>

              {/* Toggle — d4 */}
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: staggerDelays[3] }}
                className="mb-8"
              >
                <div className="inline-flex rounded-lg bg-[#0F1E45] border border-[rgba(255,255,255,0.07)] p-1 gap-0">
                  <span className="px-5 py-2 rounded-md bg-[#2458F5] text-white text-[13px] font-medium">
                    Cambio de divisas
                  </span>
                  <Link
                    href="/exchange"
                    className="px-5 py-2 rounded-md text-[13px] text-white/45 hover:text-white transition-colors"
                  >
                    Remesas
                  </Link>
                </div>
              </motion.div>

              {/* Trust row — d5 */}
              <motion.div
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: staggerDelays[4] }}
                className="flex flex-wrap gap-5"
              >
                {TRUST_ITEMS.map((label) => (
                  <div key={label} className="flex items-center gap-1.5 text-[12px] text-white/45">
                    <span className="w-4 h-4 rounded-full border border-[rgba(36,88,245,0.35)] flex items-center justify-center shrink-0 text-[#00C2FF]">
                      <CheckIcon />
                    </span>
                    {label}
                  </div>
                ))}
              </motion.div>
            </div>
          </div>

          {/* Widget Tasas de hoy — reveal d3 + float */}
          <motion.div
            className="w-full lg:max-w-[360px]"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: staggerDelays[2] }}
          >
            <div className="animate-float">
              <HeroTasasWidget />
            </div>
          </motion.div>
        </div>

        {/* Barra de stats — reveal con delays + vida visual (blur como moreexchange_final) */}
        <div className="relative z-10 border-t border-white/[0.07] flex flex-wrap lg:flex-nowrap py-[22px] px-6 lg:px-10 bg-[rgba(17,32,80,0.55)] backdrop-blur-[10px]">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: staggerDelays[i] ?? 0.5 }}
              className="flex-1 min-w-[100px] px-4 lg:px-7 border-r border-white/[0.06] last:border-r-0 text-center"
            >
              <p className="font-display text-[26px] font-bold text-white mb-0.5 tabular-nums">
                {i === 0 && <span className="text-[#00C2FF]">+</span>}
                {i === 2 && <span className="text-[14px] font-normal text-white/45"> </span>}
                {stat.value}
              </p>
              <p className="text-[12px] text-white/45">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
