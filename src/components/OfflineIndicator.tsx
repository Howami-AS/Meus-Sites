import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto z-40 flex items-center gap-3 rounded-xl bg-amber-500/95 dark:bg-amber-600/95 backdrop-blur-md px-4 py-3 text-sm font-medium text-white shadow-xl ring-1 ring-white/20 animate-fade-in"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-black/15">
        <WifiOff className="h-4 w-4" />
      </span>
      <div className="flex-1 pr-2 text-xs sm:text-sm">
        <span className="font-semibold">Modo Offline</span>
        <p className="opacity-90 text-[11px] sm:text-xs">
          Sites e configurações continuam disponíveis pelo armazenamento local.
        </p>
      </div>
    </div>
  );
};
