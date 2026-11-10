import React from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { WifiOff, Database } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-500/95 text-black px-3.5 py-2 text-xs font-semibold shadow-2xl backdrop-blur-md border border-amber-400/40 animate-slide-in-up">
      <div className="w-2 h-2 rounded-full bg-black animate-ping" />
      <WifiOff className="w-4 h-4 shrink-0" />
      <span className="font-mono">Offline Mode — Cached local data active</span>
    </div>
  );
};
