// PATH: apps/web/app/layout.tsx
// DESC: Layout raíz de Next.js 14 — carga fuentes Syne y DM Sans, configura React Query y metadatos globales

import type { Metadata, Viewport } from 'next';
import { Syne, DM_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/layout/Providers';

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['300', '400', '500', '600'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'More Exchange — Cambio de divisas al mejor precio',
    template: '%s | More Exchange',
  },
  description:
    'Plataforma profesional de cambio de divisas. Tasas competitivas en USD, EUR, GBP, CLP, BRL y más. Rápido, seguro y sin comisiones ocultas.',
  keywords: ['cambio de divisas', 'casa de cambio', 'dólar', 'euro', 'Chile', 'More Exchange'],
  authors: [{ name: 'More Exchange' }],
  creator: 'More Exchange',
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    url: 'https://moreexchange.cl',
    siteName: 'More Exchange',
    title: 'More Exchange — Cambio de divisas al mejor precio',
    description: 'Tasas competitivas, proceso en minutos, 100% seguro.',
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@more_exchange',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#06080f',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${syne.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <body className="min-h-screen min-w-0 max-w-[100vw] bg-background text-text-primary antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
