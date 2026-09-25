import React from 'react';
import { Sparkles, Globe, Shield, Smartphone, ArrowRight, Plus } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onStartWithSuggestions: () => void;
  onStartEmpty: () => void;
}

export const WelcomeOnboardingModal: React.FC<Props> = ({
  isOpen,
  onStartWithSuggestions,
  onStartEmpty,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
    >
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 text-slate-900 dark:text-slate-100 flex flex-col text-center">
        {/* Brand visual */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4 animate-bounce-subtle">
          <Globe className="w-9 h-9" />
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          Bem-vindo ao Meus Sites
        </h2>

        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xs mx-auto">
          Tenha todos os seus sites em um único aplicativo e mantenha sua tela inicial organizada.
        </p>

        {/* Feature bullets */}
        <div className="mt-6 space-y-2.5 text-left text-xs">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
            <Smartphone className="w-4 h-4 text-blue-500 shrink-0" />
            <span className="text-slate-700 dark:text-slate-200">
              Instale no celular e substitua dezenas de atalhos soltos
            </span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-slate-700 dark:text-slate-200">
              Acesso rápido por favoritos, categorias e busca instantânea
            </span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
            <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-slate-700 dark:text-slate-200">
              100% privado: dados salvos apenas no seu próprio aparelho
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onStartWithSuggestions}
            className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 active:scale-98 transition"
          >
            <span>Começar com sites sugeridos</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onStartEmpty}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar primeiro site do zero</span>
          </button>
        </div>
      </div>
    </div>
  );
};
