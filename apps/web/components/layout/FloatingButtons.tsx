// PATH: apps/web/components/layout/FloatingButtons.tsx
// DESC: FABs — WhatsApp y selector de idioma (estilo moreexchange_final.html)

'use client';

import { useState, useRef, useEffect } from 'react';

const LANGUAGES = [
  { code: 'es', flag: '🇨🇱', name: 'Español', lcode: 'ES' },
  { code: 'en', flag: '🇺🇸', name: 'English', lcode: 'EN' },
  { code: 'pt', flag: '🇧🇷', name: 'Português', lcode: 'PT' },
  { code: 'zh', flag: '🇨🇳', name: '中文', lcode: 'ZH' },
  { code: 'fr', flag: '🇫🇷', name: 'Français', lcode: 'FR' },
  { code: 'de', flag: '🇩🇪', name: 'Deutsch', lcode: 'DE' },
] as const;

const WA_URL =
  'https://wa.me/56969060570?text=Hola%2C%20quisiera%20información%20sobre%20cambio%20de%20divisas%20en%20More%20Exchange';

export function FloatingButtons() {
  const [langOpen, setLangOpen] = useState(false);
  const [activeLang, setActiveLang] = useState<(typeof LANGUAGES)[number]>(LANGUAGES[0]);
  const langWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (langWrapRef.current && !langWrapRef.current.contains(e.target as Node) && langOpen) {
        setLangOpen(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [langOpen]);

  return (
    <div
      className="fixed bottom-[26px] right-[22px] z-[9999] flex flex-col items-end gap-[11px]"
      aria-label="Acciones rápidas"
    >
      {/* Selector de idioma */}
      <div className="relative flex flex-col items-end" ref={langWrapRef}>
        <div
          className={[
            'absolute bottom-[62px] right-0 min-w-[195px] rounded-[14px] border border-white/10 bg-[rgba(11,20,56,1)] px-2 py-2 shadow-xl',
            'flex flex-col gap-0.5 transition-all duration-[220ms] ease-out',
            langOpen
              ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
              : 'pointer-events-none translate-y-2 scale-[0.97] opacity-0',
          ].join(' ')}
          role="menu"
          aria-label="Idiomas"
          id="langMenu"
        >
          {LANGUAGES.slice(0, 3).map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => {
                setActiveLang(lang);
                setLangOpen(false);
              }}
              className={[
                'flex w-full items-center gap-2.5 rounded-lg border border-transparent px-3 py-2.5 text-left text-[13px] transition-all duration-150',
                activeLang.code === lang.code
                  ? 'border-[rgba(0,194,255,0.35)] bg-[rgba(36,88,245,0.22)] font-medium text-[#00C2FF]'
                  : 'text-white/70 hover:translate-x-[-2px] hover:border-[rgba(0,194,255,0.2)] hover:bg-[rgba(36,88,245,0.2)] hover:text-white',
              ].join(' ')}
              role="menuitem"
            >
              <span className="text-[19px] leading-none">{lang.flag}</span>
              <span className="flex-1">{lang.name}</span>
              <span className="text-[10px] font-mono tracking-wide text-[#00C2FF]/80 opacity-80">
                {lang.lcode}
              </span>
            </button>
          ))}
          <div className="my-1 h-px bg-white/[0.07] mx-1" aria-hidden />
          {LANGUAGES.slice(3).map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => {
                setActiveLang(lang);
                setLangOpen(false);
              }}
              className={[
                'flex w-full items-center gap-2.5 rounded-lg border border-transparent px-3 py-2.5 text-left text-[13px] transition-all duration-150',
                activeLang.code === lang.code
                  ? 'border-[rgba(0,194,255,0.35)] bg-[rgba(36,88,245,0.22)] font-medium text-[#00C2FF]'
                  : 'text-white/70 hover:translate-x-[-2px] hover:border-[rgba(0,194,255,0.2)] hover:bg-[rgba(36,88,245,0.2)] hover:text-white',
              ].join(' ')}
              role="menuitem"
            >
              <span className="text-[19px] leading-none">{lang.flag}</span>
              <span className="flex-1">{lang.name}</span>
              <span className="text-[10px] font-mono tracking-wide text-[#00C2FF]/80 opacity-80">
                {lang.lcode}
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setLangOpen((o) => !o)}
          className={[
            'group flex h-[52px] w-[52px] items-center justify-center rounded-full border-[1.5px] text-[22px] leading-none transition-all duration-200',
            'bg-[#0F1E45] border-[rgba(0,194,255,0.35)] shadow-[0_4px_22px_rgba(36,88,245,0.4)]',
            'hover:scale-[1.08] hover:border-[#00C2FF] hover:shadow-[0_6px_30px_rgba(0,194,255,0.45)]',
            langOpen && 'border-[#00C2FF] bg-[#162254]',
          ].join(' ')}
          aria-expanded={langOpen}
          aria-haspopup="menu"
          aria-controls="langMenu"
          title="Cambiar idioma"
        >
          <span className="relative">
            {activeLang.flag}
            <span className="absolute right-[60px] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md border border-white/10 bg-[rgba(6,12,30,0.96)] px-3 py-1.5 text-[12px] font-medium text-white opacity-0 transition-opacity duration-[180ms] pointer-events-none group-hover:opacity-100">
              Cambiar idioma
            </span>
          </span>
        </button>
      </div>

      {/* WhatsApp */}
      <a
        href={WA_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_4px_22px_rgba(37,211,102,0.5)] transition-all duration-200 hover:scale-110 hover:shadow-[0_6px_30px_rgba(37,211,102,0.65)]"
        aria-label="Contactar por WhatsApp"
        title="WhatsApp"
      >
        <svg viewBox="0 0 24 24" className="h-[26px] w-[26px] fill-white" aria-hidden>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        <span className="absolute right-[60px] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md border border-white/10 bg-[rgba(6,12,30,0.96)] px-3 py-1.5 text-[12px] font-medium text-white opacity-0 transition-opacity duration-[180ms] pointer-events-none group-hover:opacity-100">
          WhatsApp
        </span>
      </a>
    </div>
  );
}
