import { useEffect, useState, useRef, useCallback } from 'react';
import { WalkthroughSubAction, TourContext } from './types';
import { resolveTargetElement } from './targetRegistry';

interface UseGuidedInteractionOptions {
  isActive: boolean;
  currentSubAction: WalkthroughSubAction | undefined;
  tourContext: TourContext;
  onAdvanceSubAction: () => void;
  onAdvanceStep: () => void;
  isLastSubAction: boolean;
}

export function useGuidedInteraction({
  isActive,
  currentSubAction,
  tourContext,
  onAdvanceSubAction,
  onAdvanceStep,
  isLastSubAction
}: UseGuidedInteractionOptions) {
  const [isVerified, setIsVerified] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  // Trigger smooth transition to next action after positive feedback
  const triggerSuccessTransition = useCallback((message?: string) => {
    setIsVerified(true);
    setFeedbackMessage(message || '✓ Verified!');

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setIsVerified(false);
      setFeedbackMessage(null);
      if (isLastSubAction) {
        onAdvanceStep();
      } else {
        onAdvanceSubAction();
      }
    }, 600);
  }, [isLastSubAction, onAdvanceStep, onAdvanceSubAction]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Reset verification state when subAction changes
  useEffect(() => {
    setIsVerified(false);
    setFeedbackMessage(null);
  }, [currentSubAction?.id]);

  // Real-time verification listeners
  useEffect(() => {
    if (!isActive || !currentSubAction) return;

    const { verification, targetTourId, confirmationMessage } = currentSubAction;
    const targetEl = resolveTargetElement(targetTourId);

    // 1. Click verification
    if (verification.type === 'click' && targetEl) {
      const handleClick = () => {
        if (verification.check) {
          if (verification.check(tourContext, targetEl)) {
            triggerSuccessTransition(confirmationMessage);
          }
        } else {
          triggerSuccessTransition(confirmationMessage);
        }
      };

      targetEl.addEventListener('click', handleClick);
      return () => {
        targetEl.removeEventListener('click', handleClick);
      };
    }

    // 2. Input typing verification
    if (verification.type === 'input' && targetEl) {
      const inputEl = targetEl as HTMLInputElement | HTMLTextAreaElement;
      
      const handleInput = () => {
        if (verification.check) {
          if (verification.check(tourContext, inputEl)) {
            triggerSuccessTransition(confirmationMessage);
          }
        } else if (inputEl.value && inputEl.value.trim().length > 1) {
          triggerSuccessTransition(confirmationMessage);
        }
      };

      inputEl.addEventListener('input', handleInput);
      inputEl.addEventListener('change', handleInput);

      // Also check immediate value if already filled
      if (inputEl.value && inputEl.value.trim().length > 1) {
        handleInput();
      }

      return () => {
        inputEl.removeEventListener('input', handleInput);
        inputEl.removeEventListener('change', handleInput);
      };
    }

    // 3. State-change verification
    if (verification.type === 'state-change') {
      if (verification.check && verification.check(tourContext, targetEl)) {
        triggerSuccessTransition(confirmationMessage);
      }
    }
  }, [isActive, currentSubAction, tourContext, triggerSuccessTransition]);

  return {
    isVerified,
    feedbackMessage
  };
}
