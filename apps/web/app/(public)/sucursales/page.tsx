// PATH: apps/web/app/(public)/sucursales/page.tsx
// DESC: Página sucursales y tótems — listado + mapa interactivo según moreexchange_sucursales_page.html

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { SUC_MAP, TOT_MAP, type SucursalMap, type TotemMap } from '@/lib/sucursales-page-data';
import { SucursalesMapSvg } from '@/components/sucursales/SucursalesMapSvg';

type Filter = 'all' | 'suc' | 'tot' | '24h';

export default function SucursalesPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState<'suc' | 'tot' | null>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const selectLoc = (type: 'suc' | 'tot', idx: number) => {
    setActiveType(type);
    setActiveIdx(idx);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setActiveType(null);
    setActiveIdx(null);
    setDetailOpen(false);
  };

  const filteredSuc = useMemo(() => {
    if (filter === 'tot' || filter === '24h') return [];
    const q = search.toLowerCase();
    return q ? SUC_MAP.filter((d) => d.name.toLowerCase().includes(q) || d.addr.toLowerCase().includes(q)) : SUC_MAP;
  }, [filter, search]);

  const filteredTot = useMemo(() => {
    if (filter === 'suc') return [];
    const q = search.toLowerCase();
    let list = q ? TOT_MAP.filter((d) => d.name.toLowerCase().includes(q) || d.addr.toLowerCase().includes(q)) : TOT_MAP;
    if (filter === '24h') list = list.filter((d) => d.is24);
    return list;
  }, [filter, search]);

  const selectedSuc = activeType === 'suc' && activeIdx !== null ? SUC_MAP[activeIdx] : null;
  const selectedTot = activeType === 'tot' && activeIdx !== null ? TOT_MAP[activeIdx] : null;
  const detailItem = selectedSuc ?? selectedTot;
  const detailIsSuc = !!selectedSuc;

  return (
    <div className="min-h-screen bg-[#08122B] font-sans text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 lg:px-9 py-4 border-b border-white/[0.07] bg-[#08122B]">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-white/45 text-[13px] hover:text-white transition-colors"
          >
            <svg viewBox="0 0 16 16" className="w-4 h-4 shrink-0" stroke="currentColor" fill="none" strokeWidth="2">
              <path d="M10 12L6 8l4-4" />
            </svg>
            Volver
          </Link>
          <span className="font-display text-[18px] font-extrabold tracking-wider">
            MORE<span className="text-[#00C2FF]">EXCHANGE</span>
          </span>
        </div>
        <Link
          href="/exchange"
          className="bg-[#2458F5] text-white py-2 px-5 rounded-md text-[13px] font-medium hover:bg-[#1A3FBF] transition-colors"
        >
          Cambiar ahora
        </Link>
      </nav>

      {/* Page header */}
      <div className="border-b border-white/[0.07] px-6 lg:px-9 py-8 pb-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-[rgba(0,194,255,0.1)] border border-[rgba(0,194,255,0.25)] text-[#00C2FF] text-[10px] tracking-[0.14em] uppercase py-1 px-3 rounded-full mb-3 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00C2FF] animate-pulse-dot" />
              Red de atención
            </div>
            <h1 className="font-display text-[32px] font-extrabold tracking-tight">
              Sucursales <span className="text-[#00C2FF]">&</span> Tótems
            </h1>
          </div>
          <div className="flex gap-4 flex-shrink-0">
            <div className="text-center py-3 px-5 bg-[#0F1E45] rounded-[10px] border border-white/[0.07]">
              <div className="font-mono text-[22px] font-medium text-white">8</div>
              <div className="text-[11px] text-white/45 mt-0.5">Sucursales</div>
            </div>
            <div className="text-center py-3 px-5 bg-[#0F1E45] rounded-[10px] border border-white/[0.07]">
              <div className="font-mono text-[22px] font-medium text-white"><span className="text-[#00C2FF]">10</span></div>
              <div className="text-[11px] text-white/45 mt-0.5">Tótems 24/7</div>
            </div>
            <div className="text-center py-3 px-5 bg-[#0F1E45] rounded-[10px] border border-white/[0.07]">
              <div className="font-mono text-[22px] font-medium text-white">3</div>
              <div className="text-[11px] text-white/45 mt-0.5">Ciudades</div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <svg
              viewBox="0 0 16 16"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 stroke-white/45 fill-none stroke-[1.5]"
            >
              <circle cx="7" cy="7" r="5" />
              <path d="M11 11l3 3" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o comuna..."
              className="w-full bg-[#0F1E45] border border-white/10 text-white py-2.5 pl-10 pr-4 rounded-lg text-[13px] placeholder:text-white/45 focus:outline-none focus:border-[rgba(0,194,255,0.25)]"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {(['all', 'suc', 'tot', '24h'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`flex items-center gap-1.5 py-2 px-4 rounded-full border text-[12px] font-sans transition-all ${
                  filter === f
                    ? 'bg-[rgba(36,88,245,0.15)] border-[#2458F5] text-white'
                    : 'border-white/[0.07] bg-transparent text-white/45 hover:border-white/20 hover:text-white'
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{
                    background: f === 'all' ? 'white' : f === 'suc' ? '#00C2FF' : f === 'tot' ? '#00E5A0' : '#FFB800',
                  }}
                />
                {f === 'all' ? 'Todos' : f === 'suc' ? 'Sucursales' : f === 'tot' ? 'Tótems' : '24 horas'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main: list + map */}
      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] min-h-[520px] lg:h-[calc(100vh-200px)]">
        {/* List panel */}
        <div className="suc-list-panel bg-[#0F1E45] border-r border-white/[0.07] overflow-y-auto">
          {(filter === 'all' || filter === 'suc') && filteredSuc.length > 0 && (
            <>
              <div className="sticky top-0 z-10 flex items-center gap-2 py-3.5 px-5 text-[10px] tracking-widest uppercase text-white/45 font-medium border-b border-white/[0.07] bg-[#0F1E45]">
                <span className="w-2 h-2 rounded-full bg-[#00C2FF]" />
                Sucursales con atención · {filteredSuc.length}
              </div>
              {filteredSuc.map((d, i) => {
                const idx = SUC_MAP.indexOf(d);
                const isActive = activeType === 'suc' && activeIdx === idx;
                return (
                  <div
                    key={d.name}
                    role="button"
                    tabIndex={0}
                    onClick={() => selectLoc('suc', idx)}
                    onKeyDown={(e) => e.key === 'Enter' && selectLoc('suc', idx)}
                    className={`flex gap-4 px-5 py-4 border-b border-white/[0.07] cursor-pointer transition-colors hover:bg-[#162254] ${
                      isActive ? 'bg-[rgba(36,88,245,0.12)] border-l-2 border-l-[#2458F5]' : ''
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full flex items-center justify-center font-mono text-[11px] font-medium shrink-0 mt-0.5 bg-[rgba(36,88,245,0.2)] text-[#00C2FF] border border-[rgba(36,88,245,0.4)]">
                      S{idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[14px] font-medium text-white mb-0.5">{d.name}</div>
                      <div className="text-[11px] text-white/45 mb-1.5 leading-snug">{d.addr}</div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1 text-[11px] text-white/45">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00E5A0] shrink-0" />
                          {d.hours.split('·')[0].trim()}
                        </div>
                        {d.totem && (
                          <span className="bg-[rgba(0,229,160,0.1)] text-[#00E5A0] border border-[rgba(0,229,160,0.25)] px-2 py-0.5 rounded-lg text-[10px] font-medium">
                            Tótem 24/7
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
          {(filter === 'all' || filter === 'tot' || filter === '24h') && filteredTot.length > 0 && (
            <>
              <div className="sticky top-0 z-10 flex items-center gap-2 py-3.5 px-5 text-[10px] tracking-widest uppercase text-white/45 font-medium border-b border-white/[0.07] bg-[#0F1E45]">
                <span className="w-2 h-2 rounded-full bg-[#00E5A0]" />
                Tótems autoservicio · {filteredTot.length}
              </div>
              {filteredTot.map((d, i) => {
                const idx = TOT_MAP.indexOf(d);
                const isActive = activeType === 'tot' && activeIdx === idx;
                return (
                  <div
                    key={d.name}
                    role="button"
                    tabIndex={0}
                    onClick={() => selectLoc('tot', idx)}
                    onKeyDown={(e) => e.key === 'Enter' && selectLoc('tot', idx)}
                    className={`flex gap-4 px-5 py-4 border-b border-white/[0.07] cursor-pointer transition-colors hover:bg-[#162254] ${
                      isActive ? 'bg-[rgba(36,88,245,0.12)] border-l-2 border-l-[#2458F5]' : ''
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full flex items-center justify-center font-mono text-[11px] font-medium shrink-0 mt-0.5 bg-[rgba(0,229,160,0.12)] text-[#00E5A0] border border-[rgba(0,229,160,0.3)]">
                      T{idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[14px] font-medium text-white mb-0.5">{d.name}</div>
                      <div className="text-[11px] text-white/45 mb-1.5 leading-snug">{d.addr}</div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1 text-[11px] text-white/45">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00E5A0] shrink-0" />
                          {d.hours.split('·')[0].trim()}
                        </div>
                        {d.is24 && (
                          <span className="bg-[rgba(0,229,160,0.1)] text-[#00E5A0] border border-[rgba(0,229,160,0.25)] px-2 py-0.5 rounded-lg text-[10px] font-medium">
                            24/7
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Map panel */}
        <div className="relative bg-[#08122B] overflow-hidden min-h-[400px] lg:min-h-0">
          <div className="absolute inset-0">
            <SucursalesMapSvg
              suc={SUC_MAP}
              tot={TOT_MAP}
              onSelectSuc={(i) => selectLoc('suc', i)}
              onSelectTot={(i) => selectLoc('tot', i)}
            />
          </div>

          {/* Popup (muestra al tener selección) */}
          {detailItem && (
            <div
              className="absolute top-4 left-4 z-10 bg-[#0F1E45] border border-white/15 rounded-xl p-4 min-w-[220px] max-w-[280px] shadow-xl pointer-events-none"
              style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
            >
              <div className="text-[10px] tracking-wider uppercase text-[#00C2FF] font-medium mb-1">
                {detailIsSuc ? 'Sucursal' : 'Tótem autoservicio'}
              </div>
              <div className="text-[14px] font-medium text-white mb-1">{detailItem.name}</div>
              <div className="text-[11px] text-white/45 mb-2.5 leading-snug">{detailItem.addr}</div>
              <div className="flex items-center gap-1.5 text-[11px] text-white/45 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00E5A0] shrink-0" />
                {detailItem.hours.split('·')[0].trim()}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDetailOpen(true);
                }}
                className="w-full bg-[#2458F5] text-white py-2 rounded-md text-[12px] font-medium pointer-events-auto hover:bg-[#1A3FBF] transition-colors"
              >
                Ver detalle completo →
              </button>
            </div>
          )}

          {/* Leyenda */}
          <div className="absolute bottom-5 left-5 z-10 bg-[#08122B]/90 border border-white/[0.07] rounded-[10px] py-3 px-4">
            <div className="flex items-center gap-2 text-[11px] text-white/45 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2458F5] border-2 border-[#00C2FF] shrink-0" />
              Sucursal con atención
            </div>
            <div className="flex items-center gap-2 text-[11px] text-white/45">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00E5A0] opacity-80 shrink-0" />
              Tótem autoservicio
            </div>
          </div>

          {/* Detail bar (slide up) */}
          <div
            className={`suc-detail-bar absolute bottom-0 left-0 right-0 z-20 bg-[#0F1E45] border-t border-white/10 p-4 ${detailOpen && detailItem ? 'open' : ''}`}
          >
            {detailItem && (
              <div className="flex flex-wrap items-center gap-4">
                <div className="w-16 h-12 rounded-md bg-[#162254] overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={detailItem.img} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-[#00C2FF] uppercase tracking-wider mb-0.5">
                    {detailIsSuc ? 'Sucursal' : 'Tótem autoservicio'}
                  </div>
                  <div className="text-[15px] font-medium text-white mb-0.5">{detailItem.name}</div>
                  <div className="text-[12px] text-white/45">
                    {detailItem.addr} · {detailItem.hours.split('·')[0].trim()}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={detailItem.map}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#2458F5] text-white py-2.5 px-4 rounded-md text-[12px] font-medium hover:bg-[#1A3FBF] transition-colors whitespace-nowrap"
                  >
                    Ver en mapa →
                  </a>
                  {detailIsSuc && selectedSuc?.phone ? (
                    <a
                      href={`tel:${selectedSuc.phone}`}
                      className="py-2.5 px-4 rounded-md border border-white/20 text-white text-[12px] hover:bg-white/5 transition-colors whitespace-nowrap"
                    >
                      Llamar
                    </a>
                  ) : (
                    <span className="py-2.5 px-4 rounded-md border border-white/20 text-white/70 text-[12px] whitespace-nowrap">
                      Ver horario
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={closeDetail}
                    className="text-white/45 hover:text-white text-xl px-1 py-0"
                    aria-label="Cerrar"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
