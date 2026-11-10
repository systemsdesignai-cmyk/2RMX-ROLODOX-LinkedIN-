import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone, Share, PlusSquare, Check, X, Sparkles } from 'lucide-react';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'banner' | 'card';
  onInstalled?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'header',
  onInstalled
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already installed and running standalone, show nothing or a subtle badge if requested
  if (isInstalled) {
    if (variant === 'card') {
      return (
        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-900/40 px-3 py-2 rounded-xl font-mono">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Installed as Local WebApp</span>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      const success = await install();
      setIsInstalling(false);
      if (success && onInstalled) {
        onInstalled();
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // General instructions modal if browser doesn't dispatch beforeinstallprompt
      setShowIOSModal(true);
    }
  };

  return (
    <>
      {variant === 'header' && (
        <button
          id="pwa-install-header-btn"
          type="button"
          onClick={handleInstallClick}
          className={`
            relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
            bg-gradient-to-r from-[#007BFF] to-[#00D2FF] text-white shadow-sm hover:opacity-95
            transition-all duration-150 active:scale-95 cursor-pointer shrink-0 border border-white/10
            ${className}
          `}
          title="Save app to home screen or desktop"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Install WebApp</span>
          <span className="sm:hidden">Install</span>
        </button>
      )}

      {variant === 'banner' && (
        <div className={`p-4 rounded-2xl bg-zinc-900/90 border border-blue-500/30 shadow-xl flex items-center justify-between gap-4 ${className}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Save to Your Device</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-mono">PWA</span>
              </h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Install as a standalone webapp for full offline access, zero browser bars, and fast local launching.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleInstallClick}
            disabled={isInstalling}
            className="px-4 py-2 rounded-xl bg-[#007BFF] hover:bg-[#007BFF]/90 text-white text-xs font-bold transition-all shrink-0 active:scale-95 flex items-center gap-1.5 shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            {isInstalling ? 'Installing...' : 'Install Now'}
          </button>
        </div>
      )}

      {/* iOS & Browser Installation Modal */}
      {showIOSModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowIOSModal(false)}
        >
          <div 
            className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl text-left space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Save as WebApp</h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300">
              {isIOS
                ? 'Follow these 2 quick steps in Safari to add Remix Rolodox directly to your iPhone or iPad home screen:'
                : 'Save this app to your device home screen or desktop to use offline without browser bars:'}
            </p>

            <div className="space-y-3 bg-zinc-950/70 p-3.5 rounded-xl border border-zinc-800/80 text-xs">
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </span>
                <div>
                  <p className="text-zinc-200 font-medium flex items-center gap-1.5">
                    Tap the <strong>Share</strong> button <Share className="w-3.5 h-3.5 text-blue-400 inline" />
                  </p>
                  <p className="text-[11px] text-zinc-500">Located at the bottom of Safari on iPhone or top-right on iPad.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </span>
                <div>
                  <p className="text-zinc-200 font-medium flex items-center gap-1.5">
                    Select <strong>"Add to Home Screen"</strong> <PlusSquare className="w-3.5 h-3.5 text-blue-400 inline" />
                  </p>
                  <p className="text-[11px] text-zinc-500">Scroll down the menu list and tap "Add to Home Screen".</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  3
                </span>
                <div>
                  <p className="text-zinc-200 font-medium">Tap <strong>Add</strong> in the top-right</p>
                  <p className="text-[11px] text-zinc-500">The app icon will immediately appear on your home screen.</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-semibold transition-all active:scale-95"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
