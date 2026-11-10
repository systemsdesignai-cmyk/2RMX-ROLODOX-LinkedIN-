import React, { useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { WalkthroughStep, WalkthroughSubAction, TooltipStyle, TooltipPlacement } from './types';

interface WalkthroughTooltipProps {
  step: WalkthroughStep;
  stepIndex: number;
  totalSteps: number;
  currentSubAction?: WalkthroughSubAction;
  currentSubActionIndex?: number;
  totalSubActions?: number;
  feedbackMessage?: string | null;
  targetNotFound?: boolean;
  tooltipStyle: TooltipStyle;
  placement: TooltipPlacement;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onFinish: () => void;
  onRetryTarget?: () => void;
  tooltipRef: React.RefObject<HTMLDivElement | null>;
}

export const WalkthroughTooltip: React.FC<WalkthroughTooltipProps> = ({
  step,
  stepIndex,
  totalSteps,
  currentSubAction,
  currentSubActionIndex = 0,
  totalSubActions = 0,
  feedbackMessage,
  targetNotFound = false,
  tooltipStyle,
  placement,
  onNext,
  onPrev,
  onSkip,
  onFinish,
  onRetryTarget,
  tooltipRef
}) => {
  const isFirst = stepIndex === 0 && currentSubActionIndex === 0;
  const isLast = stepIndex === totalSteps - 1 && (totalSubActions === 0 || currentSubActionIndex === totalSubActions - 1);
  const progressPercent = Math.round(((stepIndex + 1) / totalSteps) * 100);

  // Global Keyboard Listener: ArrowRight, Enter, ArrowLeft, Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is actively typing in a form input
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        if (e.key === 'Escape') {
          onSkip();
        }
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        if (isLast) {
          onFinish();
        } else {
          onNext();
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (!isFirst) {
          onPrev();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFirst, isLast, onNext, onPrev, onSkip, onFinish]);

  const titleId = `tour-step-title-${step.id}`;

  return (
    <div
      ref={tooltipRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed z-50 flex flex-col bg-zinc-900/98 text-zinc-100 rounded-2xl border border-zinc-700/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8),0_0_30px_rgba(0,123,255,0.2)] backdrop-blur-2xl transition-all duration-200 select-none overflow-hidden"
      style={{
        top: `${tooltipStyle.top}px`,
        left: `${tooltipStyle.left}px`,
        width: `${tooltipStyle.width}px`,
        maxWidth: `${tooltipStyle.maxWidth}px`,
        maxHeight: `${tooltipStyle.maxHeight}px`
      }}
    >
      {/* Top 2.5px Progress Line in Sexy Blue (#007BFF) */}
      <div className="w-full bg-zinc-800 h-[2.5px] shrink-0 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#007BFF] via-[#0091FF] to-[#38BDF8] transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Header: Section badge, Step Counter, Dismiss Button (≥44x44px hitbox) */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0 border-b border-zinc-800/80">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-1.5 h-1.5 rounded-full bg-[#007BFF] shrink-0" />
          <span className="text-[11px] font-semibold text-zinc-400 font-mono tracking-wider uppercase truncate">
            {step.section || 'Tour'}
          </span>
          <span className="text-[11px] text-zinc-600 font-mono">·</span>
          <span className="text-[11px] font-medium text-[#38BDF8] font-mono shrink-0">
            {stepIndex + 1} of {totalSteps}
          </span>
          {totalSubActions > 1 && (
            <span className="text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700/60 px-1.5 py-0.2 rounded font-mono hidden sm:inline">
              Step {currentSubActionIndex + 1}/{totalSubActions}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onSkip}
          className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800/60 transition-colors cursor-pointer active:scale-95"
          title="Dismiss walkthrough (Esc)"
          aria-label="Close walkthrough"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body: Natural word wrapping, scrollable if vertical space is constrained */}
      <div className="px-4 py-3 space-y-2.5 overflow-y-auto min-h-0 flex-1 overscroll-contain text-left">
        <div>
          <h3
            id={titleId}
            className="text-sm sm:text-base font-bold text-white tracking-tight leading-snug font-display"
          >
            {step.title}
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed mt-0.5">
            {step.purpose}
          </p>
        </div>

        {/* Live Active Directive (When subAction is present) */}
        {currentSubAction ? (
          <div className="p-3 bg-zinc-950/90 border border-[#007BFF]/40 rounded-xl space-y-1.5 shadow-inner">
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#38BDF8] uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#007BFF] animate-pulse" />
              <span>Next Action</span>
            </div>
            <p className="text-xs sm:text-[13px] font-semibold text-zinc-100 leading-snug">
              {currentSubAction.instruction}
            </p>
            {currentSubAction.actionPrompt && (
              <div className="text-[11px] text-[#7DD3FC] flex items-center gap-1.5 pt-0.5">
                <Sparkles className="w-3 h-3 text-[#38BDF8] shrink-0" />
                <span className="font-mono">{currentSubAction.actionPrompt}</span>
              </div>
            )}
          </div>
        ) : step.action ? (
          <div className="text-[11px] text-[#7DD3FC] bg-indigo-950/40 border border-indigo-900/40 px-3 py-2 rounded-xl flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#38BDF8] shrink-0 mt-0.5" />
            <span className="leading-tight">{step.action}</span>
          </div>
        ) : null}

        {/* Real-time Verification Positive Feedback */}
        {feedbackMessage && (
          <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-300 animate-fade-in shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* Recoverable Target Not Found Callout */}
        {targetNotFound && (
          <div className="p-2.5 bg-amber-950/40 border border-amber-600/40 rounded-xl flex items-start gap-2 text-[11px] text-amber-300">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>Target control not immediately visible. Tap Next to continue or retry.</span>
              {onRetryTarget && (
                <button
                  type="button"
                  onClick={onRetryTarget}
                  className="block mt-1 font-bold underline hover:text-white cursor-pointer"
                >
                  Retry searching target
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Pinned Footer Action Bar (shrink-0, all hitboxes ≥ 44x44px) */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-zinc-950/80 border-t border-zinc-800/80 shrink-0 gap-2">
        <button
          type="button"
          onClick={onSkip}
          className="min-h-[44px] px-3 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 rounded-xl hover:bg-zinc-900 transition-colors cursor-pointer active:scale-95"
        >
          Skip
        </button>

        <div className="flex items-center gap-1.5">
          {!isFirst && (
            <button
              type="button"
              onClick={onPrev}
              className="min-h-[44px] min-w-[44px] px-3 py-2 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-sm"
              title="Previous step (←)"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}

          {isLast ? (
            <button
              type="button"
              onClick={onFinish}
              className="min-h-[44px] px-4 py-2 text-xs font-bold text-white bg-[#007BFF] hover:bg-[#006ee6] active:bg-[#005ec4] rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-md shadow-[#007BFF]/25 border border-[#38BDF8]/30"
            >
              <span>Get Started</span>
              <Check className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onNext}
              className="min-h-[44px] px-4 py-2 text-xs font-bold text-white bg-[#007BFF] hover:bg-[#006ee6] active:bg-[#005ec4] rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-md shadow-[#007BFF]/25 border border-[#38BDF8]/30"
              title="Next step (→ or Enter)"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
