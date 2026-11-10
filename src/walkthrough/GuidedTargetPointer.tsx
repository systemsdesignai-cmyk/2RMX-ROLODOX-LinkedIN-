import React from 'react';
import { TargetRect, TooltipPlacement } from './types';

interface GuidedTargetPointerProps {
  targetRect: TargetRect | null;
  placement: TooltipPlacement;
  visible?: boolean;
  actionPrompt?: string;
}

export const GuidedTargetPointer: React.FC<GuidedTargetPointerProps> = ({
  targetRect,
  placement,
  visible = true,
  actionPrompt
}) => {
  if (!visible || !targetRect || placement === 'center') {
    return null;
  }

  // Target element center calculations
  const targetCenterX = Math.round(targetRect.left + targetRect.width / 2);
  const targetCenterY = Math.round(targetRect.top + targetRect.height / 2);

  // Position the pointer indicator near the edge facing the tooltip
  let pointerX = targetCenterX;
  let pointerY = targetCenterY;
  let arrowRotation = 0; // 0 deg = pointing UP
  let translateClass = '';

  if (placement === 'bottom') {
    // Tooltip is below -> Pointer points UP to target bottom edge
    pointerX = targetCenterX;
    pointerY = targetRect.bottom + 6;
    arrowRotation = 0;
    translateClass = '-translate-x-1/2';
  } else if (placement === 'top') {
    // Tooltip is above -> Pointer points DOWN to target top edge
    pointerX = targetCenterX;
    pointerY = targetRect.top - 6;
    arrowRotation = 180;
    translateClass = '-translate-x-1/2 -translate-y-full';
  } else if (placement === 'right') {
    // Tooltip is right -> Pointer points LEFT to target right edge
    pointerX = targetRect.right + 6;
    pointerY = targetCenterY;
    arrowRotation = 270;
    translateClass = '-translate-y-1/2';
  } else if (placement === 'left') {
    // Tooltip is left -> Pointer points RIGHT to target left edge
    pointerX = targetRect.left - 6;
    pointerY = targetCenterY;
    arrowRotation = 90;
    translateClass = '-translate-x-full -translate-y-1/2';
  }

  return (
    <div
      className="fixed z-50 pointer-events-none transition-all duration-300 ease-out"
      style={{
        left: `${pointerX}px`,
        top: `${pointerY}px`
      }}
      aria-hidden="true"
    >
      <div className={`relative flex flex-col items-center ${translateClass}`}>
        {/* Radar Ping Beacon at target edge */}
        <div className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-[#007BFF] shadow-[0_0_12px_#007BFF]">
          <span className="absolute inset-0 rounded-full bg-[#38BDF8] opacity-75 animate-ping motion-reduce:animate-none" />
        </div>

        {/* Directional Arrow Badge */}
        <div 
          className="flex items-center justify-center filter drop-shadow-[0_4px_12px_rgba(0,123,255,0.5)] transition-transform duration-200"
          style={{ transform: `rotate(${arrowRotation}deg)` }}
        >
          <svg 
            width="26" 
            height="26" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="animate-bounce motion-reduce:animate-none"
          >
            {/* Elegant Arrow Head pointing UP (rotated by arrowRotation) */}
            <path 
              d="M12 3L4 13H9V21H15V13H20L12 3Z" 
              fill="url(#pointer-electric-gradient)" 
              stroke="#B0E0E6" 
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="pointer-electric-gradient" x1="4" y1="3" x2="20" y2="21" gradientUnits="userSpaceOnUse">
                <stop stopColor="#007BFF" />
                <stop offset="0.6" stopColor="#0091FF" />
                <stop offset="1" stopColor="#38BDF8" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Optional Micro Action Pill */}
        {actionPrompt && (
          <div className="mt-1 px-2.5 py-0.5 rounded-full bg-zinc-950/95 border border-[#007BFF]/60 text-[10px] font-mono font-bold text-[#7DD3FC] shadow-lg whitespace-nowrap">
            {actionPrompt}
          </div>
        )}
      </div>
    </div>
  );
};
