export type TourType = 'full' | 'create-contact' | 'maintenance' | 'strategy';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right' | 'center';
export type PointerDirection = 'up' | 'down' | 'left' | 'right' | 'auto';

export interface TourContext {
  contacts: any[];
  events: any[];
  strategies: any[];
  activeTab: 'contacts' | 'events' | 'strategy' | 'visualizer' | 'profile';
  viewState: { view: 'list' | 'detail' | 'create'; id: number | null };
  isMaintenanceOpen: boolean;
  platformMode?: string;
  activePlatform?: string;
}

export interface WalkthroughVerification {
  type: 'click' | 'input' | 'state-change' | 'manual';
  check?: (ctx: TourContext, targetEl?: HTMLElement | null) => boolean;
}

export interface WalkthroughSubAction {
  id: string;
  targetTourId: string;
  targetTab?: 'contacts' | 'events' | 'strategy' | 'visualizer' | 'profile';
  instruction: string;
  helperText?: string;
  actionPrompt?: string;
  verification: WalkthroughVerification;
  pointerDirection?: PointerDirection;
  confirmationMessage?: string;
}

export interface WalkthroughStep {
  id: string;
  targetId?: string; // fallback or single target
  title: string;
  purpose: string;
  action?: string;
  targetTab?: 'contacts' | 'events' | 'strategy' | 'visualizer' | 'profile';
  section?: string;
  subActions?: WalkthroughSubAction[];
}

export interface WalkthroughState {
  hasStarted: boolean;
  hasCompleted: boolean;
  hasDismissed: boolean;
  lastStepIndex: number;
  activeTourType: TourType;
}

export interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
}

export interface TooltipStyle {
  position: 'fixed';
  top: number;
  left: number;
  width: number;
  maxWidth: number;
  maxHeight: number;
}

export interface PointerCoordinates {
  x: number;
  y: number;
  targetEdgeX: number;
  targetEdgeY: number;
  direction: 'up' | 'down' | 'left' | 'right';
  visible: boolean;
}

export interface PositionResult {
  tooltipStyle: TooltipStyle;
  targetRect: TargetRect | null;
  placement: TooltipPlacement;
  pointerCoords: PointerCoordinates | null;
  isReady: boolean;
  targetNotFound: boolean;
}
