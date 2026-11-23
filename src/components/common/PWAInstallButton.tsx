import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="flex items-center gap-1.5 rounded-lg border border-[#795548]/40 bg-[#F7F5F2] dark:bg-[#1E1E1E] px-3 py-1.5 text-xs font-bold text-[#292929] dark:text-[#F2C94C] hover:border-[#B83232] transition-colors whitespace-nowrap"
        title="Install MCA Portal for offline study"
      >
        <Download className="w-3.5 h-3.5 text-[#B83232] dark:text-[#F2C94C]" />
        <span className="hidden sm:inline">Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-lg border border-[#795548]/40 bg-[#F7F5F2] dark:bg-[#1E1E1E] px-2.5 py-1.5 text-xs font-bold text-[#292929] dark:text-[#F2C94C] hover:border-[#B83232] transition-colors whitespace-nowrap"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#B83232] dark:text-[#F2C94C]" />
          <span className="hidden sm:inline">Offline App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#292929] border border-[#E5DFD9] dark:border-[#3D3835] p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-[#292929] dark:text-white">
                  Install MCA Portal on iOS
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-[#6E6863] hover:text-[#292929] dark:hover:text-white"
                  aria-label="Close install instructions"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs leading-relaxed text-[#6E6863] dark:text-[#BDB7B2]">
                1. Tap the <strong>Share</strong> button in your Safari toolbar.
                <br />
                2. Scroll down and tap <strong>Add to Home Screen</strong> to access your cached study notes and flashcard decks offline.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl bg-[#B83232] py-2 text-xs font-bold text-white hover:bg-[#9E2A2A]"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
