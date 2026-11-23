import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { usePortal } from '../../context/PortalContext';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { offlineCacheStats } = usePortal();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-[#292929] border border-[#F2C94C]/70 px-3.5 py-2 text-xs font-semibold text-white shadow-2xl print:hidden"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#B83232] text-[#F2C94C] shrink-0">
        <WifiOff className="w-3.5 h-3.5" />
      </span>
      <div>
        <div className="font-bold text-[#F2C94C]">Offline Mode Active</div>
        <div className="text-[11px] text-[#D7CCC8]">
          {offlineCacheStats.cachedNotesCount} notes &amp; {offlineCacheStats.cachedDecksCount} flashcard decks cached locally
        </div>
      </div>
    </div>
  );
};
