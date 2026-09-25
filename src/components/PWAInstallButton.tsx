import React, { useState } from 'react';
import { Download, Check, Share, PlusSquare, X, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface Props {
  variant?: 'primary' | 'subtle' | 'compact' | 'full';
  showAlways?: boolean;
}

export const PWAInstallButton: React.FC<Props> = ({ variant = 'primary', showAlways = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  // If already installed and not requested to show in settings
  if (isInstalled && !showAlways) {
    return null;
  }

  if (isInstalled) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
        <Check className="w-4 h-4" />
        <span>Aplicativo instalado no dispositivo</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setJustInstalled(true);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // Browser doesn't support beforeinstallprompt yet or already dismissed
      setShowIOSGuide(true);
    }
  };

  const buttonContent = (
    <>
      <Download className="w-4 h-4 shrink-0" />
      <span>{justInstalled ? 'Instalando...' : 'Instalar aplicativo'}</span>
    </>
  );

  return (
    <>
      {variant === 'compact' && (
        <button
          onClick={handleInstallClick}
          title="Instalar Meus Sites como aplicativo no aparelho"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition shadow-sm"
        >
          {buttonContent}
        </button>
      )}

      {variant === 'primary' && (
        <button
          onClick={handleInstallClick}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg active:scale-95 transition-all"
        >
          {buttonContent}
        </button>
      )}

      {variant === 'subtle' && (
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 active:scale-95 transition"
        >
          {buttonContent}
        </button>
      )}

      {variant === 'full' && (
        <button
          onClick={handleInstallClick}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-3 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md active:scale-98 transition"
        >
          {buttonContent}
        </button>
      )}

      {/* iOS & Manual Installation Instruction Modal */}
      {showIOSGuide && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base">Instalar na Tela Inicial</h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Adicione o <strong>Meus Sites</strong> como aplicativo para abrir em tela cheia e acessar seus sites sem a barra do navegador:
            </p>

            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">
                  1
                </span>
                <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                  No navegador (Safari no iPhone ou Chrome no Android), toque no botão{' '}
                  <span className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
                    <Share className="w-3.5 h-3.5 inline" /> Compartilhar
                  </span>{' '}
                  ou no menu <strong>(⋮)</strong>.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">
                  2
                </span>
                <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                  Role a lista e selecione a opção{' '}
                  <span className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
                    <PlusSquare className="w-3.5 h-3.5 inline" /> Adicionar à Tela de Início
                  </span>{' '}
                  (ou <em>Instalar aplicativo</em>).
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">
                  3
                </span>
                <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                  Confirme em <strong>Adicionar</strong>. O ícone aparecerá direto na sua tela inicial!
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-200 transition"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
