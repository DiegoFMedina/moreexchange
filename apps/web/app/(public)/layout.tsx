// PATH: apps/web/app/(public)/layout.tsx
// DESC: Layout del grupo de rutas públicas — no requiere autenticación

import { FloatingButtons } from '@/components/layout/FloatingButtons';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <FloatingButtons />
    </>
  );
}
