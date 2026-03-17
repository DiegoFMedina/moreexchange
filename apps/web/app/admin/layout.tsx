// PATH: apps/web/app/admin/layout.tsx
// DESC: Layout del panel admin — sidebar fijo con protección de ruta por rol ADMIN

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getCurrentUser, isAdmin } from '@/lib/auth';

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="2" width="5" height="5" rx="1" />
        <rect x="9" y="2" width="5" height="5" rx="1" />
        <rect x="2" y="9" width="5" height="5" rx="1" />
        <rect x="9" y="9" width="5" height="5" rx="1" />
      </svg>
    ),
  },
  {
    label: 'Tasas',
    href: '/admin/rates',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 12l4-4 3 3 5-7" />
      </svg>
    ),
  },
  {
    label: 'Transacciones',
    href: '/admin/transactions',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M2 8h12M10 4l4 4-4 4" />
      </svg>
    ),
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAdmin()) {
      router.replace('/login');
    }
  }, [mounted, router]);

  const user = getCurrentUser();
  if (!mounted || !user || user.role !== 'ADMIN') return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col fixed inset-y-0 left-0 z-40">
        {/* Logo — enlace a página principal */}
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-gray-200">
          <Link href="/" className="flex items-center gap-2.5 w-full min-w-0">
            <div className="w-6 h-6 relative flex-shrink-0">
              <Image src="/logo.svg" alt="More Exchange" fill className="object-contain" />
            </div>
            <span className="font-display font-bold text-[13px] text-gray-900 truncate">More Exchange</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-sans transition-colors ${
                  active
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className={active ? 'text-blue-600' : 'text-gray-400'}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Volver a la página principal */}
        <div className="px-2 py-2 border-t border-gray-200">
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-sans text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 12L6 8l4-4" />
            </svg>
            Volver a la página principal
          </Link>
        </div>

        {/* User info */}
        <div className="p-4 border-t border-gray-200">
          <p className="text-[11px] text-gray-500 font-sans truncate">{user.email}</p>
          <p className="text-[10px] text-blue-600 font-sans uppercase tracking-widest mt-0.5">
            Administrador
          </p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-56 min-h-screen">
        {children}
      </main>
    </div>
  );
}
