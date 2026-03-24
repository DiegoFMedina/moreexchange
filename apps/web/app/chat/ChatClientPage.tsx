// PATH: apps/web/app/chat/ChatClientPage.tsx
// DESC: Lógica del chat de soporte — pantalla de bienvenida con datos del tótem, formulario de nombre y chat en tiempo real

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import { resolveApiBaseUrl, resolveApiUrl } from '@/lib/runtime-urls';

const API = resolveApiUrl();

interface Totem {
  id: string;
  name: string;
  location: string;
  description?: string;
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
}

interface Session {
  id: string;
  token: string;
  clientName: string;
  clientPhone?: string;
  status: 'OPEN' | 'PENDING' | 'RESOLVED' | 'CLOSED';
  startedAt: string;
  totem: Totem;
  messages: Message[];
  transferRequest?: TransferRequest | null;
}

type Screen = 'loading' | 'welcome' | 'form' | 'chat' | 'error';

export default function ChatClientPage() {
  const params = useSearchParams();
  const totemId = params.get('totemId');

  const [screen, setScreen] = useState<Screen>('loading');
  const [totem, setTotem] = useState<Totem | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [wasClosedByAdmin, setWasClosedByAdmin] = useState(false);

  // Vinculación de sesiones
  const [relatedSessionToken, setRelatedSessionToken] = useState<string | null>(null);

  // Transfer form
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [transferForm, setTransferForm] = useState({
    bankName: '',
    accountType: '',
    accountNumber: '',
    rut: '',
    accountHolder: '',
    amount: '',
    currency: 'CLP',
    notes: '',
  });
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);
  const [transferSubmitted, setTransferSubmitted] = useState(false);

  // Form fields
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Chat input
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMsgTime = useRef<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Cargar info del tótem
  useEffect(() => {
    if (!totemId) {
      setErrorMsg(
        'No se encontró información del tótem. Asegúrese de escanear el QR correctamente.',
      );
      setScreen('error');
      return;
    }

    // Intentar restaurar sesión desde localStorage
    const saved = localStorage.getItem(`chat_session_${totemId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as {
          token: string;
          clientName?: string;
          clientPhone?: string;
        };
        axios
          .get<{ data: Session }>(`${API}/chat/sessions/${parsed.token}`)
          .then(({ data }) => {
            const sess = data.data;
            setSession(sess);
            setMessages(sess.messages);
            lastMsgTime.current = sess.messages.at(-1)?.createdAt ?? sess.startedAt;
            setTotem(sess.totem);
            // Restaurar estado del formulario de transferencia
            if (
              sess.transferRequest?.status === 'FILLED' ||
              sess.transferRequest?.status === 'TRANSFERRED'
            ) {
              setTransferSubmitted(true);
            }
            // Pre-cargar datos del cliente para facilitar continuación
            if (parsed.clientName) setClientName(parsed.clientName);
            if (parsed.clientPhone) setClientPhone(parsed.clientPhone);
            setScreen('chat');
          })
          .catch(() => {
            localStorage.removeItem(`chat_session_${totemId}`);
            loadTotem();
          });
      } catch {
        loadTotem();
      }
    } else {
      loadTotem();
    }

    function loadTotem() {
      axios
        .get<{ data: Totem }>(`${API}/chat/totems/${totemId}`)
        .then(({ data }) => {
          setTotem(data.data);
          setScreen('welcome');
        })
        .catch(() => {
          setErrorMsg('No se pudo cargar la información del tótem.');
          setScreen('error');
        });
    }
  }, [totemId]);

  // Polling de mensajes nuevos
  useEffect(() => {
    if (screen !== 'chat' || !session) return;

    pollingRef.current = setInterval(async () => {
      try {
        const sessionResponse = await axios.get<{ data: Session }>(
          `${API}/chat/sessions/${session.token}`,
        );
        const latestSession = sessionResponse.data.data;
        setSession((prev) => {
          if (prev?.status !== 'CLOSED' && latestSession.status === 'CLOSED') {
            setWasClosedByAdmin(true);
          }
          // Si el admin envió formulario de transferencia, mostrar el form
          if (latestSession.transferRequest?.status === 'PENDING' && !transferSubmitted) {
            setShowTransferForm(true);
          }
          return latestSession;
        });

        const url = lastMsgTime.current
          ? `${API}/chat/sessions/${session.token}/messages?since=${encodeURIComponent(lastMsgTime.current)}`
          : `${API}/chat/sessions/${session.token}/messages`;

        const { data } = await axios.get<{ data: Message[] }>(url);
        if (data.data.length > 0) {
          setMessages((prev) => {
            const ids = new Set(prev.map((m) => m.id));
            const fresh = data.data.filter((m) => !ids.has(m.id));
            if (fresh.length === 0) return prev;
            lastMsgTime.current = fresh.at(-1)!.createdAt;
            return [...prev, ...fresh];
          });
        }
      } catch {
        // silent
      }
    }, 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [screen, session, transferSubmitted]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  async function handleCreateSession(e: React.FormEvent) {
    e.preventDefault();
    if (!clientName.trim() || !totemId) return;

    setIsCreating(true);
    try {
      const { data } = await axios.post<{ data: Session }>(`${API}/chat/sessions`, {
        totemId,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim() || undefined,
        initialMessage: initialMessage.trim() || undefined,
        ...(relatedSessionToken ? { relatedSessionToken } : {}),
      });

      const sess = data.data;
      const sessionMessages = Array.isArray(sess.messages) ? sess.messages : [];
      setSession(sess);
      setMessages(sessionMessages);
      lastMsgTime.current = sessionMessages.at(-1)?.createdAt ?? sess.startedAt;
      // Persistir token + datos del cliente para restauración y continuación futura
      localStorage.setItem(
        `chat_session_${totemId}`,
        JSON.stringify({
          token: sess.token,
          clientName: sess.clientName,
          clientPhone: sess.clientPhone ?? '',
        }),
      );
      setRelatedSessionToken(null);
      setScreen('chat');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErrorMsg(msg ?? 'Error al iniciar la sesión. Intente nuevamente.');
    } finally {
      setIsCreating(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!session || (!input.trim() && files.length === 0) || isSending) return;

    setIsSending(true);
    try {
      const form = new FormData();
      form.append('content', input.trim() || '📎 Adjunto');
      files.forEach((f) => form.append('attachments', f));

      const { data } = await axios.post<{ data: Message }>(
        `${API}/chat/sessions/${session.token}/messages`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );

      setMessages((prev) => {
        const ids = new Set(prev.map((m) => m.id));
        if (ids.has(data.data.id)) return prev;
        return [...prev, data.data];
      });
      lastMsgTime.current = data.data.createdAt;
      setInput('');
      setFiles([]);
    } catch {
      // silent — el polling lo recuperará
    } finally {
      setIsSending(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...selected].slice(0, 5));
    e.target.value = '';
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmitTransferData(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setIsSubmittingTransfer(true);
    try {
      await axios.post(`${API}/chat/sessions/${session.token}/transfer-data`, transferForm);
      setTransferSubmitted(true);
      setShowTransferForm(false);
    } catch {
      // silent
    } finally {
      setIsSubmittingTransfer(false);
    }
  }

  // Continuar tras sesión cerrada: pre-rellena datos y vincula al ticket anterior
  function handleContinueAfterClose() {
    if (!totemId || !session) return;
    const prevToken = session.token;
    const prevName = session.clientName;
    const prevPhone = session.clientPhone ?? '';

    setRelatedSessionToken(prevToken);
    setClientName(prevName);
    setClientPhone(prevPhone);
    setInitialMessage('');
    setSession(null);
    setMessages([]);
    setInput('');
    setFiles([]);
    setWasClosedByAdmin(false);
    setShowTransferForm(false);
    setTransferSubmitted(false);
    setTransferForm({
      bankName: '',
      accountType: '',
      accountNumber: '',
      rut: '',
      accountHolder: '',
      amount: '',
      currency: 'CLP',
      notes: '',
    });
    setErrorMsg('');
    setScreen('form');
  }

  // Nueva sesión desde cero (botón reset en header)
  function handleNewSession() {
    if (!totemId) return;
    localStorage.removeItem(`chat_session_${totemId}`);
    setSession(null);
    setRelatedSessionToken(null);
    setMessages([]);
    setInput('');
    setFiles([]);
    setClientName('');
    setClientPhone('');
    setInitialMessage('');
    setWasClosedByAdmin(false);
    setShowTransferForm(false);
    setTransferSubmitted(false);
    setTransferForm({
      bankName: '',
      accountType: '',
      accountNumber: '',
      rut: '',
      accountHolder: '',
      amount: '',
      currency: 'CLP',
      notes: '',
    });
    setScreen('welcome');
  }

  // ─── Pantallas ─────────────────────────────────────────────────────────────

  if (screen === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (screen === 'error') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>
          <p className="text-white font-medium mb-2">Ocurrió un error</p>
          <p className="text-gray-400 text-sm">{errorMsg}</p>
        </div>
      </div>
    );
  }

  if (screen === 'welcome') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Fondo decorativo */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px]" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
        </div>

        <div className="relative w-full max-w-sm">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 relative mb-4">
              <Image
                src="/logo.svg"
                alt="More Exchange"
                fill
                className="object-contain drop-shadow-[0_0_20px_rgba(251,191,36,0.4)]"
              />
            </div>
            <div className="text-center">
              <p className="text-amber-400/70 text-xs tracking-[0.3em] uppercase font-medium mb-1">
                Soporte Técnico
              </p>
              <h1 className="text-white text-2xl font-bold tracking-tight">More Exchange</h1>
            </div>
          </div>

          {/* Tarjeta del tótem */}
          {totem && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-400/10 border border-amber-400/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-amber-400"
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
                  <p className="text-white font-semibold text-[15px] leading-tight">{totem.name}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{totem.location}</p>
                  {totem.description && (
                    <p className="text-gray-500 text-xs mt-1.5 leading-relaxed">
                      {totem.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Descripción */}
          <div className="text-center mb-8">
            <p className="text-gray-300 text-sm leading-relaxed">
              ¿Tienes un problema con este tótem? Nuestro equipo de soporte te ayudará de inmediato.
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={() => setScreen('form')}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-bold rounded-2xl transition-all duration-200 shadow-[0_0_30px_rgba(251,191,36,0.3)] hover:shadow-[0_0_40px_rgba(251,191,36,0.5)] active:scale-[0.98] text-[15px]"
          >
            Iniciar Chat de Soporte
          </button>

          <p className="text-center text-gray-600 text-xs mt-4">
            {new Date().toLocaleString('es-CL', { dateStyle: 'long', timeStyle: 'short' })}
          </p>
        </div>
      </div>
    );
  }

  if (screen === 'form') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative w-full max-w-sm">
          <button
            onClick={() => setScreen('welcome')}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm mb-6 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Volver
          </button>

          {relatedSessionToken && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-5">
              <p className="text-amber-400 text-[13px] font-semibold flex items-center gap-2">
                <span>🔄</span> Continuación del ticket anterior
              </p>
              <p className="text-gray-500 text-[11px] mt-0.5 leading-relaxed">
                Tu nuevo ticket quedará vinculado al anterior para que el equipo pueda hacer
                seguimiento. Tus datos están pre-rellenados.
              </p>
            </div>
          )}

          <div className="mb-7">
            <h2 className="text-white text-xl font-bold">
              {relatedSessionToken ? 'Confirma tus datos' : 'Cuéntanos quién eres'}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {relatedSessionToken
                ? 'Revisa o actualiza tu información antes de continuar.'
                : 'Solo necesitamos tu nombre para poder ayudarte mejor.'}
            </p>
          </div>

          <form onSubmit={handleCreateSession} className="space-y-4">
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-2 tracking-wide uppercase">
                Nombre completo <span className="text-amber-500">*</span>
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ej: Juan Pérez"
                required
                minLength={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 focus:bg-white/8 transition-all text-[15px]"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-medium mb-2 tracking-wide uppercase">
                Teléfono <span className="text-gray-600">(opcional)</span>
              </label>
              <input
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="+56 9 1234 5678"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 focus:bg-white/8 transition-all text-[15px]"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-medium mb-2 tracking-wide uppercase">
                ¿Cuál es tu problema? <span className="text-gray-600">(opcional)</span>
              </label>
              <textarea
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                placeholder="Describe brevemente el problema que tuviste con el tótem..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 focus:bg-white/8 transition-all text-[15px] resize-none"
              />
            </div>

            {errorMsg && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={isCreating || !clientName.trim()}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-bold rounded-2xl transition-all duration-200 shadow-[0_0_30px_rgba(251,191,36,0.3)] hover:shadow-[0_0_40px_rgba(251,191,36,0.5)] active:scale-[0.98] text-[15px] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isCreating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Iniciando...
                </span>
              ) : relatedSessionToken ? (
                'Continuar con nuevo ticket →'
              ) : (
                'Comenzar Chat →'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ─── Pantalla de Chat ───────────────────────────────────────────────────────
  const isClosed = session?.status === 'CLOSED';
  const apiBase = resolveApiBaseUrl();

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      {/* Header */}
      <header className="bg-[#0f0f18]/95 border-b border-white/[0.06] backdrop-blur-lg px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <div className="w-9 h-9 relative flex-shrink-0">
          <Image src="/logo.svg" alt="More Exchange" fill className="object-contain" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-[14px] leading-tight truncate">
            Soporte More Exchange
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                isClosed
                  ? 'bg-red-400'
                  : session?.status === 'RESOLVED'
                    ? 'bg-amber-400'
                    : 'bg-emerald-400 animate-pulse'
              }`}
            />
            <p className="text-gray-500 text-xs truncate">
              {isClosed
                ? 'Sesión cerrada'
                : session?.status === 'RESOLVED'
                  ? 'Resuelta'
                  : `En línea · ${totem?.name}`}
            </p>
          </div>
        </div>
        <button
          onClick={handleNewSession}
          className="p-2 text-gray-600 hover:text-gray-400 transition-colors rounded-lg hover:bg-white/5"
          title="Nueva sesión"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
        </button>
      </header>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 pb-4">
        {/* Mensaje de bienvenida */}
        <div className="flex justify-start">
          <div className="max-w-[80%] bg-white/5 border border-white/[0.08] rounded-2xl rounded-tl-sm px-4 py-3">
            <p className="text-white/90 text-sm leading-relaxed">
              Hola <span className="text-amber-400 font-semibold">{session?.clientName}</span>,
              bienvenido al soporte de More Exchange. Soy el asistente del tótem{' '}
              <span className="text-amber-400">{totem?.name}</span>. ¿En qué puedo ayudarte hoy?
            </p>
            <p className="text-gray-600 text-[10px] mt-1.5">
              {new Date(session?.startedAt ?? '').toLocaleTimeString('es-CL', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            apiBase={apiBase}
            onOpenTransferForm={() => {
              if (!transferSubmitted) setShowTransferForm(true);
            }}
            transferSubmitted={transferSubmitted}
          />
        ))}

        {isClosed && (
          <div className="flex justify-center">
            <div className="bg-red-500/10 border border-red-500/20 rounded-full px-4 py-2">
              <p className="text-red-400 text-xs">
                {wasClosedByAdmin
                  ? 'El administrador cerró la conversación. Puedes iniciar una nueva sesión.'
                  : 'Esta sesión fue cerrada por el administrador'}
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {!isClosed && (
        <div className="bg-[#0f0f18]/95 border-t border-white/[0.06] backdrop-blur-lg px-4 py-3 sticky bottom-0">
          {/* Preview de archivos */}
          {files.length > 0 && (
            <div className="flex gap-2 mb-3 flex-wrap">
              {files.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5"
                >
                  <svg
                    className="w-3.5 h-3.5 text-amber-400 flex-shrink-0"
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
                  <span className="text-gray-300 text-xs max-w-[100px] truncate">{f.name}</span>
                  <button
                    onClick={() => removeFile(i)}
                    className="text-gray-600 hover:text-red-400 transition-colors ml-0.5"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="p-2.5 text-gray-600 hover:text-amber-400 transition-colors rounded-xl hover:bg-white/5 flex-shrink-0"
              title="Adjuntar archivo"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e as unknown as React.FormEvent);
                  }
                }}
                placeholder="Escribe tu mensaje..."
                rows={1}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/40 transition-all text-[14px] resize-none leading-relaxed max-h-32 overflow-y-auto"
                style={{ minHeight: '48px' }}
              />
            </div>

            <button
              type="submit"
              disabled={isSending || (!input.trim() && files.length === 0)}
              className="p-3 bg-amber-500 hover:bg-amber-400 disabled:bg-white/5 disabled:text-gray-600 text-black rounded-xl transition-all duration-150 flex-shrink-0 active:scale-95"
            >
              {isSending ? (
                <span className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin block" />
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              )}
            </button>
          </form>
        </div>
      )}

      {isClosed && (
        <div className="bg-[#0f0f18]/95 border-t border-white/[0.06] p-4 space-y-2">
          <button
            onClick={handleContinueAfterClose}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-bold rounded-xl transition-all duration-200 text-[14px]"
          >
            ¿Necesitas más ayuda? Abrir nuevo ticket
          </button>
          <button
            onClick={handleNewSession}
            className="w-full py-2 text-gray-600 hover:text-gray-400 text-[12px] transition-colors"
          >
            Iniciar desde cero (borrar historial)
          </button>
        </div>
      )}

      {/* Modal formulario de transferencia */}
      {showTransferForm && !transferSubmitted && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#12121e] border border-white/10 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#12121e] border-b border-white/[0.06] px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-amber-400 text-[11px] font-bold tracking-widest uppercase">
                  Soporte More Exchange
                </p>
                <h3 className="text-white font-bold text-[16px] mt-0.5">
                  Formulario de devolución
                </h3>
              </div>
              <button
                onClick={() => setShowTransferForm(false)}
                className="p-2 text-gray-500 hover:text-gray-300 rounded-lg hover:bg-white/5"
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

            <div className="px-5 py-4">
              <p className="text-gray-400 text-sm leading-relaxed mb-5">
                El agente de soporte solicita tus datos bancarios para procesar la devolución de
                dinero. Todos los datos son tratados de forma segura.
              </p>

              <form onSubmit={handleSubmitTransferData} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-gray-400 text-[11px] font-medium mb-1.5 uppercase tracking-wide">
                      Titular de la cuenta *
                    </label>
                    <input
                      required
                      value={transferForm.accountHolder}
                      onChange={(e) =>
                        setTransferForm({ ...transferForm, accountHolder: e.target.value })
                      }
                      placeholder="Nombre completo"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 text-[14px]"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-gray-400 text-[11px] font-medium mb-1.5 uppercase tracking-wide">
                      RUT *
                    </label>
                    <input
                      required
                      value={transferForm.rut}
                      onChange={(e) => setTransferForm({ ...transferForm, rut: e.target.value })}
                      placeholder="12.345.678-9"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 text-[14px]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-[11px] font-medium mb-1.5 uppercase tracking-wide">
                      Banco *
                    </label>
                    <input
                      required
                      value={transferForm.bankName}
                      onChange={(e) =>
                        setTransferForm({ ...transferForm, bankName: e.target.value })
                      }
                      placeholder="Banco Estado"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 text-[14px]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-[11px] font-medium mb-1.5 uppercase tracking-wide">
                      Tipo de cuenta *
                    </label>
                    <select
                      required
                      value={transferForm.accountType}
                      onChange={(e) =>
                        setTransferForm({ ...transferForm, accountType: e.target.value })
                      }
                      className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 text-[14px]"
                    >
                      <option value="">Seleccionar</option>
                      <option value="Cuenta Corriente">Cuenta Corriente</option>
                      <option value="Cuenta Vista">Cuenta Vista</option>
                      <option value="Cuenta Ahorro">Cuenta Ahorro</option>
                      <option value="Cuenta RUT">Cuenta RUT</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-gray-400 text-[11px] font-medium mb-1.5 uppercase tracking-wide">
                      Número de cuenta *
                    </label>
                    <input
                      required
                      value={transferForm.accountNumber}
                      onChange={(e) =>
                        setTransferForm({ ...transferForm, accountNumber: e.target.value })
                      }
                      placeholder="00000000"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 text-[14px]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-[11px] font-medium mb-1.5 uppercase tracking-wide">
                      Monto a devolver
                    </label>
                    <input
                      type="number"
                      value={transferForm.amount}
                      onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                      placeholder="0"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 text-[14px]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-[11px] font-medium mb-1.5 uppercase tracking-wide">
                      Moneda
                    </label>
                    <select
                      value={transferForm.currency}
                      onChange={(e) =>
                        setTransferForm({ ...transferForm, currency: e.target.value })
                      }
                      className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 text-[14px]"
                    >
                      <option value="CLP">CLP</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-gray-400 text-[11px] font-medium mb-1.5 uppercase tracking-wide">
                      Observaciones adicionales
                    </label>
                    <textarea
                      value={transferForm.notes}
                      onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
                      placeholder="Información adicional para el agente..."
                      rows={2}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 text-[14px] resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowTransferForm(false)}
                    className="flex-1 py-3 border border-white/10 text-gray-400 rounded-xl text-[13px] font-medium hover:bg-white/5"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingTransfer}
                    className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-bold rounded-xl transition-all text-[13px] disabled:opacity-50"
                  >
                    {isSubmittingTransfer ? 'Enviando...' : 'Enviar datos'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Componente burbuja de mensaje ──────────────────────────────────────────

function MessageBubble({
  msg,
  apiBase,
  onOpenTransferForm,
  transferSubmitted,
}: {
  msg: Message;
  apiBase: string;
  onOpenTransferForm: () => void;
  transferSubmitted: boolean;
}) {
  const isClient = msg.sender === 'CLIENT';
  const isSystem = msg.sender === 'SYSTEM';

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <span className="bg-white/5 border border-white/[0.06] text-gray-500 text-[10px] px-3 py-1.5 rounded-full italic">
          {msg.content}
        </span>
      </div>
    );
  }

  if (msg.messageType === 'TRANSFER_FORM') {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] bg-amber-500/10 border border-amber-500/30 rounded-2xl rounded-bl-sm px-4 py-3">
          <p className="text-amber-400 text-[10px] font-bold tracking-widest uppercase mb-1">
            Soporte
          </p>
          <p className="text-white/90 text-sm leading-relaxed mb-3">{msg.content}</p>
          {!transferSubmitted ? (
            <button
              onClick={onOpenTransferForm}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-[13px] transition-colors"
            >
              📋 Completar formulario de devolución
            </button>
          ) : (
            <div className="py-2 text-center">
              <span className="text-emerald-400 text-[12px] font-medium">
                ✓ Datos enviados correctamente
              </span>
            </div>
          )}
          <p className="text-gray-600 text-[10px] mt-2">
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
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-emerald-500/10 border border-emerald-500/20 rounded-2xl rounded-br-sm px-4 py-3">
          <p className="text-emerald-400 text-[10px] font-bold tracking-widest uppercase mb-1">
            Tú
          </p>
          <p className="text-white/80 text-sm leading-relaxed">{msg.content}</p>
          <p className="text-gray-600 text-[10px] mt-1.5">
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
      <div className="flex justify-start">
        <div className="max-w-[85%] bg-emerald-500/10 border border-emerald-500/20 rounded-2xl rounded-bl-sm px-4 py-3">
          <p className="text-amber-400 text-[10px] font-bold tracking-widest uppercase mb-1">
            Soporte
          </p>
          <p className="text-white/90 text-sm leading-relaxed mb-2">{msg.content}</p>
          {msg.attachments.map((att) => (
            <AttachmentPreview key={att.id} att={att} apiBase={apiBase} isClient={false} />
          ))}
          <p className="text-gray-600 text-[10px] mt-1.5">
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
    <div className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isClient
            ? 'bg-amber-500 text-black rounded-br-sm'
            : 'bg-white/5 border border-white/[0.08] text-white/90 rounded-bl-sm'
        }`}
      >
        {!isClient && (
          <p className="text-amber-400 text-[10px] font-bold tracking-widest uppercase mb-1">
            Soporte
          </p>
        )}

        <p
          className={`text-sm leading-relaxed whitespace-pre-wrap ${isClient ? 'text-black' : 'text-white/90'}`}
        >
          {msg.content}
        </p>

        {msg.attachments.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {msg.attachments.map((att) => (
              <AttachmentPreview key={att.id} att={att} apiBase={apiBase} isClient={isClient} />
            ))}
          </div>
        )}

        <p className={`text-[10px] mt-1.5 ${isClient ? 'text-black/50' : 'text-gray-600'}`}>
          {new Date(msg.createdAt).toLocaleTimeString('es-CL', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}

function AttachmentPreview({
  att,
  apiBase,
  isClient,
}: {
  att: Attachment;
  apiBase: string;
  isClient: boolean;
}) {
  const normalizedPath = att.url.startsWith('/uploads/')
    ? att.url.replace('/uploads/', '/v1/uploads/')
    : att.url;
  const url = normalizedPath.startsWith('http') ? normalizedPath : `${apiBase}${normalizedPath}`;
  const isImage = att.mimeType.startsWith('image/');
  const isVideo = att.mimeType.startsWith('video/');

  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={att.filename}
          className="max-w-[200px] max-h-[200px] rounded-lg object-cover border border-white/10"
        />
      </a>
    );
  }

  if (isVideo) {
    return <video src={url} controls className="max-w-[200px] rounded-lg border border-white/10" />;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
        isClient ? 'bg-black/10 hover:bg-black/20' : 'bg-white/5 hover:bg-white/10'
      }`}
    >
      <svg
        className={`w-4 h-4 flex-shrink-0 ${isClient ? 'text-black/70' : 'text-amber-400'}`}
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
      <span
        className={`text-xs truncate max-w-[140px] ${isClient ? 'text-black/80' : 'text-gray-300'}`}
      >
        {att.filename}
      </span>
      <span className={`text-[10px] flex-shrink-0 ${isClient ? 'text-black/50' : 'text-gray-600'}`}>
        {(att.size / 1024).toFixed(0)}KB
      </span>
    </a>
  );
}
