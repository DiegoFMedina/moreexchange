// PATH: apps/web/components/sucursales/SucursalesMapSvg.tsx
// DESC: Mapa SVG estilizado Santiago — marcadores S1–S5 (sucursales) y T1–T8 (tótems)

'use client';

import type { SucursalMap, TotemMap } from '@/lib/sucursales-page-data';

type Props = {
  suc: SucursalMap[];
  tot: TotemMap[];
  onSelectSuc: (index: number) => void;
  onSelectTot: (index: number) => void;
};

export function SucursalesMapSvg({ suc, tot, onSelectSuc, onSelectTot }: Props) {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 760 540"
      preserveAspectRatio="xMidYMid meet"
      className="block"
      aria-label="Mapa de sucursales y tótems"
    >
      <rect width="760" height="540" fill="#0D1B3E" />
      {/* Parques */}
      <ellipse cx="560" cy="80" rx="60" ry="30" fill="rgba(0,80,40,0.25)" opacity="0.6" />
      <rect x="30" y="200" width="80" height="50" rx="4" fill="rgba(0,80,40,0.25)" opacity="0.5" />
      <rect x="620" y="350" width="100" height="60" rx="4" fill="rgba(0,80,40,0.25)" opacity="0.4" />
      {/* Río Mapocho */}
      <path
        d="M0 310 Q100 295 200 308 Q300 320 400 305 Q500 292 600 300 Q680 307 760 295"
        stroke="#1A5F8A"
        strokeWidth="10"
        fill="none"
        opacity="0.6"
      />
      {/* Bloques */}
      {[
        [60, 60, 45, 35], [115, 60, 35, 35], [160, 60, 55, 35], [60, 105, 75, 40], [145, 105, 45, 40],
        [220, 60, 40, 80], [270, 60, 50, 35], [330, 60, 45, 35], [385, 60, 60, 35], [270, 105, 40, 40],
        [320, 105, 60, 40], [390, 105, 50, 40], [460, 60, 70, 55], [540, 60, 40, 35], [600, 60, 50, 55],
        [660, 60, 70, 35], [660, 105, 70, 40], [60, 160, 55, 40], [125, 160, 45, 40], [180, 160, 60, 40],
        [250, 160, 50, 40], [310, 160, 55, 40], [375, 160, 65, 40], [450, 160, 50, 40], [510, 160, 60, 40],
        [580, 160, 45, 40], [635, 160, 60, 40], [700, 160, 40, 40], [60, 340, 50, 45], [120, 340, 60, 45],
        [190, 340, 45, 45], [245, 340, 55, 45], [310, 340, 50, 45], [370, 340, 60, 45], [440, 340, 50, 45],
        [500, 340, 65, 45], [575, 340, 55, 45], [640, 340, 80, 45], [60, 395, 70, 40], [140, 395, 50, 40],
        [200, 395, 60, 40], [270, 395, 55, 40], [335, 395, 50, 40], [395, 395, 65, 40], [470, 395, 55, 40],
        [535, 395, 60, 40], [605, 395, 50, 40], [665, 395, 65, 40], [60, 450, 80, 40], [150, 450, 60, 40],
        [220, 450, 70, 40], [300, 450, 55, 40], [365, 450, 65, 40], [440, 450, 60, 40], [510, 450, 70, 40],
        [590, 450, 55, 40], [655, 450, 75, 40],
      ].map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} rx="2" fill="rgba(15,30,69,0.8)" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
      ))}
      {/* Calles principales */}
      <line x1="0" y1="215" x2="760" y2="215" stroke="rgba(36,88,245,0.2)" strokeWidth="3" fill="none" />
      <line x1="0" y1="395" x2="760" y2="395" stroke="rgba(36,88,245,0.2)" strokeWidth="3" fill="none" />
      <line x1="200" y1="0" x2="200" y2="540" stroke="rgba(36,88,245,0.2)" strokeWidth="3" fill="none" />
      <line x1="460" y1="0" x2="460" y2="540" stroke="rgba(36,88,245,0.2)" strokeWidth="3" fill="none" />
      {/* Calles secundarias */}
      <line x1="0" y1="155" x2="760" y2="155" stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none" />
      <line x1="0" y1="335" x2="760" y2="335" stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none" />
      <line x1="0" y1="445" x2="760" y2="445" stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none" />
      <line x1="100" y1="0" x2="100" y2="540" stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none" />
      <line x1="330" y1="0" x2="330" y2="540" stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none" />
      <line x1="580" y1="0" x2="580" y2="540" stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none" />
      <line x1="680" y1="0" x2="680" y2="540" stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none" />
      {/* Calles menores */}
      <line x1="0" y1="100" x2="760" y2="100" stroke="rgba(255,255,255,0.06)" strokeWidth="1" fill="none" />
      <line x1="0" y1="260" x2="760" y2="260" stroke="rgba(255,255,255,0.06)" strokeWidth="1" fill="none" />
      <line x1="0" y1="490" x2="760" y2="490" stroke="rgba(255,255,255,0.06)" strokeWidth="1" fill="none" />
      <line x1="155" y1="0" x2="155" y2="540" stroke="rgba(255,255,255,0.06)" strokeWidth="1" fill="none" />
      <line x1="265" y1="0" x2="265" y2="540" stroke="rgba(255,255,255,0.06)" strokeWidth="1" fill="none" />
      <line x1="400" y1="0" x2="400" y2="540" stroke="rgba(255,255,255,0.06)" strokeWidth="1" fill="none" />
      <line x1="520" y1="0" x2="520" y2="540" stroke="rgba(255,255,255,0.06)" strokeWidth="1" fill="none" />
      <line x1="630" y1="0" x2="630" y2="540" stroke="rgba(255,255,255,0.06)" strokeWidth="1" fill="none" />
      <line x1="740" y1="0" x2="740" y2="540" stroke="rgba(255,255,255,0.06)" strokeWidth="1" fill="none" />
      {/* Labels avenidas */}
      <text x="380" y="210" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.3)" fontFamily="DM Sans,sans-serif">Av. Apoquindo / Av. Las Condes</text>
      <text x="380" y="390" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.3)" fontFamily="DM Sans,sans-serif">Av. Providencia / Av. Libertador</text>
      <text x="197" y="130" textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.25)" fontFamily="DM Sans,sans-serif" transform="rotate(-90,197,130)">Av. Tobalaba</text>
      <text x="457" y="130" textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.25)" fontFamily="DM Sans,sans-serif" transform="rotate(-90,457,130)">Av. Kennedy</text>
      {/* Marcadores Sucursales */}
      {suc.map((s, i) => (
        <g
          key={`s-${i}`}
          className="suc-marker-suc cursor-pointer transition-transform duration-200"
          transform={`translate(${s.x},${s.y})`}
          onClick={() => onSelectSuc(i)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onSelectSuc(i)}
          aria-label={`${s.name}, sucursal S${i + 1}`}
        >
          <circle r="14" fill="rgba(36,88,245,0.15)" className="suc-m-ring" style={{ animationDelay: `${i * 0.15}s` }} />
          <circle r="9" fill="#2458F5" stroke="#00C2FF" strokeWidth="1.5" />
          <text y="4" textAnchor="middle" fontSize="9" fill="white" fontFamily="DM Mono,monospace" fontWeight="500">S{i + 1}</text>
        </g>
      ))}
      {/* Marcadores Tótems */}
      {tot.map((t, i) => (
        <g
          key={`t-${i}`}
          className="suc-marker-tot cursor-pointer transition-transform duration-200"
          transform={`translate(${t.x},${t.y})`}
          onClick={() => onSelectTot(i)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onSelectTot(i)}
          aria-label={`${t.name}, tótem T${i + 1}`}
        >
          <circle r="10" fill="rgba(0,229,160,0.12)" className="suc-m-ring" style={{ animationDelay: `${0.2 + i * 0.1}s` }} />
          <circle r="7" fill="#00E5A0" opacity="0.9" />
          <text y="3" textAnchor="middle" fontSize="7" fill="#08122B" fontFamily="DM Mono,monospace" fontWeight="500">T{i + 1}</text>
        </g>
      ))}
      {/* Leyenda comunas */}
      <text x="540" y="190" fontSize="9" fill="rgba(255,255,255,0.18)" fontFamily="DM Sans,sans-serif">LAS CONDES</text>
      <text x="300" y="420" fontSize="9" fill="rgba(255,255,255,0.18)" fontFamily="DM Sans,sans-serif">PROVIDENCIA</text>
      <text x="240" y="380" fontSize="9" fill="rgba(255,255,255,0.18)" fontFamily="DM Sans,sans-serif">RECOLETA</text>
      <text x="60" y="420" fontSize="9" fill="rgba(255,255,255,0.18)" fontFamily="DM Sans,sans-serif">SANTIAGO CENTRO</text>
      <text x="620" y="75" fontSize="9" fill="rgba(255,255,255,0.18)" fontFamily="DM Sans,sans-serif">LO BARNECHEA</text>
      <text x="390" y="470" fontSize="9" fill="rgba(255,255,255,0.18)" fontFamily="DM Sans,sans-serif">ÑUÑOA</text>
    </svg>
  );
}
