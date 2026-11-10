import React, { useState, useEffect, useCallback, useRef, RefObject } from 'react';
import { TargetRect, TooltipStyle, TooltipPlacement, PositionResult, PointerCoordinates } from './types';
import { resolveTargetElement } from './targetRegistry';

interface UseWalkthroughPositionOptions {
  targetId?: string;
  tooltipRef: RefObject<HTMLDivElement | null>;
  isActive: boolean;
  stepIndex: number;
  subActionIndex?: number;
}

const SCREEN_MARGIN = 16;
const TARGET_GAP = 14;

export function useWalkthroughPosition({
  targetId,
  tooltipRef,
  isActive,
  stepIndex,
  subActionIndex = 0
}: UseWalkthroughPositionOptions): PositionResult {
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [placement, setPlacement] = useState<TooltipPlacement>('center');
  const [pointerCoords, setPointerCoords] = useState<PointerCoordinates | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<TooltipStyle>({
    position: 'fixed',
    top: 100,
    left: SCREEN_MARGIN,
    width: 320,
    maxWidth: 320,
    maxHeight: 400
  });
  const [isReady, setIsReady] = useState(false);
  const [targetNotFound, setTargetNotFound] = useState(false);
  const pollIntervalRef = useRef<number | null>(null);

  // Core positioning and collision detection calculator
  const updatePosition = useCallback(() => {
    if (!isActive) return;

    // Viewport dimensions (using visualViewport when available for high mobile fidelity)
    const vv = window.visualViewport;
    const viewportWidth = vv ? Math.round(vv.width) : window.innerWidth;
    const viewportHeight = vv ? Math.round(vv.height) : window.innerHeight;

    const isMobile = viewportWidth < 640;
    const computedWidth = isMobile
      ? Math.min(320, viewportWidth - SCREEN_MARGIN * 2)
      : Math.min(380, viewportWidth - SCREEN_MARGIN * 2);
    const computedMaxWidth = isMobile ? viewportWidth - SCREEN_MARGIN * 2 : 420;

    // Measure existing tooltip DOM height if available
    const measuredHeight = tooltipRef.current ? tooltipRef.current.offsetHeight : 220;

    // Helper: calculate centered fallback coordinates
    const getCenteredStyle = (): { style: TooltipStyle; placement: TooltipPlacement } => {
      const top = Math.round(Math.max(SCREEN_MARGIN, (viewportHeight - measuredHeight) / 2));
      const left = Math.round(Math.max(SCREEN_MARGIN, (viewportWidth - computedWidth) / 2));
      const maxHeight = Math.max(140, viewportHeight - SCREEN_MARGIN * 2);

      return {
        style: {
          position: 'fixed',
          top,
          left,
          width: computedWidth,
          maxWidth: computedMaxWidth,
          maxHeight
        },
        placement: 'center'
      };
    };

    if (!targetId) {
      // Step has no target element -> Render viewport-centered
      const { style, placement: p } = getCenteredStyle();
      setTargetRect(null);
      setPointerCoords(null);
      setTooltipStyle(style);
      setPlacement(p);
      setTargetNotFound(false);
      setIsReady(true);
      return;
    }

    // Resolve target element through target registry
    const targetEl = resolveTargetElement(targetId);
    if (!targetEl) {
      // Element not yet found or off-DOM
      const { style, placement: p } = getCenteredStyle();
      setTooltipStyle(style);
      setPlacement(p);
      return;
    }

    const domRect = targetEl.getBoundingClientRect();

    // Verify target element has non-zero geometry
    if (domRect.width === 0 && domRect.height === 0) {
      const { style, placement: p } = getCenteredStyle();
      setTooltipStyle(style);
      setPlacement(p);
      return;
    }

    const rect: TargetRect = {
      top: domRect.top,
      left: domRect.left,
      width: domRect.width,
      height: domRect.height,
      right: domRect.right,
      bottom: domRect.bottom
    };
    setTargetRect(rect);
    setTargetNotFound(false);

    // FLIP & SHIFT COLLISION DETECTION ENGINE
    const spaceAbove = rect.top - SCREEN_MARGIN;
    const spaceBelow = viewportHeight - rect.bottom - SCREEN_MARGIN;
    const requiredSpace = measuredHeight + TARGET_GAP;

    let chosenPlacement: TooltipPlacement = 'bottom';
    let top = 0;
    let maxHeight = 300;

    // Prefer bottom placement if there is adequate space below
    if (spaceBelow >= requiredSpace) {
      chosenPlacement = 'bottom';
      top = Math.round(rect.bottom + TARGET_GAP);
      maxHeight = Math.max(120, viewportHeight - top - SCREEN_MARGIN);
    } else if (spaceAbove >= requiredSpace) {
      // Flip to top if bottom is tight and top has room
      chosenPlacement = 'top';
      top = Math.round(rect.top - TARGET_GAP - measuredHeight);
      maxHeight = Math.max(120, rect.top - TARGET_GAP - SCREEN_MARGIN);
      if (top < SCREEN_MARGIN) {
        top = SCREEN_MARGIN;
      }
    } else {
      // Both sides are constrained: choose side with greater clearance
      if (spaceBelow >= spaceAbove) {
        chosenPlacement = 'bottom';
        top = Math.round(rect.bottom + TARGET_GAP);
        maxHeight = Math.max(120, spaceBelow - TARGET_GAP);
      } else {
        chosenPlacement = 'top';
        maxHeight = Math.max(120, spaceAbove - TARGET_GAP);
        top = Math.round(Math.max(SCREEN_MARGIN, rect.top - TARGET_GAP - maxHeight));
      }
    }

    // Horizontal centering relative to target element with strict clamp
    const targetCenterX = rect.left + rect.width / 2;
    const desiredLeft = targetCenterX - computedWidth / 2;
    const minLeft = SCREEN_MARGIN;
    const maxLeft = viewportWidth - computedWidth - SCREEN_MARGIN;
    const left = Math.round(Math.max(minLeft, Math.min(maxLeft, desiredLeft)));

    // Directional pointer coordinate calculations
    const targetEdgeX = Math.round(targetCenterX);
    let targetEdgeY = Math.round(rect.bottom);
    let pointerDir: 'up' | 'down' | 'left' | 'right' = 'up';

    if (chosenPlacement === 'bottom') {
      pointerDir = 'up';
      targetEdgeY = Math.round(rect.bottom);
    } else if (chosenPlacement === 'top') {
      pointerDir = 'down';
      targetEdgeY = Math.round(rect.top);
    }

    setPointerCoords({
      x: targetEdgeX,
      y: targetEdgeY,
      targetEdgeX,
      targetEdgeY,
      direction: pointerDir,
      visible: true
    });

    setTooltipStyle({
      position: 'fixed',
      top,
      left,
      width: computedWidth,
      maxWidth: computedMaxWidth,
      maxHeight
    });
    setPlacement(chosenPlacement);
    setIsReady(true);
  }, [isActive, targetId, tooltipRef]);

  // Asynchronous target polling and smooth scroll into view
  useEffect(() => {
    if (!isActive) {
      setIsReady(false);
      setTargetNotFound(false);
      return;
    }

    if (pollIntervalRef.current) {
      window.clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    if (!targetId) {
      updatePosition();
      return;
    }

    let attempts = 0;
    const maxAttempts = 15;

    const checkTarget = () => {
      attempts++;
      const el = resolveTargetElement(targetId);
      if (el) {
        const rect = el.getBoundingClientRect();
        // Check if element is out of visible viewport
        const isOutOfView = 
          rect.top < 0 || 
          rect.bottom > window.innerHeight || 
          rect.left < 0 || 
          rect.right > window.innerWidth;

        if (isOutOfView) {
          try {
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
          } catch {
            // fallback
          }
        }

        updatePosition();
        if (pollIntervalRef.current) {
          window.clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      } else if (attempts >= maxAttempts) {
        // Mark target not found if still absent after 1.5s
        setTargetNotFound(true);
        updatePosition();
        if (pollIntervalRef.current) {
          window.clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      }
    };

    // Immediate check
    checkTarget();

    // Start polling if not found immediately
    const el = resolveTargetElement(targetId);
    if (!el) {
      pollIntervalRef.current = window.setInterval(checkTarget, 100);
    }

    return () => {
      if (pollIntervalRef.current) {
        window.clearInterval(pollIntervalRef.current);
      }
    };
  }, [targetId, isActive, stepIndex, subActionIndex, updatePosition]);

  // Event listeners for window resize, scroll capture, visualViewport mutations
  useEffect(() => {
    if (!isActive) return;

    const handleEvent = () => {
      window.requestAnimationFrame(updatePosition);
    };

    window.addEventListener('resize', handleEvent, { passive: true });
    window.addEventListener('scroll', handleEvent, { passive: true, capture: true });
    window.addEventListener('orientationchange', handleEvent, { passive: true });

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleEvent);
      window.visualViewport.addEventListener('scroll', handleEvent);
    }

    // ResizeObserver on the tooltip to re-clamp if content height changes
    let ro: ResizeObserver | null = null;
    if (tooltipRef.current && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        handleEvent();
      });
      ro.observe(tooltipRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleEvent);
      window.removeEventListener('scroll', handleEvent, { capture: true });
      window.removeEventListener('orientationchange', handleEvent);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleEvent);
        window.visualViewport.removeEventListener('scroll', handleEvent);
      }
      if (ro) ro.disconnect();
    };
  }, [isActive, updatePosition, tooltipRef]);

  return {
    tooltipStyle,
    targetRect,
    placement,
    pointerCoords,
    isReady,
    targetNotFound
  };
}
