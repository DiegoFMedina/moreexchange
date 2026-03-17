// PATH: apps/web/components/layout/ScrollToHash.tsx
// DESC: En la landing, hace scroll al elemento con id igual al hash de la URL (p. ej. /#calculator)

'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

function scrollToHash(hash: string) {
  if (!hash) return;
  const el = document.getElementById(hash);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function ScrollToHash() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== '/') return;
    const hash = window.location.hash?.slice(1);
    const timer = setTimeout(() => scrollToHash(hash ?? ''), 100);

    const onHashChange = () => scrollToHash(window.location.hash?.slice(1) ?? '');
    window.addEventListener('hashchange', onHashChange);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('hashchange', onHashChange);
    };
  }, [pathname]);

  return null;
}
