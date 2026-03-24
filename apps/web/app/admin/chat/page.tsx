// PATH: apps/web/app/admin/chat/page.tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { QRCodeSVG } from 'qrcode.react';
import { resolveApiBaseUrl, resolveWebBaseUrl } from '@/lib/runtime-urls';

const API_BASE = resolveApiBaseUrl();
const WEB_BASE = resolveWebBaseUrl();

// ─── Tipos ───────────────────────────────────────────────────────────────────

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
  sender: 'CLIENT' | 'ADMIN' | 'SYSTEM';
  messageType: 'TEXT' | 'TRANSFER_FORM' | 'TRANSFER_DATA' | 'VOUCHER';
  createdAt: string;
  attachments: Attachment[];
}

interface TransferRequest {
  id: string;
  status: 'PENDING' | 'FILLED' | 'TRANSFERRED' | 'CANCELLED';
  bankName?: string;
  accountType?: string;
  accountNumber?: string;
  rut?: string;
  accountHolder?: string;
  amount?: string;
  currency?: string;
  notes?: string;
  voucherUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface RelatedSession {
  id: string;
  token: string;
  clientName: string;
  faultType?: string;
  closingNote?: string;
  startedAt: string;
  closedAt?: string;
  status: string;
}

interface ContinuedSession {
  id: string;
  token: string;
  status: string;
  startedAt: string;
  faultType?: string;
}

interface ChatSession {
  id: string;
  token: string;
  clientName: string;
  clientPhone?: string;
  status: 'OPEN' | 'PENDING' | 'RESOLVED' | 'CLOSED';
  faultType?: string;
  closingNote?: string;
  startedAt: string;
  closedAt?: string;
  totem: { id: string; name: string; location: string };
  messages: Message[];
  _count: { messages: number };
  transferRequest?: TransferRequest;
  relatedSession?: RelatedSession | null;
  continuedBy?: ContinuedSession[];
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

type Tab = 'chats' | 'totems' | 'dashboard';

const FAULT_LABELS: Record<string, string> = {
  TRANSACTION_ERROR: 'Error en transacción',
  DEVICE_FAILURE: 'Fallo de hardware',
  CONNECTIVITY_ISSUE: 'Problema de red',
  REFUND_REQUEST: 'Solicitud de devolución',
  RECEIPT_MISSING: 'Comprobante no emitido',
  RATE_DISCREPANCY: 'Diferencia tipo de cambio',
  USER_ERROR: 'Error del usuario',
  SYSTEM_ERROR: 'Error del sistema',
  OTHER: 'Otro',
};

const STATUS_META = {
  OPEN: {
    label: 'Abierta',
    dot: 'bg-emerald-400 animate-pulse',
    badge: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
  },
  PENDING: {
    label: 'Pendiente',
    dot: 'bg-amber-400 animate-pulse',
    badge: 'bg-amber-500/10 text-amber-600 border border-amber-500/20',
  },
  RESOLVED: {
    label: 'Resuelta',
    dot: 'bg-blue-400',
    badge: 'bg-blue-500/10 text-blue-600 border border-blue-500/20',
  },
  CLOSED: {
    label: 'Cerrada',
    dot: 'bg-gray-400',
    badge: 'bg-gray-100 text-gray-500 border border-gray-200',
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
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeFaultType, setCloseFaultType] = useState('');
  const [closeNote, setCloseNote] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [isSendingForm, setIsSendingForm] = useState(false);
  const [showVoucherInput, setShowVoucherInput] = useState(false);
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [isUploadingVoucher, setIsUploadingVoucher] = useState(false);
  const voucherInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

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

  const { data: stats } = useQuery({
    queryKey: ['admin', 'chat', 'stats'],
    queryFn: async () => {
      const { data } = await api.get('/admin/chat/stats');
      return data.data as {
        totalSessions: number;
        openSessions: number;
        pendingSessions: number;
        resolvedSessions: number;
        totalMessages: number;
      };
    },
    refetchInterval: 10000,
  });

  // ─── Polling de mensajes ───────────────────────────────────────────────────

  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionDetail, setSessionDetail] = useState<ChatSession | null>(null);
  const lastMsgTime = useRef<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!selectedSession) return;

    api.get(`/admin/chat/sessions/${selectedSession.id}`).then(({ data }) => {
      const sess = data.data as ChatSession;
      setSessionDetail(sess);
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

        // Refresh session detail for transferRequest changes
        const { data: sd } = await api.get(`/admin/chat/sessions/${selectedSession.id}`);
        setSessionDetail(sd.data as ChatSession);
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

  async function handleCloseTicket() {
    if (!selectedSession || !closeFaultType) return;
    setIsClosing(true);
    try {
      const { data } = await api.patch(`/admin/chat/sessions/${selectedSession.id}/status`, {
        status: 'CLOSED',
        faultType: closeFaultType,
        closingNote: closeNote || undefined,
      });
      setSelectedSession((prev) => (prev ? { ...prev, ...(data.data as ChatSession) } : prev));
      setSessionDetail(data.data as ChatSession);
      setShowCloseModal(false);
      setCloseFaultType('');
      setCloseNote('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'chat', 'sessions'] });
    } finally {
      setIsClosing(false);
    }
  }

  async function handleSetPending() {
    if (!selectedSession) return;
    try {
      await api.patch(`/admin/chat/sessions/${selectedSession.id}/status`, {
        status: 'PENDING',
      });
      setSelectedSession((prev) => (prev ? { ...prev, status: 'PENDING' } : prev));
      queryClient.invalidateQueries({ queryKey: ['admin', 'chat', 'sessions'] });
    } catch {
      // silent
    }
  }

  async function handleReopen() {
    if (!selectedSession) return;
    try {
      await api.patch(`/admin/chat/sessions/${selectedSession.id}/status`, {
        status: 'OPEN',
      });
      setSelectedSession((prev) => (prev ? { ...prev, status: 'OPEN' } : prev));
      queryClient.invalidateQueries({ queryKey: ['admin', 'chat', 'sessions'] });
    } catch {
      // silent
    }
  }

  async function handleSendTransferForm() {
    if (!selectedSession) return;
    setIsSendingForm(true);
    try {
      const { data } = await api.post(
        `/admin/chat/sessions/${selectedSession.id}/transfer-request`,
      );
      const msg = data.data?.message as Message;
      if (msg) {
        setMessages((prev) => {
          const ids = new Set(prev.map((m) => m.id));
          return ids.has(msg.id) ? prev : [...prev, msg];
        });
        lastMsgTime.current = msg.createdAt;
      }
    } catch {
      // silent
    } finally {
      setIsSendingForm(false);
    }
  }

  async function handleUploadVoucher() {
    if (!selectedSession || !voucherFile) return;
    setIsUploadingVoucher(true);
    try {
      const form = new FormData();
      form.append('voucher', voucherFile);
      const { data } = await api.post(`/admin/chat/sessions/${selectedSession.id}/voucher`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const msg = data.data?.message as Message;
      if (msg) {
        setMessages((prev) => {
          const ids = new Set(prev.map((m) => m.id));
          return ids.has(msg.id) ? prev : [...prev, msg];
        });
        lastMsgTime.current = msg.createdAt;
      }
      setVoucherFile(null);
      setShowVoucherInput(false);
    } catch {
      // silent
    } finally {
      setIsUploadingVoucher(false);
    }
  }

  function handleSelectSession(sess: ChatSession) {
    setMessages([]);
    lastMsgTime.current = null;
    setSelectedSession(sess);
    setSessionDetail(null);
    setShowTxPanel(false);
    setShowVoucherInput(false);
    setVoucherFile(null);
  }

  const currentSession = sessionDetail ?? selectedSession;
  const isClosed = currentSession?.status === 'CLOSED' || currentSession?.status === 'RESOLVED';
  const hasPendingTransfer = currentSession?.transferRequest?.status === 'FILLED';

  return (
    <div className="h-screen flex flex-col bg-[#f8fafc] overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="font-display font-bold text-[20px] text-gray-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Soporte / Tickets
          </h1>
          <p className="text-[12px] text-gray-500 font-sans mt-0.5">
            {stats?.openSessions ?? 0} abiertas · {stats?.pendingSessions ?? 0} pendientes ·{' '}
            {stats?.totalSessions ?? 0} total
          </p>
        </div>

        <div className="flex items-center gap-1">
          {(['chats', 'totems', 'dashboard'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors capitalize ${
                tab === t ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t === 'chats' ? 'Conversaciones' : t === 'totems' ? 'Tótems & QR' : 'Dashboard'}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido según tab */}
      {tab === 'totems' && (
        <TotemsManager
          totems={totems}
          onRefresh={() => queryClient.invalidateQueries({ queryKey: ['admin', 'chat', 'totems'] })}
        />
      )}

      {tab === 'dashboard' && <DashboardPanel />}

      {tab === 'chats' && (
        <div className="flex flex-1 min-h-0">
          {/* Lista de sesiones */}
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
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
                  <option value="">Todos</option>
                  <option value="OPEN">Abiertas</option>
                  <option value="PENDING">Pendientes</option>
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

            <div className="flex-1 overflow-y-auto">
              {sessions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <p className="text-[12px] text-gray-400">No hay conversaciones</p>
                </div>
              )}
              {sessions.map((sess) => {
                const meta = STATUS_META[sess.status] ?? STATUS_META.OPEN;
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
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${meta.dot}`} />
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
                            {lastMsg.sender === 'ADMIN'
                              ? '↩ '
                              : lastMsg.sender === 'SYSTEM'
                                ? '⚙ '
                                : ''}
                            {lastMsg.content}
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${meta.badge}`}
                          >
                            {meta.label}
                          </span>
                          {sess.relatedSession && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium bg-purple-100 text-purple-600">
                              🔄 reincidente
                            </span>
                          )}
                          {sess.continuedBy && sess.continuedBy.length > 0 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium bg-blue-100 text-blue-600">
                              ↪ continuado ×{sess.continuedBy.length}
                            </span>
                          )}
                          {sess.transferRequest && (
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                                sess.transferRequest.status === 'FILLED'
                                  ? 'bg-orange-100 text-orange-600'
                                  : sess.transferRequest.status === 'TRANSFERRED'
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {sess.transferRequest.status === 'FILLED'
                                ? '💸 datos recibidos'
                                : sess.transferRequest.status === 'TRANSFERRED'
                                  ? '✓ comprobante enviado'
                                  : '📋 form enviado'}
                            </span>
                          )}
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

          {/* Panel central */}
          {currentSession ? (
            <div className="flex-1 flex flex-col min-w-0">
              {/* Header conversación */}
              <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-[14px]">
                      {currentSession.clientName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-gray-900">
                      {currentSession.clientName}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate">
                      {currentSession.totem.name} · {currentSession.totem.location}
                      {currentSession.clientPhone && ` · ${currentSession.clientPhone}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                  <button
                    onClick={() => setShowTxPanel(!showTxPanel)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                      showTxPanel ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Transacciones
                  </button>

                  {!isClosed && (
                    <>
                      <button
                        onClick={handleSendTransferForm}
                        disabled={isSendingForm}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-lg text-[11px] font-medium transition-colors disabled:opacity-60"
                      >
                        💸 {isSendingForm ? 'Enviando...' : 'Formulario devolución'}
                      </button>

                      {currentSession.transferRequest?.status === 'FILLED' && (
                        <button
                          onClick={() => setShowVoucherInput(true)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg text-[11px] font-medium transition-colors"
                        >
                          📎 Subir comprobante
                        </button>
                      )}

                      {currentSession.status === 'OPEN' && (
                        <button
                          onClick={handleSetPending}
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-lg text-[11px] font-medium transition-colors"
                        >
                          Dejar pendiente
                        </button>
                      )}

                      {currentSession.status === 'PENDING' && (
                        <button
                          onClick={handleReopen}
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-lg text-[11px] font-medium transition-colors"
                        >
                          Reabrir
                        </button>
                      )}

                      <button
                        onClick={() => setShowCloseModal(true)}
                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg text-[11px] font-medium transition-colors"
                      >
                        Cerrar ticket
                      </button>
                    </>
                  )}

                  {isClosed && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                        {currentSession.faultType
                          ? (FAULT_LABELS[currentSession.faultType] ?? currentSession.faultType)
                          : 'Cerrado'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Historial de sesiones relacionadas */}
              {(currentSession?.relatedSession ||
                (currentSession?.continuedBy && currentSession.continuedBy.length > 0)) && (
                <SessionChainBanner
                  session={currentSession}
                  onSelectSession={(id) => {
                    // Buscar en la lista y seleccionar
                    const found = sessions.find((s) => s.id === id);
                    if (found) handleSelectSession(found);
                  }}
                />
              )}

              {/* Upload comprobante inline */}
              {showVoucherInput && (
                <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-3 flex items-center gap-3">
                  <p className="text-[12px] text-emerald-700 font-medium flex-shrink-0">
                    Comprobante de transferencia:
                  </p>
                  <input
                    ref={voucherInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setVoucherFile(e.target.files?.[0] ?? null)}
                    className="text-[11px] text-gray-700 flex-1"
                  />
                  <button
                    onClick={handleUploadVoucher}
                    disabled={!voucherFile || isUploadingVoucher}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-[11px] font-medium transition-colors flex-shrink-0"
                  >
                    {isUploadingVoucher ? 'Enviando...' : 'Enviar'}
                  </button>
                  <button
                    onClick={() => {
                      setShowVoucherInput(false);
                      setVoucherFile(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 text-[11px]"
                  >
                    Cancelar
                  </button>
                </div>
              )}

              {/* Datos transferencia cuando están llenos */}
              {hasPendingTransfer && currentSession.transferRequest && (
                <TransferDataCard tr={currentSession.transferRequest} />
              )}

              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50/50">
                <div className="flex justify-center mb-2">
                  <span className="bg-gray-200/70 text-gray-500 text-[10px] px-3 py-1 rounded-full">
                    {new Date(currentSession.startedAt).toLocaleString('es-CL', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                    {' · '}Tótem: {currentSession.totem.name}
                  </span>
                </div>

                {messages.map((msg) => (
                  <AdminMessageBubble key={msg.id} msg={msg} apiBase={API_BASE} />
                ))}

                {isClosed && (
                  <div className="flex justify-center">
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-center">
                      <p className="text-red-600 text-[11px] font-medium">Ticket cerrado</p>
                      {currentSession.faultType && (
                        <p className="text-red-400 text-[10px] mt-0.5">
                          Tipo: {FAULT_LABELS[currentSession.faultType] ?? currentSession.faultType}
                        </p>
                      )}
                      {currentSession.closingNote && (
                        <p className="text-gray-500 text-[10px] mt-0.5 italic">
                          &ldquo;{currentSession.closingNote}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              {!isClosed && (
                <div className="bg-white border-t border-gray-200 p-3">
                  {adminFiles.length > 0 && (
                    <div className="flex gap-2 mb-2 flex-wrap">
                      {adminFiles.map((f, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-2.5 py-1.5"
                        >
                          <span className="text-[11px] text-gray-700 max-w-[100px] truncate">
                            {f.name}
                          </span>
                          <button
                            onClick={() => setAdminFiles((p) => p.filter((_, j) => j !== i))}
                            className="text-gray-400 hover:text-red-500 text-[12px]"
                          >
                            ✕
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
                      title="Adjuntar archivo"
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
              <p className="text-[14px] font-medium text-gray-700">Selecciona una conversación</p>
              <p className="text-[12px] text-gray-400 mt-1">
                Elige un chat de la lista para comenzar
              </p>
            </div>
          )}

          {showTxPanel && currentSession && (
            <TransactionsPanel
              session={currentSession as ChatSession}
              onClose={() => setShowTxPanel(false)}
            />
          )}
        </div>
      )}

      {/* Modal cierre de ticket */}
      {showCloseModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowCloseModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-gray-900 text-[16px] mb-1">Cerrar Ticket</h3>
            <p className="text-[12px] text-gray-500 mb-4">
              Selecciona el tipo de fallo para registrarlo en el sistema.
            </p>

            <label className="block text-[11px] text-gray-700 font-semibold uppercase tracking-wide mb-1.5">
              Tipo de fallo *
            </label>
            <select
              value={closeFaultType}
              onChange={(e) => setCloseFaultType(e.target.value)}
              className="w-full text-[13px] text-gray-900 border border-gray-300 rounded-lg px-3 py-2.5 mb-4 focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="">— Selecciona el tipo —</option>
              {Object.entries(FAULT_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>

            <label className="block text-[11px] text-gray-700 font-semibold uppercase tracking-wide mb-1.5">
              Nota de cierre (opcional)
            </label>
            <textarea
              value={closeNote}
              onChange={(e) => setCloseNote(e.target.value)}
              placeholder="Descripción adicional del problema resuelto..."
              rows={3}
              className="w-full text-[13px] text-gray-900 border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:border-blue-500 resize-none placeholder:text-gray-400"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setShowCloseModal(false)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-[13px] font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCloseTicket}
                disabled={!closeFaultType || isClosing}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-[13px] font-medium transition-colors"
              >
                {isClosing ? 'Cerrando...' : 'Cerrar ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Banner cadena de tickets ─────────────────────────────────────────────────

function SessionChainBanner({
  session,
  onSelectSession,
}: {
  session: ChatSession;
  onSelectSession: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const hasRelated = !!session.relatedSession;
  const hasContinued = (session.continuedBy?.length ?? 0) > 0;

  return (
    <div className="bg-purple-50 border-b border-purple-200 px-4 py-2.5">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-purple-700">🔄 Historial vinculado</span>
          {hasRelated && (
            <span className="text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">
              viene de ticket anterior
            </span>
          )}
          {hasContinued && (
            <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
              {session.continuedBy!.length} ticket(s) posterior(es)
            </span>
          )}
        </div>
        <span className="text-gray-400 text-[11px]">{expanded ? '▲ ocultar' : '▼ ver'}</span>
      </button>

      {expanded && (
        <div className="mt-2.5 space-y-2">
          {hasRelated && session.relatedSession && (
            <div>
              <p className="text-[10px] text-purple-500 font-semibold uppercase tracking-wide mb-1">
                Ticket anterior (origen)
              </p>
              <button
                onClick={() => onSelectSession(session.relatedSession!.id)}
                className="w-full text-left bg-white border border-purple-200 rounded-lg px-3 py-2 hover:bg-purple-50 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[12px] font-medium text-gray-900">
                      {session.relatedSession.clientName}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {new Date(session.relatedSession.startedAt).toLocaleString('es-CL', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                      {session.relatedSession.faultType && (
                        <>
                          {' '}
                          ·{' '}
                          <span className="text-red-500">
                            {FAULT_LABELS[session.relatedSession.faultType] ??
                              session.relatedSession.faultType}
                          </span>
                        </>
                      )}
                    </p>
                    {session.relatedSession.closingNote && (
                      <p className="text-[10px] text-gray-400 italic mt-0.5">
                        &ldquo;{session.relatedSession.closingNote}&rdquo;
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${
                      STATUS_META[session.relatedSession.status as keyof typeof STATUS_META]
                        ?.badge ?? 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {STATUS_META[session.relatedSession.status as keyof typeof STATUS_META]
                      ?.label ?? session.relatedSession.status}
                  </span>
                </div>
              </button>
            </div>
          )}

          {hasContinued && (
            <div>
              <p className="text-[10px] text-blue-500 font-semibold uppercase tracking-wide mb-1">
                Tickets posteriores ({session.continuedBy!.length})
              </p>
              <div className="space-y-1.5">
                {session.continuedBy!.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onSelectSession(s.id)}
                    className="w-full text-left bg-white border border-blue-200 rounded-lg px-3 py-2 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] text-gray-700">
                        {new Date(s.startedAt).toLocaleString('es-CL', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                        {s.faultType && (
                          <>
                            {' '}
                            ·{' '}
                            <span className="text-red-500 text-[10px]">
                              {FAULT_LABELS[s.faultType] ?? s.faultType}
                            </span>
                          </>
                        )}
                      </p>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${
                          STATUS_META[s.status as keyof typeof STATUS_META]?.badge ??
                          'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {STATUS_META[s.status as keyof typeof STATUS_META]?.label ?? s.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Card datos de transferencia ─────────────────────────────────────────────

function TransferDataCard({ tr }: { tr: TransferRequest }) {
  return (
    <div className="bg-orange-50 border-b border-orange-200 px-4 py-3">
      <p className="text-[11px] font-bold text-orange-700 uppercase tracking-wide mb-2">
        ⚠ Datos de devolución recibidos — pendiente de transferir
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[12px]">
        {tr.accountHolder && (
          <span>
            <span className="text-gray-500">Titular:</span>{' '}
            <span className="font-medium text-gray-900">{String(tr.accountHolder)}</span>
          </span>
        )}
        {tr.rut && (
          <span>
            <span className="text-gray-500">RUT:</span>{' '}
            <span className="font-medium text-gray-900">{String(tr.rut)}</span>
          </span>
        )}
        {tr.bankName && (
          <span>
            <span className="text-gray-500">Banco:</span>{' '}
            <span className="font-medium text-gray-900">{String(tr.bankName)}</span>
          </span>
        )}
        {tr.accountType && (
          <span>
            <span className="text-gray-500">Tipo:</span>{' '}
            <span className="font-medium text-gray-900">{String(tr.accountType)}</span>
          </span>
        )}
        {tr.accountNumber && (
          <span>
            <span className="text-gray-500">N° cuenta:</span>{' '}
            <span className="font-medium text-gray-900">{String(tr.accountNumber)}</span>
          </span>
        )}
        {tr.amount != null && (
          <span>
            <span className="text-gray-500">Monto:</span>{' '}
            <span className="font-medium text-gray-900">
              {String(tr.amount)} {tr.currency ?? ''}
            </span>
          </span>
        )}
        {tr.notes && (
          <span className="col-span-2">
            <span className="text-gray-500">Notas:</span>{' '}
            <span className="font-medium text-gray-900">{String(tr.notes)}</span>
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Burbuja de mensaje (admin) ───────────────────────────────────────────────

function AdminMessageBubble({ msg, apiBase }: { msg: Message; apiBase: string }) {
  const isAdmin = msg.sender === 'ADMIN';
  const isSystem = msg.sender === 'SYSTEM';

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <span className="bg-gray-200/80 text-gray-500 text-[10px] px-3 py-1 rounded-full italic">
          {msg.content}
        </span>
      </div>
    );
  }

  if (msg.messageType === 'TRANSFER_FORM') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[70%] bg-amber-500 text-white rounded-2xl rounded-br-sm px-3.5 py-2.5">
          <p className="text-[9px] font-bold tracking-widest uppercase text-white/70 mb-1">
            Formulario enviado
          </p>
          <p className="text-[13px]">📋 {msg.content}</p>
          <p className="text-[10px] text-white/50 mt-1">
            {new Date(msg.createdAt).toLocaleTimeString('es-CL', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>
    );
  }

  if (msg.messageType === 'TRANSFER_DATA') {
    return (
      <div className="flex justify-start">
        <div className="max-w-[70%] bg-orange-50 border border-orange-200 rounded-2xl rounded-bl-sm px-3.5 py-2.5">
          <p className="text-[9px] font-bold tracking-widest uppercase text-orange-500 mb-1">
            Datos de transferencia
          </p>
          <p className="text-[13px] text-gray-800 leading-relaxed">{msg.content}</p>
          <p className="text-[10px] text-gray-400 mt-1">
            {new Date(msg.createdAt).toLocaleTimeString('es-CL', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>
    );
  }

  if (msg.messageType === 'VOUCHER') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[70%] bg-emerald-600 text-white rounded-2xl rounded-br-sm px-3.5 py-2.5">
          <p className="text-[9px] font-bold tracking-widest uppercase text-white/70 mb-1">
            Comprobante enviado
          </p>
          <p className="text-[13px]">✅ {msg.content}</p>
          {msg.attachments.map((att) => (
            <AdminAttachmentPreview key={att.id} att={att} apiBase={apiBase} isAdmin={true} />
          ))}
          <p className="text-[10px] text-white/50 mt-1">
            {new Date(msg.createdAt).toLocaleTimeString('es-CL', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>
    );
  }

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
  const normalizedPath = att.url.startsWith('/uploads/')
    ? att.url.replace('/uploads/', '/v1/uploads/')
    : att.url;
  const url = normalizedPath.startsWith('http') ? normalizedPath : `${apiBase}${normalizedPath}`;
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
      <span className="truncate max-w-[140px]">{att.filename}</span>
      <span className="opacity-60">{(att.size / 1024).toFixed(0)}KB</span>
    </a>
  );
}

// ─── Panel Transacciones ──────────────────────────────────────────────────────

function TransactionsPanel({ session, onClose }: { session: ChatSession; onClose: () => void }) {
  const [fromDate, setFromDate] = useState(() => {
    try {
      const d = new Date(session?.startedAt ?? '');
      if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
      d.setHours(0, 0, 0, 0);
      return d.toISOString().slice(0, 10);
    } catch {
      return new Date().toISOString().slice(0, 10);
    }
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
        <p className="text-[13px] font-semibold text-gray-900">Validar Transacciones</p>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
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
            <div key={tx.id} className="px-3 py-2.5 border-b border-gray-50 hover:bg-gray-50">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-gray-900 truncate">
                    {tx.user.firstName} {tx.user.lastName}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate">{tx.user.email}</p>
                  <p className="text-[11px] text-gray-700 mt-0.5 tabular-nums">
                    {tx.fromCurrencyId} → {tx.toCurrencyId} ·{' '}
                    {Number(tx.fromAmount).toLocaleString('es-CL')}
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
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

interface DashboardData {
  byFaultType: { faultType: string; count: number }[];
  byStatus: { status: string; count: number }[];
  byTotem: { totem: { id: string; name: string; location: string }; count: number }[];
  transferStats: { status: string; count: number }[];
  recentClosed: {
    id: string;
    clientName: string;
    faultType?: string;
    closingNote?: string;
    startedAt: string;
    closedAt?: string;
    totem: { name: string; location: string };
    transferRequest?: { status: string; amount?: string; currency?: string } | null;
  }[];
}

const TRANSFER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  FILLED: 'Datos recibidos',
  TRANSFERRED: 'Transferido',
  CANCELLED: 'Cancelado',
};

function DashboardPanel() {
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['admin', 'chat', 'dashboard', from, to],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (from) p.set('from', from);
      if (to) p.set('to', to);
      const { data } = await api.get(`/admin/chat/dashboard?${p}`);
      return data.data as DashboardData;
    },
    refetchInterval: 30000,
  });

  const maxFault = Math.max(1, ...(data?.byFaultType.map((r) => r.count) ?? []));
  const maxTotem = Math.max(1, ...(data?.byTotem.map((r) => r.count) ?? []));

  const statusTotal = (data?.byStatus ?? []).reduce((a, b) => a + b.count, 0) || 1;

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
      {/* Filtro fechas */}
      <div className="flex items-center gap-3 mb-6">
        <h2 className="font-bold text-[18px] text-gray-900">Dashboard de fallos</h2>
        <div className="flex items-center gap-2 ml-auto bg-white border border-gray-200 rounded-xl px-3 py-2">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="text-[12px] text-gray-700 bg-transparent focus:outline-none"
          />
          <span className="text-gray-400">→</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="text-[12px] text-gray-700 bg-transparent focus:outline-none"
          />
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* KPIs de estado */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.byStatus.map((s) => {
              const meta = STATUS_META[s.status as keyof typeof STATUS_META];
              return (
                <div key={s.status} className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-[11px] text-gray-500 uppercase tracking-wide font-medium">
                    {meta?.label ?? s.status}
                  </p>
                  <p className="text-[28px] font-bold text-gray-900 mt-1">{s.count}</p>
                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${(s.count / statusTotal) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {((s.count / statusTotal) * 100).toFixed(0)}% del total
                  </p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fallos por tipo */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-[14px] text-gray-900 mb-4">Tipos de fallo</h3>
              {data.byFaultType.length === 0 ? (
                <p className="text-[12px] text-gray-400 py-4 text-center">
                  Sin datos en el período
                </p>
              ) : (
                <div className="space-y-3">
                  {data.byFaultType.map((r) => (
                    <div key={r.faultType ?? 'null'}>
                      <div className="flex justify-between text-[12px] mb-1">
                        <span className="text-gray-700 font-medium">
                          {r.faultType
                            ? (FAULT_LABELS[r.faultType] ?? r.faultType)
                            : 'Sin clasificar'}
                        </span>
                        <span className="font-bold text-gray-900">{r.count}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full transition-all"
                          style={{ width: `${(r.count / maxFault) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tickets por tótem */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-[14px] text-gray-900 mb-4">Tickets por tótem</h3>
              {data.byTotem.length === 0 ? (
                <p className="text-[12px] text-gray-400 py-4 text-center">Sin datos</p>
              ) : (
                <div className="space-y-3">
                  {data.byTotem.map((r) => (
                    <div key={r.totem.id}>
                      <div className="flex justify-between text-[12px] mb-1">
                        <span className="text-gray-700 font-medium truncate max-w-[200px]">
                          {r.totem.name}
                          <span className="text-gray-400 font-normal ml-1">{r.totem.location}</span>
                        </span>
                        <span className="font-bold text-gray-900">{r.count}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${(r.count / maxTotem) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Transferencias */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-[14px] text-gray-900 mb-4">
                Estado de devoluciones
              </h3>
              {data.transferStats.length === 0 ? (
                <p className="text-[12px] text-gray-400 py-4 text-center">Sin solicitudes</p>
              ) : (
                <div className="space-y-2">
                  {data.transferStats.map((r) => (
                    <div
                      key={r.status}
                      className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                    >
                      <span className="text-[12px] text-gray-700">
                        {TRANSFER_STATUS_LABELS[r.status] ?? r.status}
                      </span>
                      <span className="text-[13px] font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-full">
                        {r.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tabla tickets cerrados recientes */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-[14px] text-gray-900">
                Tickets cerrados recientes
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    {[
                      'Cliente',
                      'Tótem',
                      'Tipo de fallo',
                      'Devolución',
                      'Inicio',
                      'Cierre',
                      'Nota',
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.recentClosed.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-[12px] text-gray-400">
                        Sin tickets cerrados en el período
                      </td>
                    </tr>
                  )}
                  {data.recentClosed.map((s) => (
                    <tr
                      key={s.id}
                      className="border-t border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-2.5 text-[12px] text-gray-900 font-medium">
                        {s.clientName}
                      </td>
                      <td className="px-4 py-2.5 text-[12px] text-gray-600">
                        {s.totem.name}
                        <span className="text-gray-400 ml-1 text-[10px]">{s.totem.location}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        {s.faultType ? (
                          <span className="text-[11px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                            {FAULT_LABELS[s.faultType] ?? s.faultType}
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {s.transferRequest ? (
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
                              s.transferRequest.status === 'TRANSFERRED'
                                ? 'bg-green-50 text-green-600'
                                : s.transferRequest.status === 'FILLED'
                                  ? 'bg-orange-50 text-orange-600'
                                  : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {TRANSFER_STATUS_LABELS[s.transferRequest.status] ??
                              s.transferRequest.status}
                            {s.transferRequest.amount != null &&
                              ` · ${String(s.transferRequest.amount)} ${s.transferRequest.currency ?? ''}`}
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-[11px] text-gray-500 whitespace-nowrap">
                        {new Date(s.startedAt).toLocaleString('es-CL', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="px-4 py-2.5 text-[11px] text-gray-500 whitespace-nowrap">
                        {s.closedAt
                          ? new Date(s.closedAt).toLocaleString('es-CL', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-[11px] text-gray-500 max-w-[160px] truncate">
                        {s.closingNote ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Gestor de Tótems ─────────────────────────────────────────────────────────

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
            Crea y gestiona los tótems. Descarga el QR para imprimirlo.
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
          + Nuevo Tótem
        </button>
      </div>

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
              <QRCodeSVG value={qrUrl} size={200} level="H" includeMargin />
            </div>
            <p className="text-center text-gray-400 text-[10px] font-mono break-all mb-5">
              {qrUrl}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowQR(null)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-[13px] font-medium hover:bg-gray-50"
              >
                Cerrar
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[13px] font-medium"
              >
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
          <h3 className="font-semibold text-[14px] text-gray-900 mb-4">
            {selectedTotem ? 'Editar Tótem' : 'Nuevo Tótem'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-gray-800 mb-1.5 uppercase tracking-wide font-semibold">
                  Nombre *
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Tótem Sucursal Centro"
                  className="w-full bg-white text-[13px] text-black placeholder:text-gray-500 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-800 mb-1.5 uppercase tracking-wide font-semibold">
                  Ubicación *
                </label>
                <input
                  required
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Av. Providencia 1234"
                  className="w-full bg-white text-[13px] text-black placeholder:text-gray-500 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] text-gray-800 mb-1.5 uppercase tracking-wide font-semibold">
                Descripción
              </label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Información adicional..."
                className="w-full bg-white text-[13px] text-black placeholder:text-gray-500 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setSelectedTotem(null);
                }}
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-[12px] hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[12px] font-medium disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando...' : selectedTotem ? 'Guardar cambios' : 'Crear Tótem'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {totems.map((t) => (
          <div
            key={t.id}
            className={`bg-white border rounded-xl p-4 shadow-sm transition-all ${t.isActive ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-gray-900 truncate">{t.name}</p>
                <p className="text-[11px] text-gray-500 truncate">{t.location}</p>
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
                className="flex-1 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-[11px] text-gray-700 font-medium"
              >
                Ver QR
              </button>
              <button
                onClick={() => openEdit(t)}
                className="flex-1 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-[11px] text-gray-700 font-medium"
              >
                Editar
              </button>
              <button
                onClick={() => handleToggle(t.id, t.isActive)}
                className={`flex-1 py-1.5 border rounded-lg text-[11px] font-medium ${
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
          <p className="text-[14px] font-medium text-gray-700">No hay tótems creados</p>
          <p className="text-[12px] text-gray-400 mt-1">Crea el primero para generar su QR</p>
        </div>
      )}
    </div>
  );
}
