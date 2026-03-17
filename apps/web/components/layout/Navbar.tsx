// PATH: apps/web/components/layout/Navbar.tsx
// DESC: Navbar transparente sobre hero, con blur al hacer scroll, logo More Exchange y CTA; muestra sesión si está logueado

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

const NAV_LINKS = [
  { label: 'Tasas', href: '/rates' },
  { label: 'Cómo funciona', href: '/#how-it-works' },
  { label: 'Calculadora', href: '/#calculator' },
  { label: 'Sucursales', href: '/#sucursales' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { currentUser, logout } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'backdrop-blur-[12px] bg-[#06080f]/80 border-b border-[#1c2240]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group shrink-0 min-w-0">
          <div className="w-8 h-8 relative">
            <Image
              src="/toro.png"
              alt="More Exchange"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="font-display font-bold text-[15px] text-text-primary hidden sm:block tracking-tight">
            More Exchange
          </span>
        </Link>

        {/* Links */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[14px] font-sans text-text-secondary hover:text-text-primary transition-colors duration-150"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA — espacio a la derecha en móvil para no pegar al borde */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {currentUser ? (
            <>
              <button
                type="button"
                onClick={() => logout.mutate()}
                className="text-[14px] font-sans text-text-secondary hover:text-text-primary transition-colors hidden md:block disabled:opacity-50"
                disabled={logout.isPending}
              >
                Cerrar sesión
              </button>
              <Link
                href={currentUser.role === 'ADMIN' ? '/admin' : '/exchange'}
                className="py-2 px-3 sm:px-4 text-[12px] sm:text-[13px] font-sans font-medium border border-accent text-accent rounded-md hover:bg-accent hover:text-background transition-all duration-150 whitespace-nowrap"
              >
                {currentUser.role === 'ADMIN' ? 'Panel admin' : 'Cambiar ahora'}
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-[14px] font-sans text-text-secondary hover:text-text-primary transition-colors hidden md:block"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/exchange"
                className="py-2 px-3 sm:px-4 text-[12px] sm:text-[13px] font-sans font-medium border border-accent text-accent rounded-md hover:bg-accent hover:text-background transition-all duration-150 whitespace-nowrap"
              >
                Cambiar ahora
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.header>
  );
}
