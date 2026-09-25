import React from 'react';
import { Star, Clock, Globe } from 'lucide-react';
import { Site } from '../types';

interface Props {
  favoriteSites: Site[];
  recentSites: Site[];
  onOpenSite: (site: Site) => void;
}

export const QuickAccessBar: React.FC<Props> = ({
  favoriteSites,
  recentSites,
  onOpenSite,
}) => {
  // If neither favorites nor recents exist, don't show the quick bar
  if (favoriteSites.length === 0 && recentSites.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3.5 mb-6" aria-label="Acesso Rápido">
      {/* ⭐ Favoritos / Acesso Rápido */}
      {favoriteSites.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span>Acesso Rápido</span>
            </h2>
            <span className="text-[11px] text-slate-400">
              {favoriteSites.length} {favoriteSites.length === 1 ? 'favorito' : 'favoritos'}
            </span>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar">
            {favoriteSites.map((site) => (
              <button
                key={site.id}
                type="button"
                onClick={() => onOpenSite(site)}
                className="group flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500/50 active:scale-95 transition shrink-0 max-w-[200px]"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                  {site.customIcon ? (
                    <span className="text-sm">{site.customIcon}</span>
                  ) : site.iconUrl ? (
                    <img
                      src={site.iconUrl}
                      alt=""
                      className="h-4 w-4 object-contain group-hover:scale-110 transition-transform"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <Globe className="w-4 h-4 text-blue-500" />
                  )}
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {site.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recentes */}
      {recentSites.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span>Acessados Recentemente</span>
            </h2>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {recentSites.map((site) => (
              <button
                key={site.id}
                type="button"
                onClick={() => onOpenSite(site)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100/80 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 text-xs font-medium text-slate-700 dark:text-slate-300 transition shrink-0"
              >
                {site.iconUrl && (
                  <img
                    src={site.iconUrl}
                    alt=""
                    className="w-3.5 h-3.5 object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                )}
                <span className="truncate max-w-[130px]">{site.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
