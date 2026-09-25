/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Globe,
  Plus,
  Settings as SettingsIcon,
  Search,
  Star,
  ExternalLink,
  Folder,
  Layers,
  Sparkles,
  Smartphone,
  Share2,
  Trash2,
  Edit,
  ArrowUpDown,
  Laptop,
} from 'lucide-react';
import { AppSettings, Category, Site, SortOption, ThemeMode } from './types';
import {
  deleteSite,
  getAllCategories,
  getAllSites,
  getSettings,
  saveCategory,
  saveSettings,
  saveSite,
  seedSuggestedSites,
  updateSitesOrder,
} from './services/db';
import { SiteCard } from './components/SiteCard';
import { AddEditSiteModal } from './components/AddEditSiteModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { WebViewModal } from './components/WebViewModal';
import { CategoriesManagerModal } from './components/CategoriesManagerModal';
import { SettingsModal } from './components/SettingsModal';
import { WelcomeOnboardingModal } from './components/WelcomeOnboardingModal';
import { QuickAccessBar } from './components/QuickAccessBar';
import { SearchAndFilterBar } from './components/SearchAndFilterBar';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  const [sites, setSites] = useState<Site[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'system',
    sortOption: 'custom',
    hasSeenWelcome: false,
    defaultOpenMode: 'auto',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [deletingSite, setDeletingSite] = useState<Site | null>(null);
  const [activeViewerSite, setActiveViewerSite] = useState<Site | null>(null);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const [initialSharedUrl, setInitialSharedUrl] = useState('');

  // Drag and drop state for custom ordering
  const draggedItemId = useRef<string | null>(null);

  // Load Initial Data
  const loadData = async () => {
    try {
      const [storedSites, storedCategories, storedSettings] = await Promise.all([
        getAllSites(),
        getAllCategories(),
        getSettings(),
      ]);

      setSites(storedSites);
      setCategories(storedCategories);
      setSettings(storedSettings);

      // Check first-run onboarding
      if (!storedSettings.hasSeenWelcome && storedSites.length === 0) {
        setIsWelcomeModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to load local DB data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Check URL parameters for Web Share Target (Requirement #15)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sharedUrl = params.get('url') || params.get('text') || '';
      if (sharedUrl && (sharedUrl.startsWith('http') || sharedUrl.includes('.'))) {
        setInitialSharedUrl(sharedUrl);
        setIsAddModalOpen(true);
        // Clean URL to prevent re-opening on reload
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  // Theme Synchronizer
  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    if (settings.theme === 'dark') {
      applyTheme(true);
    } else if (settings.theme === 'light') {
      applyTheme(false);
    } else {
      // System mode
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mq.matches);

      const listener = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mq.addEventListener('change', listener);
      return () => mq.removeEventListener('change', listener);
    }
  }, [settings.theme]);

  // Handle Save (Add or Edit)
  const handleSaveSite = async (siteToSave: Site) => {
    await saveSite(siteToSave);
    await loadData();
  };

  // Handle Delete Confirmation
  const handleConfirmDelete = async (site: Site) => {
    await deleteSite(site.id);
    await loadData();
  };

  // Handle Toggle Favorite
  const handleToggleFavorite = async (site: Site) => {
    const updated: Site = {
      ...site,
      isFavorite: !site.isFavorite,
    };
    await saveSite(updated);
    setSites((prev) => prev.map((s) => (s.id === site.id ? updated : s)));
  };

  // Handle Open Site
  const handleOpenSite = (site: Site) => {
    if (site.openMode === 'browser') {
      window.open(site.url, '_blank', 'noopener,noreferrer');
      // Record visit silently
      saveSite({
        ...site,
        visitCount: (site.visitCount || 0) + 1,
        lastVisitedAt: Date.now(),
      }).then(() => loadData());
    } else {
      // Open in in-app mini browser
      setActiveViewerSite(site);
    }
  };

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    draggedItemId.current = id;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItemId.current || draggedItemId.current === targetId) return;

    const currentList = [...sites];
    const fromIndex = currentList.findIndex((s) => s.id === draggedItemId.current);
    const toIndex = currentList.findIndex((s) => s.id === targetId);

    if (fromIndex !== -1 && toIndex !== -1) {
      const [moved] = currentList.splice(fromIndex, 1);
      currentList.splice(toIndex, 0, moved);
      setSites(currentList);
    }
  };

  const handleDragEnd = async () => {
    if (!draggedItemId.current) return;
    draggedItemId.current = null;
    const ids = sites.map((s) => s.id);
    await updateSitesOrder(ids);
  };

  // Onboarding Actions
  const handleStartWithSuggestions = async () => {
    setIsLoading(true);
    await seedSuggestedSites();
    await saveSettings({ hasSeenWelcome: true });
    setIsWelcomeModalOpen(false);
    await loadData();
  };

  const handleStartEmpty = async () => {
    await saveSettings({ hasSeenWelcome: true });
    setIsWelcomeModalOpen(false);
    setIsAddModalOpen(true);
  };

  // Quick Access: Favorites and Recents
  const favoriteSites = useMemo(() => {
    return sites.filter((s) => s.isFavorite);
  }, [sites]);

  const recentSites = useMemo(() => {
    return [...sites]
      .filter((s) => s.lastVisitedAt && s.lastVisitedAt > 0)
      .sort((a, b) => (b.lastVisitedAt || 0) - (a.lastVisitedAt || 0))
      .slice(0, 8);
  }, [sites]);

  // Filtered & Sorted Sites for Main Grid
  const processedSites = useMemo(() => {
    let result = [...sites];

    // Category filter
    if (selectedCategory === 'favoritos') {
      result = result.filter((s) => s.isFavorite);
    } else if (selectedCategory !== 'all') {
      result = result.filter(
        (s) => s.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((s) => {
        return (
          s.name.toLowerCase().includes(q) ||
          s.url.toLowerCase().includes(q) ||
          s.domain.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
        );
      });
    }

    // Sorting
    switch (settings.sortOption) {
      case 'most-visited':
        result.sort((a, b) => (b.visitCount || 0) - (a.visitCount || 0));
        break;
      case 'recent-added':
        result.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'recent-visited':
        result.sort((a, b) => (b.lastVisitedAt || 0) - (a.lastVisitedAt || 0));
        break;
      case 'alpha-asc':
        result.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
        break;
      case 'alpha-desc':
        result.sort((a, b) => b.name.localeCompare(a.name, 'pt-BR'));
        break;
      case 'custom':
      default:
        result.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        break;
    }

    return result;
  }, [sites, selectedCategory, searchQuery, settings.sortOption]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center justify-between gap-4">
            {/* Logo & App Title */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
                  Meus Sites
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Todos os seus sites em um só lugar
                </p>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2">
              {/* PWA Install Button */}
              <PWAInstallButton variant="compact" />

              {/* Add Site Button */}
              <button
                type="button"
                onClick={() => {
                  setEditingSite(null);
                  setInitialSharedUrl('');
                  setIsAddModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-sm shadow-blue-500/25 transition"
                title="Adicionar site"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Adicionar site</span>
              </button>

              {/* Settings Button */}
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(true)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Configurações"
                aria-label="Configurações do aplicativo"
              >
                <SettingsIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container - Responsive Layout (Requirement #31) */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
          {/* Desktop Left Sidebar: Categories Navigation */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-20 space-y-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Categorias
                </h2>
                <button
                  onClick={() => setIsCategoriesModalOpen(true)}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Gerenciar
                </button>
              </div>

              <nav className="space-y-1">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    selectedCategory === 'all'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Layers className="w-4 h-4" /> Todos os sites
                  </span>
                  <span className="text-[10px] opacity-80">{sites.length}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCategory('favoritos')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    selectedCategory === 'favoritos'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-400" /> Favoritos
                  </span>
                  <span className="text-[10px] opacity-80">{favoriteSites.length}</span>
                </button>

                {categories
                  .filter((cat) => cat.name.toLowerCase() !== 'favoritos')
                  .map((cat) => {
                    const count = sites.filter(
                      (s) => s.category.toLowerCase() === cat.name.toLowerCase()
                    ).length;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.name)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                          selectedCategory === cat.name
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span>{cat.icon || '📁'}</span>
                          <span className="truncate">{cat.name}</span>
                        </span>
                        <span className="text-[10px] opacity-75">{count}</span>
                      </button>
                    );
                  })}
              </nav>
            </div>

            {/* Quick backup tip box */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-blue-950/30 border border-blue-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-300 mb-1">
                <Smartphone className="w-4 h-4" />
                <span>Aplicativo PWA</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                Instale este aplicativo na sua área de trabalho ou celular para acessar sem a barra do navegador.
              </p>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="lg:col-span-9 space-y-4">
            {/* Quick Access Bar (Favorites & Recents) */}
            <QuickAccessBar
              favoriteSites={favoriteSites}
              recentSites={recentSites}
              onOpenSite={handleOpenSite}
            />

            {/* Search and Filters */}
            <SearchAndFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
              categories={categories}
              sortOption={settings.sortOption}
              onSortChange={(opt) => {
                setSettings((prev) => ({ ...prev, sortOption: opt }));
                saveSettings({ sortOption: opt });
              }}
              totalSites={sites.length}
            />

            {/* Site Cards List / Grid */}
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                <div className="w-8 h-8 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-3" />
                <p className="text-xs">Carregando seus sites...</p>
              </div>
            ) : processedSites.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-3">
                {processedSites.map((site) => (
                  <SiteCard
                    key={site.id}
                    site={site}
                    onOpen={handleOpenSite}
                    onToggleFavorite={handleToggleFavorite}
                    onEdit={(s) => {
                      setEditingSite(s);
                      setIsAddModalOpen(true);
                    }}
                    onDelete={(s) => setDeletingSite(s)}
                    isDragEnabled={settings.sortOption === 'custom' && !searchQuery}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                  />
                ))}
              </div>
            ) : (
              /* Requirement #28: ESTADO SEM SITES */
              <div className="py-16 px-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-center shadow-xs">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3 shadow-inner">
                  <Globe className="w-8 h-8" />
                </div>

                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                  {searchQuery || selectedCategory !== 'all'
                    ? 'Nenhum site encontrado'
                    : 'Nenhum site cadastrado'}
                </h3>

                <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {searchQuery || selectedCategory !== 'all'
                    ? 'Tente ajustar os filtros ou a palavra-chave pesquisada.'
                    : 'Adicione seus sites favoritos para acessá-los rapidamente.'}
                </p>

                <div className="mt-5 flex items-center justify-center gap-3">
                  {searchQuery || selectedCategory !== 'all' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                      }}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      Limpar filtros
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSite(null);
                        setInitialSharedUrl('');
                        setIsAddModalOpen(true);
                      }}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/25 active:scale-95 transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Adicionar site</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Floating Action Button for Mobile Add Site */}
      <div className="fixed bottom-6 right-6 sm:hidden z-30">
        <button
          type="button"
          onClick={() => {
            setEditingSite(null);
            setInitialSharedUrl('');
            setIsAddModalOpen(true);
          }}
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-600/40 active:scale-90 transition-transform"
          aria-label="Adicionar site"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>

      {/* Obligatory Footer (Requirement #30) */}
      <footer className="mt-auto py-5 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            &copy; Alisson Salvador 2026
          </p>
          <p className="text-[11px] text-slate-400">
            Meus Sites • Hub Pessoal de Sites PWA • 100% Offline e Privado
          </p>
        </div>
      </footer>

      {/* Offline Status Toast */}
      <OfflineIndicator />

      {/* Modals */}
      <AddEditSiteModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingSite(null);
          setInitialSharedUrl('');
        }}
        onSave={handleSaveSite}
        onOpenSiteDirectly={handleOpenSite}
        categories={categories}
        onCategoryCreated={(newCat) => setCategories((prev) => [...prev, newCat])}
        initialSite={editingSite}
        initialUrl={initialSharedUrl}
      />

      <DeleteConfirmModal
        isOpen={!!deletingSite}
        site={deletingSite}
        onClose={() => setDeletingSite(null)}
        onConfirm={handleConfirmDelete}
      />

      <CategoriesManagerModal
        isOpen={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
        categories={categories}
        onCategoriesUpdated={setCategories}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSettingsChanged={setSettings}
        onOpenCategoriesManager={() => setIsCategoriesModalOpen(true)}
        onDataReloadNeeded={loadData}
      />

      <WelcomeOnboardingModal
        isOpen={isWelcomeModalOpen}
        onStartWithSuggestions={handleStartWithSuggestions}
        onStartEmpty={handleStartEmpty}
      />

      {/* In-app Mini-Browser / WebView Modal */}
      <WebViewModal
        site={activeViewerSite}
        onClose={() => setActiveViewerSite(null)}
        onSiteUpdated={(updated) => {
          setSites((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
          setActiveViewerSite(updated);
        }}
      />
    </div>
  );
}
