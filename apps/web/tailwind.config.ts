// PATH: apps/web/tailwind.config.ts
// DESC: Configuración Tailwind CSS — tema claro More Exchange con paleta del manual de marca MoreGiros 2024
import type { Config } from 'tailwindcss';
import { fontFamily } from 'tailwindcss/defaultTheme';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        display: ['var(--font-montserrat)', ...fontFamily.sans],
        sans: ['var(--font-dm-sans)', ...fontFamily.sans],
        mono: ['var(--font-mono)', ...fontFamily.mono],
      },
      colors: {
        background: '#FFFFFF',
        'background-alt': '#F5F7FE',
        surface: {
          DEFAULT: '#FFFFFF',
          card: '#FFFFFF',
          muted: '#F0F2FA',
        },
        border: {
          DEFAULT: '#E2E5F1',
          emphasis: '#C8CDE0',
        },
        text: {
          primary: '#1B2141',
          secondary: '#5C6489',
          muted: '#8B92B0',
        },
        brand: {
          DEFAULT: '#243a85',
          medium: '#4b579b',
          light: '#8c8fc0',
          pale: '#E8EAF6',
        },
        accent: {
          DEFAULT: '#00AEEF',
          hover: '#0095D0',
          glow: 'rgba(0, 174, 239, 0.10)',
        },
        cta: {
          DEFAULT: '#2458F5',
          hover: '#1A3FBF',
        },
        positive: '#059669',
        negative: '#DC2626',
        'blue-mid': '#1a3a8f',
      },
      borderRadius: {
        lg: '12px',
        md: '8px',
        sm: '4px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(36,58,133,0.06), 0 4px 16px rgba(36,58,133,0.04)',
        'card-hover': '0 4px 12px rgba(36,58,133,0.10), 0 8px 32px rgba(36,58,133,0.06)',
        nav: '0 1px 3px rgba(0,0,0,0.05)',
        widget: '0 2px 8px rgba(36,58,133,0.08), 0 8px 32px rgba(36,58,133,0.06)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'rate-flash': {
          '0%': { color: '#2458F5' },
          '100%': { color: '#1B2141' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'rate-flash': 'rate-flash 400ms ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
