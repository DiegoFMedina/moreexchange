// PATH: apps/web/components/layout/Footer.tsx
// DESC: Footer moreexchange_mid_footer — logo texto, grid 2fr 1fr 1fr 1fr, reg-badge, Producto, Sucursales, Legal

import Link from 'next/link';

const PRODUCTO_LINKS = [
  { label: 'Tasas', href: '/rates' },
  { label: 'Cómo funciona', href: '#how-it-works' },
  { label: 'Calculadora', href: '#calculator' },
  { label: 'Remesas', href: '/exchange' },
  { label: 'App More Giros', href: '/app' },
];

const SUCURSALES_LINKS = [
  { label: 'San Sebastián', href: '/sucursales#san-sebastian' },
  { label: 'El Bosque Norte', href: '/sucursales#el-bosque' },
  { label: 'Providencia', href: '/sucursales#providencia' },
  { label: 'Parque Arauco', href: '/sucursales#parque-arauco' },
  { label: 'Ver todas →', href: '/sucursales' },
];

const LEGAL_LINKS = [
  { label: 'Términos de servicio', href: '/terms' },
  { label: 'Política de privacidad', href: '/privacy' },
  { label: 'Contacto', href: '/contact' },
];

export function Footer() {
  return (
    <footer className="bg-[#0F1E45] border-t border-white/[0.06] pt-14 pb-0 px-6 md:px-10 font-sans text-white">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-10 pb-12 border-b border-white/[0.06]">
          <div className="md:col-span-2">
            <div className="font-display font-extrabold text-[20px] tracking-wider text-white mb-3.5">
              MORE<span className="text-[#00C2FF]">EXCHANGE</span>
            </div>
            <p className="text-[13px] text-white/60 leading-relaxed max-w-[220px] mb-4">
              Plataforma profesional de cambio de divisas y remesas internacionales. Rápido, seguro y transparente.
            </p>
            <div className="inline-flex items-start gap-2 bg-[rgba(0,194,255,0.07)] border border-[rgba(0,194,255,0.25)] text-white/70 py-1.5 px-3 rounded-md text-[11px] leading-snug">
              <svg className="w-3 h-3 flex-shrink-0 mt-0.5 stroke-[#00C2FF]" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 1L1 3.5v3c0 2.8 2 4.8 5 5.5 3-.7 5-2.7 5-5.5v-3L6 1z" />
              </svg>
              <span>
                Empresa registrada en Chile · RUT: 00.000.000-0<br />
                Operación autorizada bajo normativa del Banco Central de Chile
              </span>
            </div>
          </div>

          <div>
            <h5 className="text-[11px] tracking-[0.12em] uppercase text-white/60 mb-4 font-medium">
              Producto
            </h5>
            <ul className="space-y-3 list-none p-0 m-0">
              {PRODUCTO_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[13px] text-white/70 no-underline hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="text-[11px] tracking-[0.12em] uppercase text-white/60 mb-4 font-medium">
              Sucursales
            </h5>
            <ul className="space-y-3 list-none p-0 m-0">
              {SUCURSALES_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[13px] text-white/70 no-underline hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="text-[11px] tracking-[0.12em] uppercase text-white/60 mb-4 font-medium">
              Legal
            </h5>
            <ul className="space-y-3 list-none p-0 m-0">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[13px] text-white/70 no-underline hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-5">
          <p className="text-[12px] text-white/60">
            © {new Date().getFullYear()} More Exchange. Todos los derechos reservados.
          </p>
          <div className="flex gap-4">
            <a href="https://twitter.com/more_exchange" target="_blank" rel="noopener noreferrer" className="text-[12px] text-white/60 no-underline hover:text-[#00C2FF] transition-colors">
              Twitter
            </a>
            <a href="https://instagram.com/more_exchange" target="_blank" rel="noopener noreferrer" className="text-[12px] text-white/60 no-underline hover:text-[#00C2FF] transition-colors">
              Instagram
            </a>
            <a href="https://facebook.com/more_exchange" target="_blank" rel="noopener noreferrer" className="text-[12px] text-white/60 no-underline hover:text-[#00C2FF] transition-colors">
              Facebook
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
