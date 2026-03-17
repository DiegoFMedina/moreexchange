// PATH: apps/web/app/(public)/sucursales/layout.tsx
// DESC: Layout y metadatos para la página de sucursales

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sucursales y tótems',
  description: '8 sucursales y 10 tótems 24/7. Santiago, Valparaíso e Iquique. Horarios, direcciones y mapa.',
};

export default function SucursalesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
