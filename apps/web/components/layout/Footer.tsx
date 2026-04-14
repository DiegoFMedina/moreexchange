// PATH: apps/web/components/layout/Footer.tsx
// DESC: Footer con fondo azul marca (#243a85) — estilo premium, grid de links

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
    <footer className="bg-[#243a85] border-t border-[#2d4a9e] pt-10 sm:pt-14 pb-0 px-4 sm:px-6 md:px-10 font-sans text-white overflow-x-hidden">
      <div className="max-w-6xl mx-auto min-w-0">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-8 md:gap-10 pb-10 sm:pb-12 border-b border-white/10">
          <div className="md:col-span-2 min-w-0">
            <div className="font-display font-extrabold text-[18px] sm:text-[20px] tracking-wider text-white mb-3.5">
              MORE<span className="text-[#00AEEF]">EXCHANGE</span>
            </div>
            <p className="text-[12px] sm:text-[13px] text-white/70 leading-relaxed max-w-[260px] mb-4">
              Plataforma profesional de cambio de divisas y remesas internacionales. Rápido, seguro
              y transparente.
            </p>
            <div className="inline-flex items-start gap-2 bg-white/[0.08] border border-white/[0.15] text-white/80 py-1.5 px-3 rounded-md text-[10px] sm:text-[11px] leading-snug max-w-full">
              <svg
                className="w-3 h-3 flex-shrink-0 mt-0.5 stroke-[#00AEEF]"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M6 1L1 3.5v3c0 2.8 2 4.8 5 5.5 3-.7 5-2.7 5-5.5v-3L6 1z" />
              </svg>
              <span>
                Empresa registrada en Chile · RUT: 00.000.000-0
                <br />
                Operación autorizada bajo normativa del Banco Central de Chile
              </span>
            </div>
          </div>

          <div className="min-w-0">
            <h5 className="text-[10px] sm:text-[11px] tracking-[0.12em] uppercase text-white/50 mb-4 font-medium">
              Producto
            </h5>
            <ul className="space-y-3 list-none p-0 m-0">
              {PRODUCTO_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[12px] sm:text-[13px] text-white/70 no-underline hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0">
            <h5 className="text-[10px] sm:text-[11px] tracking-[0.12em] uppercase text-white/50 mb-4 font-medium">
              Sucursales
            </h5>
            <ul className="space-y-3 list-none p-0 m-0">
              {SUCURSALES_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[12px] sm:text-[13px] text-white/70 no-underline hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0">
            <h5 className="text-[10px] sm:text-[11px] tracking-[0.12em] uppercase text-white/50 mb-4 font-medium">
              Legal
            </h5>
            <ul className="space-y-3 list-none p-0 m-0">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[12px] sm:text-[13px] text-white/70 no-underline hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-5 text-center sm:text-left">
          <p className="text-[11px] sm:text-[12px] text-white/50">
            © {new Date().getFullYear()} More Exchange. Todos los derechos reservados.
          </p>
          <div className="flex flex-wrap justify-center sm:justify-end gap-3 sm:gap-4">
            <a
              href="https://twitter.com/more_exchange"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] text-white/50 no-underline hover:text-[#00AEEF] transition-colors"
            >
              Twitter
            </a>
            <a
              href="https://instagram.com/more_exchange"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] text-white/50 no-underline hover:text-[#00AEEF] transition-colors"
            >
              Instagram
            </a>
            <a
              href="https://facebook.com/more_exchange"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] text-white/50 no-underline hover:text-[#00AEEF] transition-colors"
            >
              Facebook
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
