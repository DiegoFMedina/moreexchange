// PATH: apps/web/app/admin/chat/page.tsx
// DESC: Panel de soporte para administrador — lista de sesiones por tótem, conversación en tiempo real, gestión de tótems y validación de transacciones

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { QRCodeSVG } from 'qrcode.react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/v1', '') ?? 'http://localhost:3001';
const WEB_BASE = process.env.NEXT_PUBLIC_WEB_URL ?? 'http://localhost:3000';

// ─── Tipos ──────────────────────────────────────────────────────────────────

interface Totem {
  id: string;
  name: string;
  location: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  _count: { sessions: number };
  sessions: { id: string }[];
}

interface Attachment {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
}

interface Message {
  id: string;
  content: string;
  sender: 'CLIENT' | 'ADMIN';
  createdAt: string;
  attachments: Attachment[];
}

interface ChatSession {
  id: string;
  token: string;
  clientName: string;
  clientPhone?: string;
  status: 'OPEN' | 'RESOLVED' | 'CLOSED';
  startedAt: string;
  closedAt?: string;
  totem: { id: string; name: string; location: string };
  messages: Message[];
  _count: { messages: number };
}

interface Transaction {
  id: string;
  fromCurrencyId: string;
  toCurrencyId: string;
  fromAmount: string;
  toAmount: string;
  status: string;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string };
}

type Tab = 'chats' | 'totems';

const STATUS_META = {
  OPEN: {
    label: 'Abierta',
    dot: 'bg-emerald-400 animate-pulse',
    badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  },
  RESOLVED: {
    label: 'Resuelta',
    dot: 'bg-amber-400',
    badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  },
  CLOSED: {
    label: 'Cerrada',
    dot: 'bg-gray-500',
    badge: 'bg-gray-500/10 text-gray-400 border border-gray-500/20',
  },
};

// ─── Componente principal ────────────────────────────────────────────────────

export default function AdminChatPage() {
  const [tab, setTab] = useState<Tab>('chats');
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [totemFilter, setTotemFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [showTxPanel, setShowTxPanel] = useState(false);

  const queryClient = useQueryClient();

  // ─── Datos ────────────────────────────────────────────────────────────────

  const { data: totems = [] } = useQuery<Totem[]>({
    queryKey: ['admin', 'chat', 'totems'],
    queryFn: async () => {
      const { data } = await api.get('/admin/chat/totems');
      return data.data;
    },
    refetchInterval: 15000,
  });

  const { data: sessionsData } = useQuery({
    queryKey: ['admin', 'chat', 'sessions', statusFilter, totemFilter, searchFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50' });
      if (statusFilter) params.set('status', statusFilter);
      if (totemFilter) params.set('totemId', totemFilter);
      if (searchFilter) params.set('search', searchFilter);
      const { data } = await api.get(`/admin/chat/sessions?${params}`);
      return data;
    },
    refetchInterval: 4000,
  });

  const sessions: ChatSession[] = sessionsData?.data ?? [];

  // Stats
  const { data: stats } = useQuery({
    queryKey: ['admin', 'chat', 'stats'],
    queryFn: async () => {
      const { data } = await api.get('/admin/chat/stats');
      return data.data as {
        totalSessions: number;
        openSessions: number;
        resolvedSessions: number;
        totalMessages: number;
      };
    },
    refetchInterval: 10000,
  });

  // ─── Polling de mensajes de la sesión activa ───────────────────────────────

  const [messages, setMessages] = useState<Message[]>([]);
  const lastMsgTime = useRef<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!selectedSession) return;

    // Cargar mensajes iniciales
    api.get(`/admin/chat/sessions/${selectedSession.id}`).then(({ data }) => {
      const sess = data.data as ChatSession;
      setMessages(sess.messages);
      lastMsgTime.current = sess.messages.at(-1)?.createdAt ?? sess.startedAt;
    });

    pollingRef.current = setInterval(async () => {
      try {
        const url = lastMsgTime.current
          ? `/admin/chat/sessions/${selectedSession.id}/messages?since=${encodeURIComponent(lastMsgTime.current)}`
          : `/admin/chat/sessions/${selectedSession.id}/messages`;

        const { data } = await api.get(url);
        const fresh: Message[] = data.data;
        if (fresh.length > 0) {
          setMessages((prev) => {
            const ids = new Set(prev.map((m) => m.id));
            const newOnes = fresh.filter((m) => !ids.has(m.id));
            if (newOnes.length === 0) return prev;
            lastMsgTime.current = newOnes.at(-1)!.createdAt;
            return [...prev, ...newOnes];
          });
        }
      } catch {
        // silent
      }
    }, 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [selectedSession]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // ─── Input y envío ─────────────────────────────────────────────────────────

  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [adminFiles, setAdminFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSession || (!input.trim() && adminFiles.length === 0) || isSending) return;

    setIsSending(true);
    try {
      const form = new FormData();
      form.append('content', input.trim() || '📎 Adjunto');
      adminFiles.forEach((f) => form.append('attachments', f));

      const { data } = await api.post(`/admin/chat/sessions/${selectedSession.id}/messages`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setMessages((prev) => {
        const ids = new Set(prev.map((m) => m.id));
        if (ids.has(data.data.id)) return prev;
        return [...prev, data.data as Message];
      });
      lastMsgTime.current = (data.data as Message).createdAt;
      setInput('');
      setAdminFiles([]);
    } catch {
      // silent
    } finally {
      setIsSending(false);
    }
  }

  async function handleStatusChange(sessionId: string, status: string) {
    await api.patch(`/admin/chat/sessions/${sessionId}/status`, { status });
    setSelectedSession((prev) =>
      prev ? { ...prev, status: status as ChatSession['status'] } : prev,
    );
    queryClient.invalidateQueries({ queryKey: ['admin', 'chat', 'sessions'] });
  }

  function handleSelectSession(sess: ChatSession) {
    setMessages([]);
    lastMsgTime.current = null;
    setSelectedSession(sess);
    setShowTxPanel(false);
  }

  return (
    <div className="h-screen flex flex-col bg-[#f8fafc] overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="font-display font-bold text-[20px] text-gray-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Chat de Soporte
          </h1>
          <p className="text-[12px] text-gray-500 font-sans mt-0.5">
            {stats?.openSessions ?? 0} conversaciones activas · {stats?.totalSessions ?? 0} total
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab('chats')}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${tab === 'chats' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Conversaciones
          </button>
          <button
            onClick={() => setTab('totems')}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${tab === 'totems' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Tótems & QR
          </button>
        </div>
      </div>

      {/* Contenido */}
      {tab === 'totems' ? (
        <TotemsManager
          totems={totems}
          onRefresh={() => queryClient.invalidateQueries({ queryKey: ['admin', 'chat', 'totems'] })}
        />
      ) : (
        <div className="flex flex-1 min-h-0">
          {/* Panel izquierdo — Lista de sesiones */}
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
            {/* Filtros */}
            <div className="p-3 border-b border-gray-100 space-y-2">
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full text-[12px] border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-gray-50 focus:outline-none focus:border-blue-400 focus:bg-white"
              />
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex-1 text-[11px] border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 bg-gray-50 focus:outline-none focus:border-blue-400"
                >
                  <option value="">Todos los estados</option>
                  <option value="OPEN">Abiertas</option>
                  <option value="RESOLVED">Resueltas</option>
                  <option value="CLOSED">Cerradas</option>
                </select>
                <select
                  value={totemFilter}
                  onChange={(e) => setTotemFilter(e.target.value)}
                  className="flex-1 text-[11px] border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 bg-gray-50 focus:outline-none focus:border-blue-400"
                >
                  <option value="">Todos los tótems</option>
                  {totems.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto">
              {sessions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <svg
                      className="w-6 h-6 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                      />
                    </svg>
                  </div>
                  <p className="text-[12px] text-gray-500">No hay conversaciones</p>
                </div>
              )}

              {sessions.map((sess) => {
                const meta = STATUS_META[sess.status];
                const lastMsg = sess.messages[0];
                const isSelected = selectedSession?.id === sess.id;

                return (
                  <button
                    key={sess.id}
                    onClick={() => handleSelectSession(sess)}
                    className={`w-full text-left px-3 py-3 border-b border-gray-50 transition-colors ${
                      isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className={`w-2 h-2 rounded-full mt-1 ${meta.dot}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-[13px] font-semibold text-gray-900 truncate">
                            {sess.clientName}
                          </p>
                          <p className="text-[10px] text-gray-400 flex-shrink-0">
                            {new Date(sess.startedAt).toLocaleTimeString('es-CL', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <p className="text-[11px] text-blue-600 font-medium truncate">
                          {sess.totem.name}
                        </p>
                        {lastMsg && (
                          <p className="text-[11px] text-gray-500 truncate mt-0.5">
                            {lastMsg.sender === 'ADMIN' ? '↩ ' : ''}
                            {lastMsg.content}
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${meta.badge}`}
                          >
                            {meta.label}
                          </span>
                          <span className="text-[9px] text-gray-400">
                            {sess._count.messages} msgs
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Panel central — Conversación */}
          {selectedSession ? (
            <div className="flex-1 flex flex-col min-w-0">
              {/* Header de conversación */}
              <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-[14px]">
                      {selectedSession.clientName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-gray-900">
                      {selectedSession.clientName}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-[11px] text-gray-500">
                        {selectedSession.totem.name} · {selectedSession.totem.location}
                      </p>
                      {selectedSession.clientPhone && (
                        <p className="text-[11px] text-gray-400">· {selectedSession.clientPhone}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowTxPanel(!showTxPanel)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                      showTxPanel ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M3 6h18m-9 8h9"
                      />
                    </svg>
                    Transacciones
                  </button>

                  {selectedSession.status !== 'CLOSED' && (
                    <select
                      value={selectedSession.status}
                      onChange={(e) => handleStatusChange(selectedSession.id, e.target.value)}
                      className="text-[11px] border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 bg-white focus:outline-none focus:border-blue-400"
                    >
                      <option value="OPEN">Abierta</option>
                      <option value="RESOLVED">Resuelta</option>
                      <option value="CLOSED">Cerrar sesión</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50/50">
                <div className="flex justify-center mb-4">
                  <span className="bg-gray-200/70 text-gray-500 text-[10px] px-3 py-1 rounded-full">
                    {new Date(selectedSession.startedAt).toLocaleString('es-CL', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                    {' · '}Tótem: {selectedSession.totem.name}
                  </span>
                </div>

                {messages.map((msg) => (
                  <AdminMessageBubble key={msg.id} msg={msg} apiBase={API_BASE} />
                ))}

                {selectedSession.status === 'CLOSED' && (
                  <div className="flex justify-center">
                    <span className="bg-red-100 text-red-500 text-[10px] px-3 py-1 rounded-full">
                      Sesión cerrada
                    </span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input de respuesta */}
              {selectedSession.status !== 'CLOSED' && (
                <div className="bg-white border-t border-gray-200 p-3">
                  {adminFiles.length > 0 && (
                    <div className="flex gap-2 mb-2 flex-wrap">
                      {adminFiles.map((f, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-2.5 py-1.5"
                        >
                          <svg
                            className="w-3.5 h-3.5 text-blue-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                            />
                          </svg>
                          <span className="text-[11px] text-gray-700 max-w-[100px] truncate">
                            {f.name}
                          </span>
                          <button
                            onClick={() => setAdminFiles((p) => p.filter((_, j) => j !== i))}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18 18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <form onSubmit={handleSend} className="flex items-end gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 text-gray-400 hover:text-blue-500 transition-colors rounded-lg hover:bg-gray-100 flex-shrink-0"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 002.112 2.13"
                        />
                      </svg>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.mp4,.mov"
                      onChange={(e) => {
                        setAdminFiles((p) =>
                          [...p, ...Array.from(e.target.files ?? [])].slice(0, 5),
                        );
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend(e as unknown as React.FormEvent);
                        }
                      }}
                      placeholder="Responder al cliente..."
                      rows={1}
                      className="flex-1 text-[13px] border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 resize-none max-h-28 overflow-y-auto"
                    />
                    <button
                      type="submit"
                      disabled={isSending || (!input.trim() && adminFiles.length === 0)}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl transition-colors text-[12px] font-medium flex-shrink-0"
                    >
                      {isSending ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin block" />
                      ) : (
                        'Enviar'
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/50">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                  />
                </svg>
              </div>
              <p className="text-[14px] font-medium text-gray-700">Selecciona una conversación</p>
              <p className="text-[12px] text-gray-400 mt-1">
                Elige un chat de la lista para comenzar
              </p>
            </div>
          )}

          {/* Panel derecho — Transacciones */}
          {showTxPanel && selectedSession && (
            <TransactionsPanel session={selectedSession} onClose={() => setShowTxPanel(false)} />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Burbuja de mensaje (admin) ──────────────────────────────────────────────

function AdminMessageBubble({ msg, apiBase }: { msg: Message; apiBase: string }) {
  const isAdmin = msg.sender === 'ADMIN';

  return (
    <div className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] rounded-2xl px-3.5 py-2.5 ${
          isAdmin
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm shadow-sm'
        }`}
      >
        {!isAdmin && (
          <p className="text-[9px] font-bold tracking-widest uppercase text-blue-500 mb-1">
            Cliente
          </p>
        )}

        <p
          className={`text-[13px] leading-relaxed whitespace-pre-wrap ${isAdmin ? 'text-white' : 'text-gray-800'}`}
        >
          {msg.content}
        </p>

        {msg.attachments.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {msg.attachments.map((att) => (
              <AdminAttachmentPreview key={att.id} att={att} apiBase={apiBase} isAdmin={isAdmin} />
            ))}
          </div>
        )}

        <p className={`text-[10px] mt-1 ${isAdmin ? 'text-white/50' : 'text-gray-400'}`}>
          {new Date(msg.createdAt).toLocaleTimeString('es-CL', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}

function AdminAttachmentPreview({
  att,
  apiBase,
  isAdmin,
}: {
  att: Attachment;
  apiBase: string;
  isAdmin: boolean;
}) {
  const url = att.url.startsWith('http') ? att.url : `${apiBase}${att.url}`;
  const isImage = att.mimeType.startsWith('image/');
  const isVideo = att.mimeType.startsWith('video/');

  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={att.filename}
          className="max-w-[180px] max-h-[180px] rounded-lg object-cover"
        />
      </a>
    );
  }

  if (isVideo) {
    return <video src={url} controls className="max-w-[200px] rounded-lg" />;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] ${
        isAdmin
          ? 'bg-white/10 hover:bg-white/20 text-white'
          : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
      }`}
    >
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 002.112 2.13"
        />
      </svg>
      <span className="truncate max-w-[140px]">{att.filename}</span>
      <span className="opacity-60">{(att.size / 1024).toFixed(0)}KB</span>
    </a>
  );
}

// ─── Panel de Transacciones ──────────────────────────────────────────────────

function TransactionsPanel({ session, onClose }: { session: ChatSession; onClose: () => void }) {
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(session.startedAt);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [statusTx, setStatusTx] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'tx-panel', fromDate, toDate, statusTx],
    queryFn: async () => {
      const p = new URLSearchParams({ page: '1', limit: '20' });
      if (fromDate) p.set('fromDate', fromDate);
      if (toDate) p.set('toDate', toDate);
      if (statusTx) p.set('status', statusTx);
      const { data } = await api.get(`/admin/transactions?${p}`);
      return data.data as Transaction[];
    },
  });

  const TX_STATUS: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'Pendiente', color: 'text-yellow-600 bg-yellow-50' },
    PROCESSING: { label: 'Procesando', color: 'text-blue-600 bg-blue-50' },
    COMPLETED: { label: 'Completada', color: 'text-green-600 bg-green-50' },
    FAILED: { label: 'Fallida', color: 'text-red-600 bg-red-50' },
    REFUNDED: { label: 'Reembolso', color: 'text-gray-600 bg-gray-100' },
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col flex-shrink-0">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-[13px] font-semibold text-gray-900">Validar Transacciones</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Busca operaciones del día del fallo</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Filtros */}
      <div className="p-3 border-b border-gray-100 space-y-2">
        <div className="flex gap-1.5 items-center">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="flex-1 text-[11px] border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:border-blue-400"
          />
          <span className="text-gray-400 text-[11px]">→</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="flex-1 text-[11px] border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:border-blue-400"
          />
        </div>
        <select
          value={statusTx}
          onChange={(e) => setStatusTx(e.target.value)}
          className="w-full text-[11px] border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:border-blue-400"
        >
          <option value="">Todos los estados</option>
          {Object.entries(TX_STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && (!data || data.length === 0) && (
          <div className="py-8 text-center">
            <p className="text-[12px] text-gray-400">Sin transacciones en el período</p>
          </div>
        )}

        {data?.map((tx) => {
          const s = TX_STATUS[tx.status] ?? {
            label: tx.status,
            color: 'text-gray-600 bg-gray-100',
          };
          return (
            <div
              key={tx.id}
              className="px-3 py-2.5 border-b border-gray-50 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-gray-900 truncate">
                    {tx.user.firstName} {tx.user.lastName}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate">{tx.user.email}</p>
                  <p className="text-[11px] text-gray-700 mt-0.5 tabular-nums">
                    {tx.fromCurrencyId} → {tx.toCurrencyId} ·{' '}
                    <span className="font-medium">
                      {Number(tx.fromAmount).toLocaleString('es-CL')}
                    </span>
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${s.color}`}>
                    {s.label}
                  </span>
                  <p className="text-[9px] text-gray-400 mt-1">
                    {new Date(tx.createdAt).toLocaleString('es-CL', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
              </div>
              <p className="text-[9px] text-gray-400 font-mono mt-0.5">{tx.id.slice(0, 16)}...</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Gestor de Tótems ────────────────────────────────────────────────────────

function TotemsManager({ totems, onRefresh }: { totems: Totem[]; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [selectedTotem, setSelectedTotem] = useState<Totem | null>(null);
  const [form, setForm] = useState({ name: '', location: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQR, setShowQR] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (selectedTotem) {
        await api.patch(`/admin/chat/totems/${selectedTotem.id}`, form);
      } else {
        await api.post('/admin/chat/totems', form);
      }
      onRefresh();
      setShowForm(false);
      setSelectedTotem(null);
      setForm({ name: '', location: '', description: '' });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggle(id: string, isActive: boolean) {
    await api.patch(`/admin/chat/totems/${id}`, { isActive: !isActive });
    onRefresh();
  }

  function openEdit(t: Totem) {
    setSelectedTotem(t);
    setForm({ name: t.name, location: t.location, description: t.description ?? '' });
    setShowForm(true);
  }

  const qrUrl = showQR ? `${WEB_BASE}/chat?totemId=${showQR}` : '';

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-sans font-bold text-[16px] text-gray-900">Gestión de Tótems</h2>
          <p className="text-[12px] text-gray-500 mt-0.5">
            Crea y gestiona los tótems. Descarga el QR para imprimirlo y pegarlo en cada uno.
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedTotem(null);
            setForm({ name: '', location: '', description: '' });
            setShowForm(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[12px] font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Nuevo Tótem
        </button>
      </div>

      {/* Modal QR */}
      {showQR && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowQR(null)}
        >
          <div
            className="bg-white rounded-2xl p-8 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-5">
              <p className="font-bold text-gray-900 text-lg">
                {totems.find((t) => t.id === showQR)?.name}
              </p>
              <p className="text-gray-500 text-sm mt-1">
                {totems.find((t) => t.id === showQR)?.location}
              </p>
            </div>
            <div className="flex justify-center mb-5 p-4 bg-white border-2 border-gray-100 rounded-xl">
              <QRCodeSVG
                value={qrUrl}
                size={200}
                level="H"
                includeMargin
                imageSettings={{
                  src: '/logo.svg',
                  x: undefined,
                  y: undefined,
                  height: 36,
                  width: 36,
                  excavate: true,
                }}
              />
            </div>
            <p className="text-center text-gray-400 text-[10px] font-mono break-all mb-5">
              {qrUrl}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowQR(null)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-[13px] font-medium hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  const svg = document.querySelector('#qr-print svg') as SVGElement;
                  if (!svg) {
                    window.print();
                    return;
                  }
                  window.print();
                }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[13px] font-medium transition-colors"
              >
                Imprimir / Descargar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
          <h3 className="font-semibold text-[14px] text-gray-900 mb-4">
            {selectedTotem ? 'Editar Tótem' : 'Nuevo Tótem'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-gray-500 mb-1.5 uppercase tracking-wide font-medium">
                  Nombre *
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Tótem Sucursal Centro"
                  className="w-full text-[13px] border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-500 mb-1.5 uppercase tracking-wide font-medium">
                  Ubicación *
                </label>
                <input
                  required
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Av. Providencia 1234"
                  className="w-full text-[13px] border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 mb-1.5 uppercase tracking-wide font-medium">
                Descripción
              </label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Información adicional del tótem..."
                className="w-full text-[13px] border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setSelectedTotem(null);
                }}
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-[12px] hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[12px] font-medium disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Guardando...' : selectedTotem ? 'Guardar cambios' : 'Crear Tótem'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid de tótems */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {totems.map((t) => (
          <div
            key={t.id}
            className={`bg-white border rounded-xl p-4 shadow-sm transition-all ${t.isActive ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${t.isActive ? 'bg-blue-50' : 'bg-gray-100'}`}
                >
                  <svg
                    className={`w-5 h-5 ${t.isActive ? 'text-blue-600' : 'text-gray-400'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0H3"
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-gray-900 truncate">{t.name}</p>
                  <p className="text-[11px] text-gray-500 truncate">{t.location}</p>
                </div>
              </div>
              <span
                className={`text-[9px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${t.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}
              >
                {t.isActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            {t.description && (
              <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">{t.description}</p>
            )}

            <div className="flex items-center gap-3 mb-3 py-2 border-t border-gray-50">
              <div className="text-center">
                <p className="text-[16px] font-bold text-gray-900">{t._count.sessions}</p>
                <p className="text-[9px] text-gray-400 uppercase tracking-wide">Sesiones</p>
              </div>
              <div className="w-px h-6 bg-gray-100" />
              <div className="text-center">
                <p className="text-[16px] font-bold text-emerald-600">{t.sessions.length}</p>
                <p className="text-[9px] text-gray-400 uppercase tracking-wide">Activas</p>
              </div>
            </div>

            <div className="flex gap-1.5">
              <button
                onClick={() => setShowQR(t.id)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-[11px] text-gray-700 font-medium transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z"
                  />
                </svg>
                Ver QR
              </button>
              <button
                onClick={() => openEdit(t)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-[11px] text-gray-700 font-medium transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
                  />
                </svg>
                Editar
              </button>
              <button
                onClick={() => handleToggle(t.id, t.isActive)}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 border rounded-lg text-[11px] font-medium transition-colors ${
                  t.isActive
                    ? 'bg-red-50 hover:bg-red-100 border-red-200 text-red-600'
                    : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-600'
                }`}
              >
                {t.isActive ? 'Pausar' : 'Activar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {totems.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0H3"
              />
            </svg>
          </div>
          <p className="text-[14px] font-medium text-gray-700">No hay tótems creados</p>
          <p className="text-[12px] text-gray-400 mt-1">
            Crea el primero para generar su QR de soporte
          </p>
        </div>
      )}
    </div>
  );
}
