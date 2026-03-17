// PATH: apps/web/app/(public)/exchange/page.tsx
// DESC: Página de flujo de compra/venta de divisas con formulario completo

import type { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ExchangeForm } from '@/components/exchange/ExchangeForm';

export const metadata: Metadata = {
  title: 'Cambiar divisas',
  description: 'Realiza tu cambio de divisas en minutos. Pago con tarjeta o transferencia.',
};

export default function ExchangePage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-6">
          <div className="mb-8">
            <h1 className="font-display font-bold text-[clamp(28px,4vw,42px)] text-text-primary mb-2">
              Nuevo cambio
            </h1>
            <p className="text-[14px] text-text-secondary font-sans">
              Completa los datos para iniciar tu operación.
            </p>
          </div>

          <div className="border border-[#1c2240] rounded-lg bg-[#0c0f1a] p-8">
            <ExchangeForm />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
