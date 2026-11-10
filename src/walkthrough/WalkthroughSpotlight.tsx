import React, { useMemo } from 'react';
import { TargetRect } from './types';

interface WalkthroughSpotlightProps {
  targetRect: TargetRect | null;
  onBackdropClick?: () => void;
}

const SPOTLIGHT_PADDING = 6;

export const WalkthroughSpotlight: React.FC<WalkthroughSpotlightProps> = ({
  targetRect,
  onBackdropClick
}) => {
  const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

  // Memoize padded cutout bounds
  const cutout = useMemo(() => {
    if (!targetRect) return null;
    const x = Math.max(0, targetRect.left - SPOTLIGHT_PADDING);
    const y = Math.max(0, targetRect.top - SPOTLIGHT_PADDING);
    const width = Math.min(windowWidth - x, targetRect.width + SPOTLIGHT_PADDING * 2);
    const height = Math.min(windowHeight - y, targetRect.height + SPOTLIGHT_PADDING * 2);

    return { x, y, width, height };
  }, [targetRect, windowWidth, windowHeight]);

  if (!cutout) {
    // Fullscreen backdrop when no target is specified
    return (
      <div 
        className="fixed inset-0 z-40 bg-zinc-950/80 backdrop-blur-[2px] pointer-events-auto transition-opacity duration-300"
        onClick={onBackdropClick}
        aria-hidden="true"
      />
    );
  }

  return (
    <div 
      className="fixed inset-0 z-40 pointer-events-none transition-opacity duration-300"
      aria-hidden="true"
    >
      {/* 4-Quadrant Non-Blocking Scrim: Leaves cutout 100% interactive */}
      {/* 1. Top scrim block */}
      <div
        className="absolute bg-zinc-950/80 backdrop-blur-[2px] pointer-events-auto transition-all duration-200"
        style={{
          top: 0,
          left: 0,
          right: 0,
          height: `${cutout.y}px`
        }}
        onClick={onBackdropClick}
      />

      {/* 2. Bottom scrim block */}
      <div
        className="absolute bg-zinc-950/80 backdrop-blur-[2px] pointer-events-auto transition-all duration-200"
        style={{
          top: `${cutout.y + cutout.height}px`,
          left: 0,
          right: 0,
          bottom: 0
        }}
        onClick={onBackdropClick}
      />

      {/* 3. Left scrim block */}
      <div
        className="absolute bg-zinc-950/80 backdrop-blur-[2px] pointer-events-auto transition-all duration-200"
        style={{
          top: `${cutout.y}px`,
          left: 0,
          width: `${cutout.x}px`,
          height: `${cutout.height}px`
        }}
        onClick={onBackdropClick}
      />

      {/* 4. Right scrim block */}
      <div
        className="absolute bg-zinc-950/80 backdrop-blur-[2px] pointer-events-auto transition-all duration-200"
        style={{
          top: `${cutout.y}px`,
          left: `${cutout.x + cutout.width}px`,
          right: 0,
          height: `${cutout.height}px`
        }}
        onClick={onBackdropClick}
      />

      {/* Active Focus Highlight Ring around the exact target cutout (pointer-events-none) */}
      <div
        className="absolute rounded-[14px] border-2 border-[#007BFF] pointer-events-none transition-all duration-200 animate-pulse motion-reduce:animate-none"
        style={{
          top: `${cutout.y}px`,
          left: `${cutout.x}px`,
          width: `${cutout.width}px`,
          height: `${cutout.height}px`,
          boxShadow: '0 0 0 2px rgba(0, 123, 255, 0.25), 0 0 24px rgba(0, 123, 255, 0.45)'
        }}
      />
    </div>
  );
};
