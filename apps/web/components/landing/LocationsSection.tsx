// PATH: apps/web/components/landing/LocationsSection.tsx
// DESC: Módulo "Red de atención" — sucursales y tótems 24/7, basado en moreexchange_sucursales_estrategia.html

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

type Sucursal = {
  name: string;
  addr: string;
  hours: string;
  contact: string;
  map: string;
  phone?: string;
  img: string;
  tag: 'santiago' | 'valpo' | 'norte';
  totem: boolean;
  open: boolean;
};

type Totem = {
  name: string;
  addr: string;
  hours: string;
  contact: string;
  map: string;
  img: string;
  tag: 'mall' | '24h' | 'aeropuerto';
  is24: boolean;
};

const SUC: Sucursal[] = [
  {
    name: 'Casa Central San Sebastián',
    addr: 'San Sebastián 2814, Las Condes',
    hours: 'Lun–Vie 8:30–18:00 · Sáb 9:00–14:00 · Dom cerrado',
    contact: '+569 8894 6178\nsansebastian@moreexchange.cl',
    map: 'https://goo.gl/maps/UQvXSJofkH9oLMiZ6',
    phone: '+56988946178',
    img: 'https://www.moreexchange.cl/wp-content/uploads/2023/06/sansebastian-1.jpg',
    tag: 'santiago',
    totem: true,
    open: true,
  },
  {
    name: 'El Bosque Norte',
    addr: 'El Bosque Norte 091, Las Condes',
    hours: 'Lun–Vie 8:30–17:30 · Sáb 9:30–16:00 · Dom cerrado',
    contact: '+569 8894 6019\nelbosque@moreexchange.cl',
    map: 'https://goo.gl/maps/frXGSmYGPWMBGNN6A',
    phone: '+56988946019',
    img: 'https://www.moreexchange.cl/wp-content/uploads/2023/06/elbosque.jpg',
    tag: 'santiago',
    totem: false,
    open: true,
  },
  {
    name: 'Providencia · Suecia',
    addr: 'Suecia 13 – Local 5, Providencia',
    hours: 'Lun–Vie 9:00–18:00 · Sáb 10:00–17:00 · Dom cerrado',
    contact: '+569 7299 7623\nsuecia@moreexchange.cl',
    map: 'https://goo.gl/maps/u4BCj18ANKVCEWW79',
    phone: '+56972997623',
    img: 'https://www.moreexchange.cl/wp-content/uploads/2023/06/suecia.jpg',
    tag: 'santiago',
    totem: true,
    open: true,
  },
  {
    name: 'Patronato',
    addr: 'Asunción 402, Recoleta',
    hours: 'Lun–Vie 9:30–18:00 · Sáb 10:00–16:00 · Dom cerrado',
    contact: '+569 6906 0570\npatronato@moreexchange.cl',
    map: 'https://goo.gl/maps/eLEyXiiSbxgydBWj6',
    phone: '+56969060570',
    img: 'https://www.moreexchange.cl/wp-content/uploads/2023/06/patronato.jpg',
    tag: 'santiago',
    totem: false,
    open: true,
  },
  {
    name: 'Mall Parque Arauco',
    addr: 'Av. Pdte. Kennedy 5413, Las Condes · Piso 1 Servicios',
    hours: 'Lun–Sáb 10:00–20:00 · Dom 11:00–20:00',
    contact: '+569 8894 9233\nparquearauco@moreexchange.cl',
    map: 'https://maps.app.goo.gl/Bnyx6LZP1LqxSwvu7',
    phone: '+56988949233',
    img: 'https://www.moreexchange.cl/wp-content/uploads/2023/10/PQARAUCOBRANDEADO.jpg',
    tag: 'santiago',
    totem: false,
    open: true,
  },
  {
    name: 'Viña del Mar',
    addr: 'San Martín 458 – Local 12, Edificio Maya',
    hours: 'Lun–Vie 9:00–18:00 · Sáb 10:00–18:00',
    contact: '+569 8894 8387\nvinadelmar@moreexchange.cl',
    map: 'https://goo.gl/maps/V7DVWKhrS4tYp89Z9',
    phone: '+56988948387',
    img: 'https://www.moreexchange.cl/wp-content/uploads/2023/06/vina.jpg',
    tag: 'valpo',
    totem: false,
    open: true,
  },
  {
    name: 'Valparaíso',
    addr: 'Cochrane 844, Valparaíso',
    hours: 'Lun–Vie 9:00–18:00 · Sáb 10:00–14:00 · Dom cerrado',
    contact: '+569 8894 9208\nvalparaiso@moreexchange.cl',
    map: 'https://goo.gl/maps/jKXjKoUsP5sPYgMC6',
    phone: '+56988949208',
    img: 'https://www.moreexchange.cl/wp-content/uploads/2023/06/valpo.jpg',
    tag: 'valpo',
    totem: false,
    open: true,
  },
  {
    name: 'Iquique',
    addr: 'Patricio Lynch 513 – Local 2, Iquique',
    hours: 'Lun–Vie 8:30–17:30 · Sáb 9:00–14:00 · Dom cerrado',
    contact: '+56 57 226 2706\niquique@moreexchange.cl',
    map: 'https://goo.gl/maps/TR5DXbe36FFS6XwM6',
    phone: '+56572262706',
    img: 'https://www.moreexchange.cl/wp-content/uploads/2023/06/iquique.jpg',
    tag: 'norte',
    totem: false,
    open: true,
  },
];

const TOT: Totem[] = [
  {
    name: 'Costanera Center',
    addr: 'Av. Andrés Bello 2425, Providencia · 1er y 2do piso, frente a H&M',
    hours: 'Lun–Dom 10:00–21:00',
    contact: 'operaciones@moreexchange.cl',
    map: 'https://goo.gl/maps/dapK24pFjPEhVX2g6',
    img: 'https://www.moreexchange.cl/wp-content/uploads/2023/06/costanera2.jpg',
    tag: 'mall',
    is24: false,
  },
  {
    name: 'Alto Las Condes',
    addr: 'Av. Pdte. Kennedy Lateral · Frente a Privilege, 1er piso',
    hours: 'Según horario de Mall',
    contact: '+569 4431 8520',
    map: 'https://goo.gl/maps/qTrJa1NaX5jmiuer5',
    img: 'https://www.moreexchange.cl/wp-content/uploads/2023/06/alto.jpg',
    tag: 'mall',
    is24: false,
  },
  {
    name: 'Portal La Dehesa',
    addr: 'Av. La Dehesa 1445, Lo Barnechea · Salida del Easy',
    hours: 'Lun–Sáb 8:00–21:00 · Dom 9:00–21:00',
    contact: 'operaciones@moreexchange.cl',
    map: 'https://goo.gl/maps/FYcHwM7zDgN9L4aW7',
    img: 'https://www.moreexchange.cl/wp-content/uploads/2023/06/ladehesa.jpg',
    tag: 'mall',
    is24: false,
  },
  {
    name: 'Parque Arauco',
    addr: 'Av. Pdte. Kennedy 5413, Las Condes · Salida Paris, 1er piso',
    hours: 'Según horario de Mall',
    contact: 'sucursalvirtual@moreexchange.cl',
    map: 'https://maps.app.goo.gl/Bnyx6LZP1LqxSwvu7',
    img: 'https://www.moreexchange.cl/wp-content/uploads/2023/06/parquearauco.jpg',
    tag: 'mall',
    is24: false,
  },
  {
    name: 'Portal Ñuñoa',
    addr: 'Av. José Pedro Alessandri 1166 · Piso 2, frente a servicio al cliente',
    hours: 'Según horario de Mall',
    contact: 'sucursalvirtual@moreexchange.cl',
    map: 'https://maps.app.goo.gl/Z4Shv5KxTcjgv6oq6',
    img: 'https://www.moreexchange.cl/wp-content/uploads/2023/11/nunoa.jpg',
    tag: 'mall',
    is24: false,
  },
  {
    name: 'Suecia 24/7',
    addr: 'Suecia 13 – Local 5, Providencia',
    hours: '24 horas · 7 días',
    contact: 'sucursalvirtual@moreexchange.cl',
    map: 'https://maps.app.goo.gl/1NkLrobZ1jraNfKd9',
    img: 'https://www.moreexchange.cl/wp-content/uploads/2025/11/suecia.jpg',
    tag: '24h',
    is24: true,
  },
  {
    name: 'Patio Bellavista',
    addr: 'Constitución 50, Providencia · Al costado de Tony Pizzería',
    hours: 'Dom–Mar 10:00–01:00 · Mié 10:00–02:00 · Jue–Sáb 10:00–03:00',
    contact: 'sucursalvirtual@moreexchange.cl',
    map: 'https://maps.app.goo.gl/Bnyx6LZP1LqxSwvu7',
    img: 'https://www.moreexchange.cl/wp-content/uploads/2025/11/patio-bellavista.jpg',
    tag: 'mall',
    is24: false,
  },
  {
    name: 'Plaza Egaña',
    addr: 'Frente a Tottus · Salida del Metro al interior del Mall',
    hours: 'Según horario de Mall',
    contact: 'sucursalvirtual@moreexchange.cl',
    map: 'https://maps.app.goo.gl/4dmzz9Xw5xxNwt5CA',
    img: 'https://www.moreexchange.cl/wp-content/uploads/2025/03/egana-1.jpg',
    tag: 'mall',
    is24: false,
  },
  {
    name: 'Marina Arauco · Viña del Mar',
    addr: '14 Nte. 821, Av. Libertad 1348 · Patio de Comidas',
    hours: 'Según horario de Mall',
    contact: 'sucursalvirtual@moreexchange.cl',
    map: 'https://maps.app.goo.gl/kJeyjSoCguAT1LvYA',
    img: 'https://www.moreexchange.cl/wp-content/uploads/2025/08/marina-arauco.jpg',
    tag: 'mall',
    is24: false,
  },
  {
    name: 'Aeropuerto Diego Aracena · Iquique',
    addr: 'Aeropuerto Internacional, Iquique · Tarapacá',
    hours: '24 horas · 7 días',
    contact: 'sucursalvirtual@moreexchange.cl',
    map: 'https://maps.app.goo.gl/Z4Shv5KxTcjgv6oq6',
    img: 'https://www.moreexchange.cl/wp-content/uploads/2024/03/iquique.jpg',
    tag: 'aeropuerto',
    is24: true,
  },
];

type TabKind = 'suc' | 'tot';
type SucFilter = 'all' | 'santiago' | 'valpo' | 'norte';
type TotFilter = 'all' | 'mall' | '24h' | 'aeropuerto';

const viewportReveal = { once: true, amount: 0.12 };
const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: viewportReveal,
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
};

export function LocationsSection() {
  const [tab, setTab] = useState<TabKind>('suc');
  const [sucFilter, setSucFilter] = useState<SucFilter>('all');
  const [totFilter, setTotFilter] = useState<TotFilter>('all');
  const [modalItem, setModalItem] = useState<Sucursal | Totem | null>(null);
  const [modalType, setModalType] = useState<TabKind | null>(null);

  const filteredSuc = useMemo(() => {
    if (sucFilter === 'all') return SUC;
    return SUC.filter((s) => s.tag === sucFilter);
  }, [sucFilter]);

  const filteredTot = useMemo(() => {
    if (totFilter === 'all') return TOT;
    if (totFilter === '24h') return TOT.filter((t) => t.is24);
    return TOT.filter((t) => t.tag === totFilter);
  }, [totFilter]);

  const list = tab === 'suc' ? filteredSuc : filteredTot;
  const openModal = (item: Sucursal | Totem, kind: TabKind) => {
    setModalItem(item);
    setModalType(kind);
  };

  const closeModal = () => {
    setModalItem(null);
    setModalType(null);
  };

  const isOpen = (item: Sucursal | Totem) => {
    if ('open' in item) return item.open;
    if ('is24' in item) return item.is24;
    return true;
  };

  const hoursFirst = (hours: string) => hours.split('·')[0].trim();

  return (
    <section id="sucursales" className="py-[72px] px-6 md:px-10 bg-[#08122B] font-sans text-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center md:text-left flex flex-col items-center md:items-start">
          <motion.span
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.05 }}
            className="inline-flex items-center gap-2 bg-[rgba(0,194,255,0.1)] border border-[rgba(0,194,255,0.25)] text-[#00C2FF] text-[10px] tracking-[0.14em] uppercase py-1 px-3 rounded-full mb-4 font-medium"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#00C2FF] animate-pulse-dot" />
            Red de atención
          </motion.span>
          <motion.h2
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.15 }}
            className="font-display text-[36px] font-extrabold tracking-tight text-white mb-2"
          >
            Siempre <span className="text-[#00C2FF]">cerca de ti</span>
          </motion.h2>
          <motion.p
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.25 }}
            className="text-[14px] text-white/45 leading-relaxed max-w-[520px] mb-8"
          >
            8 sucursales con atención personalizada y 10 tótems de autoservicio disponibles las 24 horas. Santiago, Valparaíso e Iquique.
          </motion.p>
        </div>

        {/* Tabs */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.3 }}
          className="flex gap-0 bg-[#0F1E45] border border-white/[0.06] rounded-[10px] p-1 w-fit mb-9"
        >
          <button
            type="button"
            onClick={() => setTab('suc')}
            className={`flex items-center gap-2 px-7 py-2.5 rounded-lg text-[13px] font-sans transition-all ${
              tab === 'suc' ? 'bg-[#2458F5] text-white font-medium' : 'bg-transparent text-white/45 hover:text-white'
            }`}
          >
            Sucursales
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                tab === 'suc' ? 'bg-white/20 text-white' : 'bg-white/15 text-white/70'
              }`}
            >
              {SUC.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setTab('tot')}
            className={`flex items-center gap-2 px-7 py-2.5 rounded-lg text-[13px] font-sans transition-all ${
              tab === 'tot' ? 'bg-[#2458F5] text-white font-medium' : 'bg-transparent text-white/45 hover:text-white'
            }`}
          >
            Tótems 24/7
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                tab === 'tot' ? 'bg-white/20 text-white' : 'bg-white/15 text-white/70'
              }`}
            >
              {TOT.length}
            </span>
          </button>
        </motion.div>

        {/* Filters */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.35 }}
          className="flex flex-wrap gap-2 mb-7"
        >
          {tab === 'suc' && (
            <>
              {(['all', 'santiago', 'valpo', 'norte'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setSucFilter(f)}
                  className={`px-4 py-1.5 rounded-full border text-[12px] font-sans transition-all ${
                    sucFilter === f
                      ? 'bg-[#162254] border-[rgba(0,194,255,0.3)] text-white'
                      : 'border-white/[0.06] bg-transparent text-white/45 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {f === 'all' ? 'Todas' : f === 'valpo' ? 'Valparaíso' : f === 'norte' ? 'Norte' : 'Santiago'}
                </button>
              ))}
            </>
          )}
          {tab === 'tot' && (
            <>
              {(['all', 'mall', '24h', 'aeropuerto'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setTotFilter(f)}
                  className={`px-4 py-1.5 rounded-full border text-[12px] font-sans transition-all ${
                    totFilter === f
                      ? 'bg-[#162254] border-[rgba(0,194,255,0.3)] text-white'
                      : 'border-white/[0.06] bg-transparent text-white/45 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {f === 'all' ? 'Todos' : f === '24h' ? '24 horas' : f === 'mall' ? 'Malls' : 'Aeropuerto'}
                </button>
              ))}
            </>
          )}
        </motion.div>

        {/* Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          key={`${tab}-${tab === 'suc' ? sucFilter : totFilter}`}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {list.map((item) => (
            <div
              key={item.name}
              role="button"
              tabIndex={0}
              onClick={() => openModal(item, tab)}
              onKeyDown={(e) => e.key === 'Enter' && openModal(item, tab)}
              className="bg-[#0F1E45] border border-white/[0.09] rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:border-[rgba(0,194,255,0.3)] hover:-translate-y-0.5"
            >
              <div className="relative w-full h-[140px] bg-[#162254]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.img}
                  alt={item.name}
                  className="w-full h-full object-cover block"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const ph = e.currentTarget.nextElementSibling as HTMLElement;
                    if (ph) ph.style.display = 'flex';
                  }}
                />
                <div
                  className="absolute inset-0 hidden items-center justify-center text-[32px] bg-[#162254]"
                  style={{ display: 'none' }}
                >
                  {tab === 'tot' ? '🏧' : '🏢'}
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 text-[10px] tracking-wider uppercase text-[#00C2FF] font-medium mb-1.5">
                  {tab === 'suc' ? 'Sucursal' : 'Tótem autoservicio'}
                  {(tab === 'suc' && (item as Sucursal).totem) || (tab === 'tot' && (item as Totem).is24) ? (
                    <span className="bg-[rgba(0,229,160,0.1)] text-[#00E5A0] border border-[rgba(0,229,160,0.25)] px-2 py-0.5 rounded-lg text-[10px] tracking-wide">
                      24/7
                    </span>
                  ) : null}
                </div>
                <h4 className="text-[15px] font-medium text-white mb-1.5 leading-snug">{item.name}</h4>
                <p className="text-[12px] text-white/45 mb-3 leading-snug">{item.addr}</p>
                <div className="flex items-center gap-1.5 text-[11px] text-white/45 mb-4">
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      isOpen(item) ? 'bg-[#00E5A0]' : 'bg-[#FF5C5C]'
                    }`}
                  />
                  {hoursFirst(item.hours)}
                </div>
                <div className="flex gap-2 border-t border-white/[0.06] pt-3">
                  <a
                    href={item.map}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 text-center py-2 rounded-md border border-white/15 text-white/45 hover:border-white/30 hover:text-white text-[12px] transition-colors"
                  >
                    Ver mapa
                  </a>
                  {'phone' in item && item.phone ? (
                    <a
                      href={`tel:${item.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 text-center py-2 rounded-md bg-[#2458F5] text-white text-[12px] hover:bg-[#1A3FBF] transition-colors"
                    >
                      Llamar
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal(item, tab);
                      }}
                      className="flex-1 py-2 rounded-md bg-[#2458F5] text-white text-[12px] hover:bg-[#1A3FBF] transition-colors"
                    >
                      Ver detalle
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Ver todas las ubicaciones */}
        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.4 }}
          className="mt-6"
        >
          <Link
            href="/sucursales"
            className="flex items-center justify-between bg-[#0F1E45] border border-white/[0.09] rounded-xl p-5 transition-colors hover:border-[rgba(0,194,255,0.3)]"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-[rgba(0,194,255,0.1)] border border-[rgba(0,194,255,0.25)] flex items-center justify-center">
                <svg viewBox="0 0 18 18" className="w-[18px] h-[18px] stroke-[#00C2FF] fill-none stroke-[1.5]">
                  <circle cx="9" cy="9" r="7" />
                  <path d="M9 5v4l3 2" />
                </svg>
              </div>
              <div>
                <div className="text-[15px] font-medium text-white">Ver todas las ubicaciones con mapa interactivo</div>
                <div className="text-[12px] text-white/45 mt-0.5">18 puntos de atención · Horarios · Teléfonos · Cómo llegar</div>
              </div>
            </div>
            <span className="text-[#00C2FF] text-xl">›</span>
          </Link>
        </motion.div>
      </div>

      {/* Modal */}
      {modalItem && modalType && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#08122B]/90"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div
            className="bg-[#0F1E45] border border-white/10 rounded-2xl w-full max-w-[680px] max-h-[85vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center text-lg hover:bg-black/70 transition-colors"
              aria-label="Cerrar"
            >
              ×
            </button>
            <div
              className="w-full h-[200px] bg-[#162254] rounded-t-2xl bg-cover bg-center"
              style={{ backgroundImage: modalItem.img ? `url(${modalItem.img})` : undefined }}
            >
              {!modalItem.img && (
                <div className="w-full h-full flex items-center justify-center text-5xl">
                  {modalType === 'tot' ? '🏧' : '🏢'}
                </div>
              )}
            </div>
            <div className="p-7">
              <div className="text-[10px] tracking-widest uppercase text-[#00C2FF] font-medium mb-2">
                {modalType === 'suc' ? 'Sucursal' : 'Tótem autoservicio'}
              </div>
              {(modalType === 'suc' && (modalItem as Sucursal).totem) || (modalType === 'tot' && (modalItem as Totem).is24) ? (
                <div className="inline-flex items-center gap-1.5 bg-[rgba(0,229,160,0.1)] border border-[rgba(0,229,160,0.3)] text-[#00E5A0] px-3 py-1.5 rounded-full text-[11px] font-medium mb-4">
                  ⚡ Tótem autoservicio 24/7
                </div>
              ) : null}
              <h3 id="modal-title" className="font-display text-2xl font-bold text-white mb-1.5">
                {modalItem.name}
              </h3>
              <p className="text-white/45 text-[14px] mb-5">{modalItem.addr}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <div className="bg-[#162254] rounded-lg p-4">
                  <div className="text-[10px] tracking-wider uppercase text-white/45 font-medium mb-1.5">Horarios</div>
                  <div className="text-[13px] text-white leading-snug">{modalItem.hours}</div>
                </div>
                <div className="bg-[#162254] rounded-lg p-4">
                  <div className="text-[10px] tracking-wider uppercase text-white/45 font-medium mb-1.5">Contacto</div>
                  <div className="text-[13px] text-white leading-snug whitespace-pre-line">
                    {modalItem.contact.split('\n').map((line, i) => (
                      <span key={i}>
                        {line.includes('@') ? (
                          <a href={`mailto:${line}`} className="text-[#00C2FF] no-underline">
                            {line}
                          </a>
                        ) : line.match(/^\+?[\d\s]+$/) ? (
                          <a href={`tel:${line.replace(/\s/g, '')}`} className="text-[#00C2FF] no-underline">
                            {line}
                          </a>
                        ) : (
                          line
                        )}
                        {i < modalItem.contact.split('\n').length - 1 && <br />}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <a
                  href={modalItem.map}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center py-3 rounded-lg bg-[#2458F5] text-white text-[14px] font-medium hover:bg-[#1A3FBF] transition-colors"
                >
                  Ver en mapa →
                </a>
                <a
                  href={modalItem.map}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center py-3 rounded-lg border border-white/20 text-white text-[14px] hover:bg-white/5 transition-colors"
                >
                  Cómo llegar
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
