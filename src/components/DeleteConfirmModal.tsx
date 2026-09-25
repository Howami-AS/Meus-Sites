import React from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { Site } from '../types';

interface Props {
  site: Site | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (site: Site) => void;
}

export const DeleteConfirmModal: React.FC<Props> = ({
  site,
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !site) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Excluir este site?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Esta ação removerá o atalho da sua lista.
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
            {site.name}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate mt-0.5">
            {site.url}
          </p>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm(site);
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md active:scale-95 transition"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
};
