import React, { useRef, useState } from 'react';
import {
  X,
  Settings,
  Moon,
  Sun,
  Laptop,
  ArrowUpDown,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  Info,
  Check,
  AlertCircle,
  Folder,
  History,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { AppSettings, Category, SortOption, ThemeMode } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import {
  clearVisitHistory,
  exportBackup,
  importBackup,
  saveSettings,
  seedSuggestedSites,
} from '../services/db';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSettingsChanged: (updated: AppSettings) => void;
  onOpenCategoriesManager: () => void;
  onDataReloadNeeded: () => void;
}

export const SettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  settings,
  onSettingsChanged,
  onOpenCategoriesManager,
  onDataReloadNeeded,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [pendingFileContent, setPendingFileContent] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const handleThemeChange = async (theme: ThemeMode) => {
    const updated = { ...settings, theme };
    await saveSettings({ theme });
    onSettingsChanged(updated);
  };

  const handleSortChange = async (sortOption: SortOption) => {
    const updated = { ...settings, sortOption };
    await saveSettings({ sortOption });
    onSettingsChanged(updated);
  };

  const handleExport = async () => {
    try {
      const json = await exportBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meus-sites-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setFeedback({ type: 'success', message: 'Backup exportado com sucesso!' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Erro ao gerar arquivo de backup.' });
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setPendingFileContent(content);
      setImportModalOpen(true);
    };
    reader.onerror = () => {
      setFeedback({ type: 'error', message: 'Não foi possível ler o arquivo selecionado.' });
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const handleConfirmImport = async (mode: 'replace' | 'merge') => {
    if (!pendingFileContent) return;
    try {
      const result = await importBackup(pendingFileContent, mode);
      setImportModalOpen(false);
      setPendingFileContent(null);
      onDataReloadNeeded();
      setFeedback({
        type: 'success',
        message: `Importação concluída! Adicionados: ${result.added}, Atualizados: ${result.updated}`,
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Arquivo de backup inválido ou corrompido.',
      });
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('Deseja limpar todo o histórico de sites recentes e contadores de acesso?')) {
      await clearVisitHistory();
      onDataReloadNeeded();
      setFeedback({ type: 'success', message: 'Histórico de recentes zerado.' });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleRestoreSuggested = async () => {
    if (window.confirm('Deseja adicionar os sites sugeridos padrão (YouTube, ChatGPT, Gmail, etc.)?')) {
      await seedSuggestedSites();
      onDataReloadNeeded();
      setFeedback({ type: 'success', message: 'Sites sugeridos adicionados com sucesso!' });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
        onClick={onClose}
      >
        <div
          className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-slate-900 dark:text-slate-100 max-h-[92vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-base sm:text-lg">Configurações</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Preferências, dados e informações do aplicativo
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Feedback message */}
          {feedback && (
            <div
              className={`mt-3 p-3 rounded-xl text-xs flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <Check className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Settings list */}
          <div className="mt-4 flex-1 overflow-y-auto space-y-5 pr-1">
            {/* Section: Aparência */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">
                Aparência
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleThemeChange('system')}
                  className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition ${
                    settings.theme === 'system'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Laptop className="w-4 h-4" />
                  <span>Automático</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleThemeChange('light')}
                  className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition ${
                    settings.theme === 'light'
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  <span>Claro</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleThemeChange('dark')}
                  className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition ${
                    settings.theme === 'dark'
                      ? 'border-blue-600 bg-blue-950/50 text-blue-400'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  <span>Escuro</span>
                </button>
              </div>
            </div>

            {/* Section: Sites & Organização */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">
                Sites & Organização
              </h3>
              <div className="space-y-2">
                {/* Default Sorting */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ArrowUpDown className="w-4 h-4 text-slate-500" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Ordenação padrão
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Como os sites aparecem na lista
                      </p>
                    </div>
                  </div>
                  <select
                    value={settings.sortOption}
                    onChange={(e) => handleSortChange(e.target.value as SortOption)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none"
                  >
                    <option value="custom">Ordem personalizada</option>
                    <option value="most-visited">Mais usados</option>
                    <option value="recent-added">Adicionados recentemente</option>
                    <option value="recent-visited">Últimos acessados</option>
                    <option value="alpha-asc">Nome A-Z</option>
                    <option value="alpha-desc">Nome Z-A</option>
                  </select>
                </div>

                {/* Categories Manager trigger */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCategoriesManager();
                  }}
                  className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <Folder className="w-4 h-4 text-purple-500" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Gerenciar categorias
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Criar, editar e excluir grupos de sites
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    Acessar
                  </span>
                </button>

                {/* Clear Recent History */}
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <History className="w-4 h-4 text-amber-500" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Limpar recentes
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Zerar histórico de acessos e contadores
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-500 hover:text-slate-700">
                    Limpar
                  </span>
                </button>
              </div>
            </div>

            {/* Section: Backup e Dados */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">
                Dados & Backup Local
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleExport}
                  className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
                >
                  <Download className="w-4 h-4 text-blue-500 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Exportar backup
                    </p>
                    <p className="text-[10px] text-slate-500">Salvar arquivo JSON</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
                >
                  <Upload className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Importar backup
                    </p>
                    <p className="text-[10px] text-slate-500">Restaurar de JSON</p>
                  </div>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleFileSelected}
                />
              </div>

              {/* Seed sites button */}
              <button
                type="button"
                onClick={handleRestoreSuggested}
                className="mt-2 w-full p-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center gap-2 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Adicionar sites populares sugeridos
              </button>
            </div>

            {/* Section: Aplicativo PWA */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">
                Aplicativo (PWA)
              </h3>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Instalação no dispositivo
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Disponível para Android, iOS, Windows, Mac e Linux
                    </p>
                  </div>
                  <PWAInstallButton variant="compact" showAlways />
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>
                    Armazenamento 100% local com IndexedDB. Nenhum dado é enviado para servidores externos.
                  </span>
                </div>
              </div>
            </div>

            {/* Section: Sobre (Requirement #30) */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md mb-2">
                MS
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Meus Sites
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Versão 1.0.0
              </p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 max-w-xs mx-auto">
                Um gerenciador pessoal de sites desenvolvido como PWA.
              </p>
              <p className="mt-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
                &copy; Alisson Salvador 2026
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>

      {/* Import Confirmation Dialog (Requirement #16) */}
      {importModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in"
          onClick={() => setImportModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-slate-900 dark:text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base">Como deseja importar?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Escolha como mesclar os sites do backup
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Você pode adicionar os sites do arquivo à sua lista atual ou substituir todos os itens existentes.
            </p>

            <div className="mt-5 space-y-2.5">
              <button
                type="button"
                onClick={() => handleConfirmImport('merge')}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm text-left flex items-center justify-between transition"
              >
                <span>Adicionar aos sites existentes</span>
                <span className="text-[10px] bg-blue-500/40 px-2 py-0.5 rounded">Recomendado</span>
              </button>

              <button
                type="button"
                onClick={() => handleConfirmImport('replace')}
                className="w-full py-2.5 px-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs font-semibold text-left hover:bg-rose-100 transition"
              >
                Substituir lista atual
              </button>

              <button
                type="button"
                onClick={() => {
                  setImportModalOpen(false);
                  setPendingFileContent(null);
                }}
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
