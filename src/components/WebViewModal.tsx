import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  RotateCw,
  ExternalLink,
  Share2,
  ShieldCheck,
  AlertTriangle,
  Globe,
  Check,
  Copy,
} from 'lucide-react';
import { Site } from '../types';
import { recordSiteVisit, saveSite } from '../services/db';

interface Props {
  site: Site | null;
  onClose: () => void;
  onSiteUpdated?: (updated: Site) => void;
}

export const WebViewModal: React.FC<Props> = ({ site, onClose, onSiteUpdated }) => {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [hasIframeError, setHasIframeError] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Domains known to strictly block iframe embedding via X-Frame-Options / CSP
  const KNOWN_BLOCKED_DOMAINS = [
    'google.com',
    'youtube.com',
    'facebook.com',
    'instagram.com',
    'twitter.com',
    'x.com',
    'chatgpt.com',
    'openai.com',
    'netflix.com',
    'mail.google.com',
    'whatsapp.com',
    'web.whatsapp.com',
    'linkedin.com',
    'github.com',
    'amazon.com',
    'amazon.com.br',
    'mercadolivre.com.br',
    'itau.com.br',
    'bradesco.com.br',
    'santander.com.br',
    'nubank.com.br',
    'caixa.gov.br',
    'bb.com.br',
  ];

  const domain = site?.domain?.toLowerCase() || '';
  const isKnownBlocked = KNOWN_BLOCKED_DOMAINS.some(
    (d) => domain === d || domain.endsWith('.' + d)
  );

  const initialModeIsBrowser = site?.openMode === 'browser' || isKnownBlocked;
  const [showBlockedNotice, setShowBlockedNotice] = useState(initialModeIsBrowser);

  useEffect(() => {
    if (!site) return;

    // Record visit count & timestamp
    recordSiteVisit(site.id).catch(console.error);

    setIframeLoaded(false);
    setHasIframeError(false);
    setShowBlockedNotice(initialModeIsBrowser);

    // Timeout safety: if an iframe has not loaded in 7 seconds and is not yet marked loaded,
    // prompt user with fallback
    const timer = setTimeout(() => {
      if (!iframeLoaded && !initialModeIsBrowser) {
        // Many browsers silently blank X-Frame-Options blocked frames
        setShowBlockedNotice(true);
      }
    }, 6000);

    return () => clearTimeout(timer);
  }, [site?.id, reloadKey]);

  if (!site) return null;

  const handleOpenExternal = () => {
    window.open(site.url, '_blank', 'noopener,noreferrer');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: site.name,
          text: `Confira ${site.name} no Meus Sites:`,
          url: site.url,
        });
      } catch {
        // User cancelled or unsupported
      }
    } else {
      // Fallback copy to clipboard
      try {
        await navigator.clipboard.writeText(site.url);
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000);
      } catch (err) {
        console.error('Failed to copy URL:', err);
      }
    }
  };

  const handleReload = () => {
    setIframeLoaded(false);
    setHasIframeError(false);
    setReloadKey((prev) => prev + 1);
  };

  const handleSetAlwaysExternal = async (always: boolean) => {
    const updated: Site = {
      ...site,
      openMode: always ? 'browser' : 'auto',
    };
    await saveSite(updated);
    if (onSiteUpdated) {
      onSiteUpdated(updated);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col bg-slate-900 text-white animate-fade-in"
    >
      {/* Mini-Browser Top Toolbar */}
      <header className="flex items-center justify-between px-2 sm:px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-slate-100 shrink-0">
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Close / Back to list */}
          <button
            onClick={onClose}
            className="flex items-center justify-center p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition"
            title="Voltar para lista de sites"
            aria-label="Voltar para lista de sites"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Reload button */}
          <button
            onClick={handleReload}
            className="flex items-center justify-center p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition"
            title="Recarregar"
            aria-label="Recarregar site"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* URL / Domain Info Pill */}
        <div className="flex-1 mx-2 max-w-md">
          <div className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-mono text-slate-300 truncate">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-semibold text-white truncate">{site.name}</span>
            <span className="text-slate-500 shrink-0">•</span>
            <span className="text-slate-400 truncate">{site.domain}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Share */}
          <button
            onClick={handleShare}
            className="flex items-center justify-center p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition"
            title="Compartilhar site"
            aria-label="Compartilhar endereço do site"
          >
            {copyFeedback ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>

          {/* Open in external browser */}
          <button
            onClick={handleOpenExternal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm active:scale-95 transition"
            title="Abrir no navegador do dispositivo"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Navegador</span>
          </button>
        </div>
      </header>

      {/* Main View Area */}
      <div className="relative flex-1 bg-slate-950 overflow-hidden">
        {/* Loading Spinner for Iframe */}
        {!iframeLoaded && !showBlockedNotice && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950 text-slate-300 p-6">
            <div className="w-10 h-10 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium text-slate-200">Carregando {site.name}...</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs text-center">
              Tentando abrir dentro do aplicativo
            </p>
            <button
              onClick={() => setShowBlockedNotice(true)}
              className="mt-5 text-xs text-blue-400 hover:underline"
            >
              Demorando? Toque para ver opções de abertura
            </button>
          </div>
        )}

        {/* Fallback / Blocked Embedded Policy Notice */}
        {showBlockedNotice ? (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-slate-900 text-slate-100 overflow-y-auto">
            <div className="w-full max-w-md rounded-2xl bg-slate-800/90 border border-slate-700 p-6 sm:p-8 text-center shadow-2xl">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
                <AlertTriangle className="w-8 h-8" />
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-white mb-2">
                Abertura no Navegador Recomendada
              </h2>

              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                Este site (<span className="text-blue-400 font-mono text-xs">{site.domain}</span>)
                bloqueia exibição dentro de outros aplicativos por políticas de segurança do próprio servidor (X-Frame-Options / CSP).
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleOpenExternal}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg active:scale-98 transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir no Navegador Externo
                </button>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-700/80 text-xs text-slate-400">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={site.openMode === 'browser'}
                      onChange={(e) => handleSetAlwaysExternal(e.target.checked)}
                      className="rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    <span>Sempre abrir este site direto no navegador</span>
                  </label>
                </div>

                <div className="flex items-center justify-center gap-4 mt-2">
                  <button
                    onClick={() => {
                      setShowBlockedNotice(false);
                      setReloadKey((prev) => prev + 1);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-200 transition"
                  >
                    Tentar carregar no app mesmo assim
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    onClick={onClose}
                    className="text-xs text-slate-400 hover:text-slate-200 transition"
                  >
                    Voltar para lista
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <iframe
            key={reloadKey}
            ref={iframeRef}
            src={site.url}
            title={site.name}
            className="w-full h-full border-none bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
            onLoad={() => {
              setIframeLoaded(true);
            }}
            onError={() => {
              setHasIframeError(true);
              setShowBlockedNotice(true);
            }}
          />
        )}
      </div>

      {/* Copy Toast */}
      {copyFeedback && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-lg animate-fade-in">
          <Check className="w-4 h-4" />
          <span>Link copiado para a área de transferência!</span>
        </div>
      )}
    </div>
  );
};
