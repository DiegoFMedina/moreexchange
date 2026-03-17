// PATH: apps/web/app/(public)/rates/page.tsx
// DESC: Página de tasas en vivo — reemplaza la antigua; mismo contenido que la sección de la landing

import type { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { LiveRatesSection } from '@/components/landing/LiveRatesSection';

export const metadata: Metadata = {
  title: 'Tasas de cambio en tiempo real',
  description: 'Consulta las tasas de cambio actualizadas cada 30 segundos. USD, EUR, GBP, CLP, BRL, ARS.',
};

export default function RatesPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#08122B]">
        <LiveRatesSection />
      </main>
      <Footer />
    </>
  );
}
