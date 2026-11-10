import React from 'react';
import { 
  HelpCircle, X, Play, RotateCcw, Compass, Clock, Target, 
  Keyboard, CheckCircle2, ChevronRight, ShieldCheck, UserPlus
} from 'lucide-react';
import { TourType } from './types';

interface WalkthroughHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTour: (type: TourType) => void;
  onResetOnboarding: () => void;
  hasCompleted: boolean;
  hasDismissed: boolean;
}

export const WalkthroughHelpModal: React.FC<WalkthroughHelpModalProps> = ({
  isOpen,
  onClose,
  onStartTour,
  onResetOnboarding,
  hasCompleted,
  hasDismissed
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
    >
      <div 
        className="bg-zinc-900 border border-zinc-700/80 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden text-zinc-100 flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#007BFF]/15 border border-[#007BFF]/30 text-[#38BDF8] rounded-xl">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 id="help-modal-title" className="text-base font-bold text-white font-display">
                Interactive Guided Tours
              </h2>
              <p className="text-[11px] text-zinc-400">
                Explore features, replay walkthroughs, or reset onboarding
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close Help Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Status Indicator */}
          <div className="flex items-center justify-between bg-zinc-950/60 border border-zinc-800/80 px-4 py-3 rounded-2xl">
            <span className="text-xs text-zinc-400 font-mono">Onboarding Status</span>
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              {hasCompleted ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                </span>
              ) : hasDismissed ? (
                <span className="text-amber-400">Dismissed</span>
              ) : (
                <span className="text-[#38BDF8]">Ready</span>
              )}
            </div>
          </div>

          {/* Tour Options List */}
          <div className="space-y-2.5">
            <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
              Available Walkthroughs
            </h3>

            {/* Tour Option 1: Full Product Tour */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onStartTour('full');
              }}
              className="w-full text-left p-3.5 bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 hover:border-[#007BFF]/50 rounded-2xl transition-all flex items-center justify-between group cursor-pointer active:scale-[0.99] shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#007BFF]/15 border border-[#007BFF]/30 flex items-center justify-center text-[#38BDF8] group-hover:scale-105 transition-transform shrink-0">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white group-hover:text-[#38BDF8] transition-colors">
                    Full Product Tour
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Complete 7-step guide covering Directory, Events, Strategy & Topology.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors shrink-0 ml-2" />
            </button>

            {/* Tour Option: Interactive Contact Creation Exercise */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onStartTour('create-contact');
              }}
              className="w-full text-left p-3.5 bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 hover:border-[#007BFF]/50 rounded-2xl transition-all flex items-center justify-between group cursor-pointer active:scale-[0.99] shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
                    Interactive Contact Creation
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Hands-on guided practice: tap tabs, open form, type name, and save.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors shrink-0 ml-2" />
            </button>

            {/* Tour Option 2: Relationship Maintenance Tour */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onStartTour('maintenance');
              }}
              className="w-full text-left p-3.5 bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 hover:border-[#007BFF]/50 rounded-2xl transition-all flex items-center justify-between group cursor-pointer active:scale-[0.99] shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
                    Relationship Cadence Tour
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Quick 3-step focus on tracking outreach cadence and logging notes.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors shrink-0 ml-2" />
            </button>

            {/* Tour Option 3: Strategy Pathways Tour */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onStartTour('strategy');
              }}
              className="w-full text-left p-3.5 bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 hover:border-[#007BFF]/50 rounded-2xl transition-all flex items-center justify-between group cursor-pointer active:scale-[0.99] shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform shrink-0">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors">
                    Warm Intro Pathways Tour
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    How to architect multi-hop introduction chains to high-value targets.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors shrink-0 ml-2" />
            </button>
          </div>

          {/* Keyboard Shortcuts Guide */}
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
              <Keyboard className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Keyboard Navigation During Walkthrough</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-zinc-400 pt-1">
              <div className="flex items-center justify-between bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-zinc-800">
                <span>Next Step</span>
                <span className="text-white bg-zinc-800 px-1.5 py-0.5 rounded font-bold">→ or Enter</span>
              </div>
              <div className="flex items-center justify-between bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-zinc-800">
                <span>Previous Step</span>
                <span className="text-white bg-zinc-800 px-1.5 py-0.5 rounded font-bold">←</span>
              </div>
              <div className="flex items-center justify-between bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-zinc-800 col-span-2">
                <span>Dismiss / Skip Tour</span>
                <span className="text-white bg-zinc-800 px-1.5 py-0.5 rounded font-bold">Escape</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer: Reset Onboarding */}
        <div className="p-4 bg-zinc-950/90 border-t border-zinc-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onResetOnboarding();
              onClose();
            }}
            className="min-h-[44px] px-3.5 py-2 text-xs font-medium text-zinc-400 hover:text-amber-300 hover:bg-zinc-900 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Reset tour state to experience first-time onboarding"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Tour Progress</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-5 py-2 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-all cursor-pointer active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
