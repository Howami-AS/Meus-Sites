import React, { useState, useEffect } from 'react';
import {
  X,
  Globe,
  Star,
  Plus,
  ExternalLink,
  Check,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Category, Site } from '../types';
import {
  extractDomain,
  getFaviconUrl,
  normalizeUrl,
  suggestNameFromUrl,
} from '../utils/url';
import { findSiteByUrl, saveCategory } from '../services/db';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (site: Site) => void;
  onOpenSiteDirectly?: (site: Site) => void;
  categories: Category[];
  onCategoryCreated?: (cat: Category) => void;
  initialSite?: Site | null;
  initialUrl?: string; // from Web Share Target or paste
}

export const AddEditSiteModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  onOpenSiteDirectly,
  categories,
  onCategoryCreated,
  initialSite,
  initialUrl = '',
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('Outros');
  const [isFavorite, setIsFavorite] = useState(false);
  const [customIcon, setCustomIcon] = useState('');
  const [openMode, setOpenMode] = useState<'auto' | 'browser'>('auto');

  // Duplicate warning state
  const [duplicateSite, setDuplicateSite] = useState<Site | null>(null);

  // New category creation inline
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    if (initialSite) {
      setName(initialSite.name);
      setUrl(initialSite.url);
      setCategory(initialSite.category || 'Outros');
      setIsFavorite(!!initialSite.isFavorite);
      setCustomIcon(initialSite.customIcon || '');
      setOpenMode(initialSite.openMode === 'browser' ? 'browser' : 'auto');
      setDuplicateSite(null);
      setErrorMessage('');
    } else {
      const startUrl = initialUrl ? normalizeUrl(initialUrl) : '';
      setUrl(startUrl);
      setName(startUrl ? suggestNameFromUrl(startUrl) : '');
      setCategory('Outros');
      setIsFavorite(false);
      setCustomIcon('');
      setOpenMode('auto');
      setDuplicateSite(null);
      setErrorMessage('');
    }
  }, [isOpen, initialSite, initialUrl]);

  if (!isOpen) return null;

  const handleUrlBlur = () => {
    if (!url.trim()) return;
    const formatted = normalizeUrl(url);
    setUrl(formatted);

    // Auto-fill name if empty
    if (!name.trim()) {
      const suggested = suggestNameFromUrl(formatted);
      if (suggested) setName(suggested);
    }
  };

  const handleCreateNewCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newCat: Category = {
      id: 'cat-' + Math.random().toString(36).substring(2, 9),
      name: newCatName.trim(),
      icon: '📁',
      color: 'blue',
      isDefault: false,
      order: categories.length + 1,
    };

    await saveCategory(newCat);
    if (onCategoryCreated) onCategoryCreated(newCat);
    setCategory(newCat.name);
    setNewCatName('');
    setIsCreatingCategory(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setDuplicateSite(null);

    const formattedUrl = normalizeUrl(url);
    if (!formattedUrl) {
      setErrorMessage('Por favor, informe a URL do site.');
      return;
    }

    try {
      new URL(formattedUrl);
    } catch {
      setErrorMessage('Endereço inválido. Exemplo: https://youtube.com');
      return;
    }

    const finalName = name.trim() || suggestNameFromUrl(formattedUrl) || extractDomain(formattedUrl);
    const domain = extractDomain(formattedUrl);

    // Check duplicate URL
    const existing = await findSiteByUrl(formattedUrl, initialSite?.id);
    if (existing) {
      setDuplicateSite(existing);
      return;
    }

    const favicon = getFaviconUrl(formattedUrl);

    const siteToSave: Site = {
      id: initialSite?.id || 'site-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      name: finalName,
      url: formattedUrl,
      domain,
      category,
      isFavorite,
      isPinned: initialSite?.isPinned ?? isFavorite,
      iconUrl: favicon,
      customIcon: customIcon.trim() || undefined,
      order: initialSite?.order ?? Date.now(),
      visitCount: initialSite?.visitCount || 0,
      createdAt: initialSite?.createdAt || Date.now(),
      lastVisitedAt: initialSite?.lastVisitedAt,
      openMode,
    };

    onSave(siteToSave);
    onClose();
  };

  const currentFavicon = url ? getFaviconUrl(url) : '';

  return (
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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg">
                {initialSite ? 'Editar Site' : 'Adicionar Novo Site'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {initialSite ? 'Atualize as informações do seu atalho' : 'Cadastre um atalho para seu hub'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Duplicate Site Notice (Requirement #26) */}
        {duplicateSite && (
          <div className="mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 animate-fade-in">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-bold text-sm text-amber-900 dark:text-amber-200">
                  Este site já está cadastrado.
                </h4>
                <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                  Já existe um atalho para <strong>{duplicateSite.name}</strong> ({duplicateSite.url}).
                </p>
                <div className="mt-3 flex items-center gap-2">
                  {onOpenSiteDirectly && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenSiteDirectly(duplicateSite);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Abrir site
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDuplicateSite(null)}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 overflow-y-auto flex-1 pr-1">
          {/* URL Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              URL do site <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={handleUrlBlur}
                placeholder="ex: youtube.com ou https://exemplo.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Digite o endereço. Se omitir <span className="font-mono">https://</span>, será adicionado automaticamente.
            </p>
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Nome do site
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex: YouTube"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
              {url && (
                <button
                  type="button"
                  onClick={() => setName(suggestNameFromUrl(url))}
                  title="Sugerir nome pelo endereço"
                  className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  Auto
                </button>
              )}
            </div>
          </div>

          {/* Category Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Categoria
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                {isCreatingCategory ? 'Cancelar nova' : 'Nova categoria'}
              </button>
            </div>

            {isCreatingCategory ? (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 mb-2 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nome da categoria (ex: Finanças)"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCreateNewCategory}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
                >
                  Criar
                </button>
              </div>
            ) : (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.icon || '📁'} {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Favicon & Custom Icon Preview */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
              {customIcon ? (
                <span className="text-xl">{customIcon}</span>
              ) : currentFavicon ? (
                <img
                  src={currentFavicon}
                  alt="Favicon preview"
                  className="w-7 h-7 object-contain"
                  onError={(e) => {
                    // Fallback to initial
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <Globe className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <div className="flex-1">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ícone do site
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                Favicon obtido automaticamente pelo domínio. Opcionalmente use um emoji:
              </p>
              <input
                type="text"
                placeholder="Emoji ou símbolo customizado (opcional)"
                value={customIcon}
                onChange={(e) => setCustomIcon(e.target.value)}
                maxLength={4}
                className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Options: Favorite & Open Mode */}
          <div className="space-y-3 pt-1">
            {/* ⭐ Adicionar aos favoritos */}
            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 cursor-pointer select-none transition hover:bg-slate-100 dark:hover:bg-slate-800">
              <input
                type="checkbox"
                checked={isFavorite}
                onChange={(e) => setIsFavorite(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <div className="flex items-center gap-2">
                <Star
                  className={`w-4 h-4 ${
                    isFavorite
                      ? 'fill-amber-400 text-amber-500'
                      : 'text-slate-400'
                  }`}
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Adicionar aos favoritos (Acesso Rápido)
                </span>
              </div>
            </label>

            {/* Abertura do site */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Forma de abertura
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setOpenMode('auto')}
                  className={`py-2 px-3 rounded-lg border text-left font-medium transition ${
                    openMode === 'auto'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  ⚡ Tentar no App
                </button>
                <button
                  type="button"
                  onClick={() => setOpenMode('browser')}
                  className={`py-2 px-3 rounded-lg border text-left font-medium transition ${
                    openMode === 'browser'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  ↗ Direto no Navegador
                </button>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md active:scale-95 transition"
            >
              {initialSite ? 'Salvar alterações' : 'Adicionar site'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
