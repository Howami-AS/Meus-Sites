import React, { useState } from 'react';
import {
  Star,
  ExternalLink,
  MoreVertical,
  Edit2,
  Trash2,
  Share2,
  Globe,
  GripVertical,
} from 'lucide-react';
import { Site } from '../types';

interface Props {
  site: Site;
  onOpen: (site: Site) => void;
  onToggleFavorite: (site: Site) => void;
  onEdit: (site: Site) => void;
  onDelete: (site: Site) => void;
  isDragEnabled?: boolean;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onDragOver?: (e: React.DragEvent, id: string) => void;
  onDragEnd?: () => void;
}

export const SiteCard: React.FC<Props> = ({
  site,
  onOpen,
  onToggleFavorite,
  onEdit,
  onDelete,
  isDragEnabled,
  onDragStart,
  onDragOver,
  onDragEnd,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    // If clicked on buttons or menu, don't trigger open
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.action-menu')) {
      return;
    }
    onOpen(site);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (navigator.share) {
      try {
        await navigator.share({
          title: site.name,
          url: site.url,
        });
      } catch {
        // Ignored
      }
    } else {
      await navigator.clipboard.writeText(site.url);
      alert('Link copiado para a área de transferência!');
    }
  };

  const handleOpenBrowserDirect = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    window.open(site.url, '_blank', 'noopener,noreferrer');
  };

  // First letter avatar for fallback
  const initial = (site.name || site.domain || 'S').charAt(0).toUpperCase();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onOpen(site);
        }
      }}
      draggable={isDragEnabled}
      onDragStart={(e) => onDragStart && onDragStart(e, site.id)}
      onDragOver={(e) => onDragOver && onDragOver(e, site.id)}
      onDragEnd={onDragEnd}
      className={`group relative flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500/50 active:scale-[0.99] transition-all cursor-pointer select-none text-left ${
        isDragEnabled ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
        {/* Drag handle if custom sort */}
        {isDragEnabled && (
          <div
            className="text-slate-300 dark:text-slate-600 hover:text-slate-500 cursor-grab shrink-0 p-1"
            title="Arraste para reordenar"
          >
            <GripVertical className="w-4 h-4" />
          </div>
        )}

        {/* Favicon / Icon */}
        <div className="relative flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shadow-inner overflow-hidden">
          {site.customIcon ? (
            <span className="text-xl sm:text-2xl">{site.customIcon}</span>
          ) : site.iconUrl && !imageError ? (
            <img
              src={site.iconUrl}
              alt=""
              loading="lazy"
              onError={() => setImageError(true)}
              className="h-6 w-6 sm:h-7 sm:w-7 object-contain transition-transform group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold text-base sm:text-lg">
              {initial}
            </div>
          )}
        </div>

        {/* Site Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
              {site.name}
            </h3>
            {site.isFavorite && (
              <span title="Favorito">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 shrink-0" />
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="truncate font-mono text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
              {site.domain}
            </span>

            {site.category && (
              <>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="inline-block max-w-[100px] truncate px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                  {site.category}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right Quick Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Favorite toggle button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(site);
          }}
          className={`p-2 rounded-xl transition ${
            site.isFavorite
              ? 'text-amber-500 hover:text-amber-600 bg-amber-50 dark:bg-amber-950/40'
              : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title={site.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          aria-label="Favoritar"
        >
          <Star
            className={`w-4 h-4 ${site.isFavorite ? 'fill-amber-400 text-amber-500' : ''}`}
          />
        </button>

        {/* 3-dots Menu Button */}
        <div className="relative action-menu">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Mais opções"
            aria-label="Opções do site"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Context Dropdown Menu */}
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                }}
              />
              <div
                className="absolute right-0 top-full mt-1.5 z-30 w-44 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl py-1 text-xs text-slate-700 dark:text-slate-200 animate-fade-in"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={handleOpenBrowserDirect}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-left font-medium transition"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                  Abrir no navegador
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onEdit(site);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-left font-medium transition"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                  Editar site
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-left font-medium transition"
                >
                  <Share2 className="w-3.5 h-3.5 text-slate-500" />
                  Compartilhar
                </button>

                <div className="my-1 border-t border-slate-100 dark:border-slate-700" />

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onDelete(site);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-left font-semibold transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Excluir site
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
