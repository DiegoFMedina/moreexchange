// PATH: apps/web/components/landing/GlobeBidirectionalSection.tsx
// DESC: Módulo "Red de envíos globales" — globo con rutas bidireccionales Chile ↔ mundo (moreexchange_globe_bidireccional.html)

'use client';

import { useEffect, useRef, useLayoutEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

const W = 500;
const H = 500;
const CX = W / 2;
const CY = H / 2;
const R = 188;

const PINS = [
  { flag: '🇺🇸', name: 'Estados Unidos', cur: 'USD', ang: -62, r: 218, colorIn: 'rgba(0,194,255,0.9)', colorOut: 'rgba(0,229,160,0.85)' },
  { flag: '🇪🇺', name: 'Europa', cur: 'EUR', ang: -22, r: 213, colorIn: 'rgba(0,194,255,0.85)', colorOut: 'rgba(0,229,160,0.8)' },
  { flag: '🇬🇧', name: 'Reino Unido', cur: 'GBP', ang: 18, r: 216, colorIn: 'rgba(0,194,255,0.8)', colorOut: 'rgba(0,229,160,0.75)' },
  { flag: '🇨🇳', name: 'China', cur: 'CNY', ang: 58, r: 220, colorIn: 'rgba(255,184,0,0.85)', colorOut: 'rgba(255,184,0,0.7)' },
  { flag: '🇧🇷', name: 'Brasil', cur: 'BRL', ang: 102, r: 214, colorIn: 'rgba(255,184,0,0.8)', colorOut: 'rgba(255,184,0,0.65)' },
  { flag: '🇻🇪', name: 'Venezuela', cur: 'VES', ang: 142, r: 212, colorIn: 'rgba(0,229,160,0.85)', colorOut: 'rgba(0,194,255,0.8)' },
  { flag: '🇨🇴', name: 'Colombia', cur: 'COP', ang: 178, r: 215, colorIn: 'rgba(0,229,160,0.9)', colorOut: 'rgba(0,194,255,0.85)' },
  { flag: '🇵🇪', name: 'Perú', cur: 'PEN', ang: -178, r: 213, colorIn: 'rgba(0,229,160,0.85)', colorOut: 'rgba(0,194,255,0.8)' },
  { flag: '🇦🇷', name: 'Argentina', cur: 'ARS', ang: -142, r: 218, colorIn: 'rgba(0,229,160,0.8)', colorOut: 'rgba(0,194,255,0.75)' },
  { flag: '🇧🇴', name: 'Bolivia', cur: 'BOB', ang: -102, r: 214, colorIn: 'rgba(0,229,160,0.8)', colorOut: 'rgba(0,194,255,0.75)' },
];

function angRad(a: number) {
  return (a * Math.PI) / 180;
}
function pinAnchorPos(ang: number) {
  return { x: CX + (R + 16) * Math.cos(angRad(ang)), y: CY + (R + 16) * Math.sin(angRad(ang)) };
}
function pinLabelPos(ang: number, radius: number) {
  return { x: CX + radius * Math.cos(angRad(ang)), y: CY + radius * Math.sin(angRad(ang)) };
}

const viewportReveal = { once: true, amount: 0.12 };
const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: viewportReveal,
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
};

export function GlobeBidirectionalSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const pinRefs = useRef<(HTMLDivElement | null)[]>([]);

  const streams = useMemo(() => {
    const NPAR = 3;
    return PINS.map(() => {
      const spd = 0.0022 + Math.random() * 0.0012;
      return {
        inPars: Array.from({ length: NPAR }, (_, j) => ({ t: j / NPAR, spd })),
        outPars: Array.from({ length: NPAR }, (_, j) => ({ t: (j / NPAR + 0.5) % 1, spd })),
      };
    });
  }, []);

  useLayoutEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    PINS.forEach((pin, i) => {
      const el = pinRefs.current[i];
      if (!el) return;
      const pill = el.querySelector('[data-pill]') as HTMLElement;
      const stem = el.querySelector('[data-stem]') as HTMLElement;
      if (!pill || !stem) return;
      const anc = pinAnchorPos(pin.ang);
      const lbl = pinLabelPos(pin.ang, pin.r);
      const pw = pill.offsetWidth || 130;
      const ph = pill.offsetHeight || 28;
      const dist = Math.sqrt((lbl.x - anc.x) ** 2 + (lbl.y - anc.y) ** 2);
      const stemH = Math.max(10, dist - ph / 2 - 4);
      stem.style.height = `${stemH}px`;
      el.style.left = `${anc.x - pw / 2}px`;
      el.style.top = `${anc.y - stemH - ph - 5}px`;
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rot = 0;
    let frame = 0;
    let rafId: number;

    function ctrlPt(ax: number, ay: number, side: number) {
      const mx = (ax + CX) / 2;
      const my = (ay + CY) / 2;
      const dx = CX - ax;
      const dy = CY - ay;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const nx = -dy / dist;
      const ny = dx / dist;
      const lift = dist * 0.2 + 20;
      return { x: mx + nx * lift * side, y: my + ny * lift * side };
    }

    function bezier(
      t: number,
      ax: number,
      ay: number,
      cpx: number,
      cpy: number,
      bx: number,
      by: number
    ) {
      const mt = 1 - t;
      return {
        x: mt * mt * ax + 2 * mt * t * cpx + t * t * bx,
        y: mt * mt * ay + 2 * mt * t * cpy + t * t * by,
      };
    }

    function arrowhead(fromX: number, fromY: number, toX: number, toY: number, color: string, sz = 7) {
      if (!ctx) return;
      const ang = Math.atan2(toY - fromY, toX - fromX);
      ctx.save();
      ctx.translate(toX, toY);
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-sz, -sz * 0.42);
      ctx.lineTo(-sz * 0.5, 0);
      ctx.lineTo(-sz, sz * 0.42);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.restore();
    }

    function diamond(px: number, py: number, ang: number, color: string, sz: number) {
      if (!ctx) return;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.moveTo(sz, 0);
      ctx.lineTo(0, -sz * 0.5);
      ctx.lineTo(-sz, 0);
      ctx.lineTo(0, sz * 0.5);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.shadowColor = color.replace(/[\d.]+\)$/, '0.9)');
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.restore();
    }

    function drawGlobe() {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);

      const og = ctx.createRadialGradient(CX, CY, R * 0.8, CX, CY, R * 1.22);
      og.addColorStop(0, 'rgba(36,88,245,0)');
      og.addColorStop(0.85, 'rgba(36,88,245,0.07)');
      og.addColorStop(1, 'rgba(0,194,255,0.15)');
      ctx.beginPath();
      ctx.arc(CX, CY, R * 1.22, 0, Math.PI * 2);
      ctx.fillStyle = og;
      ctx.fill();

      const gb = ctx.createRadialGradient(CX - 55, CY - 65, 15, CX, CY, R);
      gb.addColorStop(0, '#1E4090');
      gb.addColorStop(0.45, '#0D2460');
      gb.addColorStop(1, '#050F28');
      ctx.beginPath();
      ctx.arc(CX, CY, R, 0, Math.PI * 2);
      ctx.fillStyle = gb;
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.arc(CX, CY, R, 0, Math.PI * 2);
      ctx.clip();
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        let first = true;
        for (let lng = -180; lng <= 180; lng += 4) {
          const phi = ((90 - lat) * Math.PI) / 180;
          const theta = ((lng + rot) * Math.PI) / 180;
          const x = R * Math.sin(phi) * Math.cos(theta);
          const y = R * Math.cos(phi);
          const z = R * Math.sin(phi) * Math.sin(theta);
          if (z > -20) {
            const sx = CX + x;
            const sy = CY - y;
            first ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
            first = false;
          } else first = true;
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
      for (let lng = 0; lng < 360; lng += 30) {
        ctx.beginPath();
        let first = true;
        for (let lat = -80; lat <= 80; lat += 4) {
          const phi = ((90 - lat) * Math.PI) / 180;
          const theta = ((lng + rot) * Math.PI) / 180;
          const x = R * Math.sin(phi) * Math.cos(theta);
          const y = R * Math.cos(phi);
          const z = R * Math.sin(phi) * Math.sin(theta);
          if (z > -20) {
            const sx = CX + x;
            const sy = CY - y;
            first ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
            first = false;
          } else first = true;
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
      ctx.restore();

      PINS.forEach((pin, ri) => {
        const anc = pinAnchorPos(pin.ang);
        const ax = anc.x;
        const ay = anc.y;
        const s = streams[ri];
        const cpIn = ctrlPt(ax, ay, 1);
        const cpOut = ctrlPt(ax, ay, -1);

        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.quadraticCurveTo(cpIn.x, cpIn.y, CX, CY);
        ctx.strokeStyle = pin.colorIn.replace(/[\d.]+\)$/, '0.15)');
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.moveTo(CX, CY);
        ctx.quadraticCurveTo(cpOut.x, cpOut.y, ax, ay);
        ctx.strokeStyle = pin.colorOut.replace(/[\d.]+\)$/, '0.15)');
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        const inTip = bezier(0.9, ax, ay, cpIn.x, cpIn.y, CX, CY);
        const inPrev = bezier(0.82, ax, ay, cpIn.x, cpIn.y, CX, CY);
        arrowhead(inPrev.x, inPrev.y, inTip.x, inTip.y, pin.colorIn.replace(/[\d.]+\)$/, '0.95)'), 8);

        const outTip = bezier(0.9, CX, CY, cpOut.x, cpOut.y, ax, ay);
        const outPrev = bezier(0.82, CX, CY, cpOut.x, cpOut.y, ax, ay);
        arrowhead(outPrev.x, outPrev.y, outTip.x, outTip.y, pin.colorOut.replace(/[\d.]+\)$/, '0.95)'), 8);

        s.inPars.forEach((p: { t: number; spd: number }) => {
          p.t += p.spd;
          if (p.t > 1) p.t = 0;
          const pos = bezier(p.t, ax, ay, cpIn.x, cpIn.y, CX, CY);
          const pos2 = bezier(Math.min(p.t + 0.02, 1), ax, ay, cpIn.x, cpIn.y, CX, CY);
          const ang = Math.atan2(pos2.y - pos.y, pos2.x - pos.x);
          const alpha = p.t < 0.1 ? p.t / 0.1 : p.t > 0.88 ? (1 - p.t) / 0.12 : 1;
          diamond(pos.x, pos.y, ang, pin.colorIn.replace(/[\d.]+\)$/, `${alpha})`), 3.5);
        });

        s.outPars.forEach((p: { t: number; spd: number }) => {
          p.t += p.spd;
          if (p.t > 1) p.t = 0;
          const pos = bezier(p.t, CX, CY, cpOut.x, cpOut.y, ax, ay);
          const pos2 = bezier(Math.min(p.t + 0.02, 1), CX, CY, cpOut.x, cpOut.y, ax, ay);
          const ang = Math.atan2(pos2.y - pos.y, pos2.x - pos.x);
          const alpha = p.t < 0.1 ? p.t / 0.1 : p.t > 0.88 ? (1 - p.t) / 0.12 : 1;
          diamond(pos.x, pos.y, ang, pin.colorOut.replace(/[\d.]+\)$/, `${alpha})`), 3.5);
        });
      });

      const pulse = (Math.sin(frame * 0.04) + 1) / 2;
      [
        [30, 0.05],
        [22, 0.1],
        [15, 0.18],
      ].forEach(([r, a]) => {
        ctx.beginPath();
        ctx.arc(CX, CY, (r as number) + pulse * 3, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0,194,255,${a})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      const atm = ctx.createRadialGradient(CX, CY, R * 0.85, CX, CY, R * 1.04);
      atm.addColorStop(0, 'rgba(0,194,255,0)');
      atm.addColorStop(0.7, 'rgba(0,194,255,0.04)');
      atm.addColorStop(1, 'rgba(0,194,255,0.2)');
      ctx.beginPath();
      ctx.arc(CX, CY, R * 1.04, 0, Math.PI * 2);
      ctx.fillStyle = atm;
      ctx.fill();
      const sh = ctx.createRadialGradient(CX - 65, CY - 65, 4, CX - 45, CY - 45, R * 0.6);
      sh.addColorStop(0, 'rgba(255,255,255,0.07)');
      sh.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(CX, CY, R, 0, Math.PI * 2);
      ctx.fillStyle = sh;
      ctx.fill();

      rot += 0.14;
      frame++;
      rafId = requestAnimationFrame(drawGlobe);
    }

    drawGlobe();
    return () => cancelAnimationFrame(rafId);
  }, [streams]);

  return (
    <section className="py-[72px] px-6 md:px-10 bg-[#08122B] font-sans text-white">
      <div className="flex flex-col items-center max-w-4xl mx-auto">
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.05 }}
          className="inline-flex items-center gap-2 bg-[rgba(0,194,255,0.1)] border border-[rgba(0,194,255,0.25)] text-[#00C2FF] text-[10px] tracking-[0.14em] uppercase py-1 px-3 rounded-full mb-4 font-medium"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#00C2FF] animate-pulse-dot" />
          Red de envíos globales
        </motion.div>
        <motion.h2
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.15 }}
          className="font-display text-[28px] md:text-[32px] font-extrabold tracking-tight text-center mb-2"
        >
          Conectamos <span className="text-[#00C2FF]">Chile con el mundo</span>
        </motion.h2>
        <motion.p
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.25 }}
          className="text-[13px] text-white/45 text-center mb-8 max-w-[480px]"
        >
          Envíos y cambios de divisas a más de 40 países. Ida y vuelta, rápido y seguro.
        </motion.p>

        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.3 }}
          ref={sceneRef}
          className="relative w-[min(500px,100%)] h-[min(500px,100vw)] min-h-[320px]"
        >
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className="absolute inset-0 w-full h-full"
            style={{ width: '100%', height: '100%', maxWidth: 500, maxHeight: 500 }}
          />

          {/* Chile hub */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none flex items-center justify-center"
            aria-hidden
          >
            <div className="relative w-[76px] h-[76px] flex items-center justify-center">
              <div className="absolute w-[76px] h-[76px] rounded-full border border-[rgba(0,194,255,0.1)]" />
              <div className="absolute w-[60px] h-[60px] rounded-full border border-[rgba(0,194,255,0.2)]" />
              <div
                className="relative z-10 w-[46px] h-[46px] rounded-full flex flex-col items-center justify-center text-center border-2 border-[#00C2FF] animate-globe-hub-pulse"
                style={{ background: 'linear-gradient(135deg, #1A3FBF, #2458F5)' }}
              >
                <span className="text-xl leading-none">🇨🇱</span>
                <span className="text-[7px] font-medium text-white/70 tracking-wider mt-0.5">CHL</span>
              </div>
            </div>
          </div>

          {/* Flag pins — en móvil solo bandera + código para evitar solapamientos */}
          {PINS.map((pin, i) => (
            <div
              key={pin.cur}
              ref={(el) => {
                pinRefs.current[i] = el;
              }}
              className="absolute flex flex-col items-center pointer-events-none whitespace-nowrap animate-globe-pin-float"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <div
                data-pill
                className="bg-[#08122B]/95 border border-white/[0.18] rounded-[22px] py-1 sm:py-1.5 pl-1.5 sm:pl-2 pr-2 sm:pr-3 flex items-center gap-1 sm:gap-1.5"
              >
                <span className="text-[13px] sm:text-[15px] leading-none">{pin.flag}</span>
                <span className="text-[10px] sm:text-[11px] font-medium text-white hidden sm:inline">{pin.name}</span>
                <span className="text-[9px] sm:text-[10px] text-[#00C2FF] font-mono">{pin.cur}</span>
              </div>
              <div
                data-stem
                className="w-px min-h-[10px] bg-gradient-to-b from-[rgba(0,194,255,0.5)] to-transparent"
              />
              <div className="w-1.5 h-1.5 rounded-full bg-[#00C2FF] shadow-[0_0_8px_#00C2FF]" />
            </div>
          ))}
        </motion.div>

        {/* Stats */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.4 }}
          className="flex flex-wrap gap-4 justify-center mt-6"
        >
          {[
            { val: <><span className="text-[#00C2FF]">40</span>+</>, lbl: 'Países' },
            { val: <><span className="text-[#00C2FF]">&lt;</span>24h</>, lbl: 'Entrega' },
            { val: <>0<span className="text-[#00C2FF]">%</span></>, lbl: 'Comisión' },
            { val: <><span className="text-[#00C2FF]">6</span></>, lbl: 'Divisas' },
          ].map((stat) => (
            <div
              key={stat.lbl}
              className="bg-[#0F1E45]/90 border border-white/[0.07] rounded-xl py-3 px-5 text-center min-w-[80px]"
            >
              <div className="font-mono text-[20px] font-medium text-white">{stat.val}</div>
              <div className="text-[10px] text-white/45 mt-0.5">{stat.lbl}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
