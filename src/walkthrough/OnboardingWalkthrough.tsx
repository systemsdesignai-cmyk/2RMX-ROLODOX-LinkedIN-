import React, { useRef, useEffect } from 'react';
import { WalkthroughSpotlight } from './WalkthroughSpotlight';
import { WalkthroughTooltip } from './WalkthroughTooltip';
import { GuidedTargetPointer } from './GuidedTargetPointer';
import { useWalkthroughPosition } from './useWalkthroughPosition';
import { useGuidedInteraction } from './useGuidedInteraction';
import { WalkthroughStep, WalkthroughSubAction, TourContext } from './types';

interface OnboardingWalkthroughProps {
  isActive: boolean;
  currentStep: WalkthroughStep | undefined;
  currentStepIndex: number;
  currentSubAction: WalkthroughSubAction | undefined;
  currentSubActionIndex: number;
  totalSteps: number;
  tourContext: TourContext;
  onNavigateTab: (tab: any) => void;
  onNext: () => void;
  onPrev: () => void;
  onAdvanceSubAction: () => void;
  onSkip: () => void;
  onFinish: () => void;
}

export const OnboardingWalkthrough: React.FC<OnboardingWalkthroughProps> = ({
  isActive,
  currentStep,
  currentStepIndex,
  currentSubAction,
  currentSubActionIndex,
  totalSteps,
  tourContext,
  onNavigateTab,
  onNext,
  onPrev,
  onAdvanceSubAction,
  onSkip,
  onFinish
}) => {
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  // Active target identifier
  const activeTargetId = currentSubAction?.targetTourId || currentStep?.targetId;
  const activeTargetTab = currentSubAction?.targetTab || currentStep?.targetTab;

  // Automatically navigate tab if active action targets a different tab
  useEffect(() => {
    if (isActive && activeTargetTab && activeTargetTab !== tourContext.activeTab) {
      onNavigateTab(activeTargetTab);
    }
  }, [isActive, activeTargetTab, tourContext.activeTab, onNavigateTab]);

  // Dynamic positioning & collision detection
  const { 
    tooltipStyle, 
    targetRect, 
    placement, 
    isReady, 
    targetNotFound 
  } = useWalkthroughPosition({
    targetId: activeTargetId,
    tooltipRef,
    isActive,
    stepIndex: currentStepIndex,
    subActionIndex: currentSubActionIndex
  });

  const totalSubActions = currentStep?.subActions?.length || 0;
  const isLastSubAction = totalSubActions === 0 || currentSubActionIndex === totalSubActions - 1;

  // Real-time user action detection and verification
  const { isVerified, feedbackMessage } = useGuidedInteraction({
    isActive,
    currentSubAction,
    tourContext,
    onAdvanceSubAction,
    onAdvanceStep: onNext,
    isLastSubAction
  });

  if (!isActive || !currentStep) {
    return null;
  }

  return (
    <div id="walkthrough-overlay-container" className="fixed inset-0 z-50 pointer-events-none">
      {/* 4-Quadrant Non-Blocking Spotlight Overlay */}
      <WalkthroughSpotlight
        targetRect={targetRect}
        onBackdropClick={() => {
          // Soft dismiss backdrop click without breaking workflow
        }}
      />

      {/* Guided Directional Target Pointer */}
      <GuidedTargetPointer
        targetRect={targetRect}
        placement={placement}
        visible={Boolean(targetRect && !targetNotFound)}
        actionPrompt={currentSubAction?.actionPrompt}
      />

      {/* Responsive Instruction Tooltip */}
      <div className="pointer-events-auto">
        <WalkthroughTooltip
          step={currentStep}
          stepIndex={currentStepIndex}
          totalSteps={totalSteps}
          currentSubAction={currentSubAction}
          currentSubActionIndex={currentSubActionIndex}
          totalSubActions={totalSubActions}
          feedbackMessage={feedbackMessage}
          targetNotFound={targetNotFound}
          tooltipStyle={tooltipStyle}
          placement={placement}
          onNext={() => {
            if (currentStep.subActions && currentSubActionIndex < currentStep.subActions.length - 1) {
              onAdvanceSubAction();
            } else {
              onNext();
            }
          }}
          onPrev={onPrev}
          onSkip={onSkip}
          onFinish={onFinish}
          tooltipRef={tooltipRef}
        />
      </div>
    </div>
  );
};
