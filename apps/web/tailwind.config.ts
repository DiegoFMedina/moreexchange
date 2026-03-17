// PATH: apps/web/tailwind.config.ts
// DESC: Configuración Tailwind CSS con paleta "More Exchange — azul profundo" y tipografía Syne + DM Sans
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
        display: ['var(--font-syne)', ...fontFamily.sans],
        sans: ['var(--font-dm-sans)', ...fontFamily.sans],
        mono: ['var(--font-mono)', ...fontFamily.mono],
      },
      colors: {
        background: '#06080f',
        surface: {
          DEFAULT: '#0c0f1a',
          card: '#111629',
        },
        border: {
          DEFAULT: '#1c2240',
          emphasis: '#2a3460',
        },
        text: {
          primary: '#eef0f8',
          secondary: '#6b7499',
        },
        accent: {
          DEFAULT: '#00b4d8',
          hover: '#00d4ff',
          glow: 'rgba(0, 180, 216, 0.12)',
        },
        positive: '#00c896',
        negative: '#ff4d6a',
        'blue-mid': '#1a3a8f',
        brand: {
          DEFAULT: '#00b4d8',
          hover: '#00d4ff',
        },
      },
      borderRadius: {
        lg: '8px',
        md: '6px',
        sm: '4px',
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
          '0%': { color: '#00b4d8' },
          '100%': { color: '#eef0f8' },
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
