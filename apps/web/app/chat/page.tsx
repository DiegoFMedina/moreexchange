// PATH: apps/web/app/chat/page.tsx
// DESC: Chat de soporte público — el cliente llega desde el QR del tótem, ingresa su nombre y conversa con el admin

'use client';

import { Suspense } from 'react';
import ChatClientPage from './ChatClientPage';

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatLoadingSkeleton />}>
      <ChatClientPage />
    </Suspense>
  );
}

function ChatLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
    </div>
  );
}
