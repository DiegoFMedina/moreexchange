// PATH: apps/web/app/layout.tsx
// DESC: Layout raíz — Montserrat (display, brand manual) + DM Sans (body), tema claro More Exchange

import type { Metadata, Viewport } from 'next';
import { Montserrat, DM_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/layout/Providers';

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  weight: ['300', '400', '500', '600', '700', '800'],
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
  themeColor: '#FFFFFF',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${montserrat.variable} ${dmSans.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen min-w-0 max-w-[100vw] bg-background text-text-primary antialiased">
        <div className="min-h-screen w-full min-w-0 max-w-full [overflow-x:clip]">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
