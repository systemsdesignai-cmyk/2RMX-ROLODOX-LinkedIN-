import { WalkthroughStep, TourType, TourContext } from './types';
import { TOUR_TARGETS } from './targetRegistry';

export const fullTourSteps: WalkthroughStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Remix Rolodox',
    purpose: 'A strategic relationship planner and personal CRM engineered for modern networkers, founders, and professionals.',
    action: 'Click Next or press Enter to begin the guided interactive walkthrough.',
    section: 'Overview'
  },
  {
    id: 'interactive-create-contact',
    targetTab: 'contacts',
    title: 'Guided Contact Creation',
    purpose: 'Experience hands-on contact creation. Follow the directional spotlight to perform each step directly in the app.',
    section: 'Directory',
    subActions: [
      {
        id: 'action-tap-contacts-tab',
        targetTourId: TOUR_TARGETS.CONTACTS_TAB,
        targetTab: 'contacts',
        instruction: 'Tap the Directory tab to navigate to your rolodex.',
        actionPrompt: 'Tap Directory tab',
        verification: {
          type: 'click',
          check: (ctx: TourContext) => ctx.activeTab === 'contacts'
        },
        confirmationMessage: '✓ Directory opened!'
      },
      {
        id: 'action-tap-create-contact',
        targetTourId: TOUR_TARGETS.HEADER_CREATE_BTN,
        targetTab: 'contacts',
        instruction: 'Tap the + button in the header to open the new contact creation form.',
        actionPrompt: 'Tap + Create',
        verification: {
          type: 'click',
          check: (ctx: TourContext) => ctx.viewState.view === 'create'
        },
        confirmationMessage: '✓ Contact form opened!'
      },
      {
        id: 'action-enter-contact-name',
        targetTourId: TOUR_TARGETS.CONTACT_NAME_INPUT,
        targetTab: 'contacts',
        instruction: 'Type a name into the Full Name field (e.g., Alexandra Chen).',
        actionPrompt: 'Type contact name',
        verification: {
          type: 'input',
          check: (_ctx: TourContext, el?: HTMLElement | null) => {
            const input = el as HTMLInputElement;
            return Boolean(input && input.value && input.value.trim().length >= 2);
          }
        },
        confirmationMessage: '✓ Name entered!'
      },
      {
        id: 'action-save-contact',
        targetTourId: TOUR_TARGETS.CONTACT_SAVE_BTN,
        targetTab: 'contacts',
        instruction: 'Tap Create Contact Profile to save your new connection.',
        actionPrompt: 'Tap Create Profile',
        verification: {
          type: 'click'
        },
        confirmationMessage: '✓ You have successfully created your contact!'
      }
    ]
  },
  {
    id: 'directory-search-and-categorize',
    targetTab: 'contacts',
    title: 'Directory Search & Folders',
    purpose: 'Rapidly filter and segment your network using keywords, skill tags, or dynamic folders.',
    section: 'Directory',
    subActions: [
      {
        id: 'action-contacts-search',
        targetTourId: TOUR_TARGETS.CONTACTS_SEARCH_INPUT,
        targetTab: 'contacts',
        instruction: 'Type into the search bar to instantly query names, skills, and tags.',
        actionPrompt: 'Type search query',
        verification: {
          type: 'input',
          check: (_ctx: TourContext, el?: HTMLElement | null) => {
            const input = el as HTMLInputElement;
            return Boolean(input && input.value && input.value.trim().length >= 1);
          }
        },
        confirmationMessage: '✓ Directory filtered!'
      },
      {
        id: 'action-category-group',
        targetTourId: TOUR_TARGETS.GROUP_BY_CATEGORY,
        targetTab: 'contacts',
        instruction: 'Tap "By Category" to dynamically organize contacts into smart industry folders.',
        actionPrompt: 'Tap By Category',
        verification: {
          type: 'click'
        },
        confirmationMessage: '✓ Dynamic category folders active!'
      }
    ]
  },
  {
    id: 'relationship-maintenance',
    targetTab: 'contacts',
    title: 'Relationship Cadence Queue',
    purpose: 'Maintain strong relationships by keeping track of overdue check-ins and logging conversation touchpoints.',
    section: 'Maintenance',
    subActions: [
      {
        id: 'action-tap-maintain',
        targetTourId: TOUR_TARGETS.HEADER_MAINTAIN_BTN,
        targetTab: 'contacts',
        instruction: 'Tap Maintain to slide out your active relationship queue.',
        actionPrompt: 'Tap Maintain',
        verification: {
          type: 'click',
          check: (ctx: TourContext) => ctx.isMaintenanceOpen === true
        },
        confirmationMessage: '✓ Maintenance drawer opened!'
      },
      {
        id: 'action-close-maintain',
        targetTourId: TOUR_TARGETS.MAINTENANCE_DRAWER_CLOSE,
        targetTab: 'contacts',
        instruction: 'Tap the Close button to dismiss the maintenance drawer.',
        actionPrompt: 'Tap Close',
        verification: {
          type: 'click',
          check: (ctx: TourContext) => ctx.isMaintenanceOpen === false
        },
        confirmationMessage: '✓ Drawer dismissed!'
      }
    ]
  },
  {
    id: 'event-planner',
    targetTab: 'events',
    title: 'Strategic Event Planning',
    purpose: 'Plan upcoming networking mixers and conferences, set attendee objectives, and manage event stages.',
    section: 'Events',
    subActions: [
      {
        id: 'action-tap-events-tab',
        targetTourId: TOUR_TARGETS.EVENTS_TAB,
        targetTab: 'events',
        instruction: 'Tap the Events tab to view your scheduled meetups.',
        actionPrompt: 'Tap Events tab',
        verification: {
          type: 'click',
          check: (ctx: TourContext) => ctx.activeTab === 'events'
        },
        confirmationMessage: '✓ Events view opened!'
      },
      {
        id: 'action-toggle-events-board',
        targetTourId: TOUR_TARGETS.EVENTS_BOARD_TOGGLE,
        targetTab: 'events',
        instruction: 'Tap Board to toggle the Kanban stage board for upcoming events.',
        actionPrompt: 'Tap Board',
        verification: {
          type: 'click'
        },
        confirmationMessage: '✓ Kanban board activated!'
      }
    ]
  },
  {
    id: 'strategy-pathways',
    targetTab: 'strategy',
    title: 'Warm Introduction Pathways',
    purpose: 'Build referral pathways from people you know directly to high-value dream mentors and partners.',
    section: 'Strategy',
    subActions: [
      {
        id: 'action-tap-strategy-tab',
        targetTourId: TOUR_TARGETS.STRATEGY_TAB,
        targetTab: 'strategy',
        instruction: 'Tap the Strategy tab to view active warm introduction chains.',
        actionPrompt: 'Tap Strategy tab',
        verification: {
          type: 'click',
          check: (ctx: TourContext) => ctx.activeTab === 'strategy'
        },
        confirmationMessage: '✓ Strategy view opened!'
      },
      {
        id: 'action-inspect-strategy-card',
        targetTourId: TOUR_TARGETS.STRATEGY_FIRST_CARD,
        targetTab: 'strategy',
        instruction: 'Inspect the target profile and intermediary referral links.',
        actionPrompt: 'Inspect pathway',
        verification: {
          type: 'manual'
        },
        confirmationMessage: '✓ Pathway reviewed!'
      }
    ]
  },
  {
    id: 'network-topology-and-platform',
    targetTab: 'visualizer',
    title: 'D3 Network Topology & Adaptive OS',
    purpose: 'Explore your entire network in a real-time physics simulation and customize your OS design guidelines.',
    section: 'Topology & OS',
    subActions: [
      {
        id: 'action-tap-visualizer-tab',
        targetTourId: TOUR_TARGETS.VISUALIZER_TAB,
        targetTab: 'visualizer',
        instruction: 'Tap the Network tab to render the live force-directed relationship graph.',
        actionPrompt: 'Tap Network tab',
        verification: {
          type: 'click',
          check: (ctx: TourContext) => ctx.activeTab === 'visualizer'
        },
        confirmationMessage: '✓ Network graph rendered!'
      },
      {
        id: 'action-toggle-platform-switcher',
        targetTourId: TOUR_TARGETS.PLATFORM_SWITCH_BTN,
        targetTab: 'visualizer',
        instruction: 'Tap the OS pill in the header to switch between Apple HIG and Google Material Design 3.',
        actionPrompt: 'Tap OS pill',
        verification: {
          type: 'click'
        },
        confirmationMessage: '✓ Operating system styling toggled!'
      }
    ]
  }
];

export const createContactTourSteps: WalkthroughStep[] = [
  {
    id: 'create-contact-step',
    targetTab: 'contacts',
    title: 'Quick Contact Creation Exercise',
    purpose: 'Follow the active spotlight and pointer to create a new contact profile.',
    section: 'Exercise',
    subActions: [
      {
        id: 'quick-tap-contacts',
        targetTourId: TOUR_TARGETS.CONTACTS_TAB,
        targetTab: 'contacts',
        instruction: 'Tap the Directory tab.',
        actionPrompt: 'Tap Directory tab',
        verification: {
          type: 'click',
          check: (ctx: TourContext) => ctx.activeTab === 'contacts'
        },
        confirmationMessage: '✓ Directory opened!'
      },
      {
        id: 'quick-tap-create',
        targetTourId: TOUR_TARGETS.HEADER_CREATE_BTN,
        targetTab: 'contacts',
        instruction: 'Tap the + button to open the contact creation form.',
        actionPrompt: 'Tap + Create',
        verification: {
          type: 'click',
          check: (ctx: TourContext) => ctx.viewState.view === 'create'
        },
        confirmationMessage: '✓ Form opened!'
      },
      {
        id: 'quick-enter-name',
        targetTourId: TOUR_TARGETS.CONTACT_NAME_INPUT,
        targetTab: 'contacts',
        instruction: 'Type a name for your new contact.',
        actionPrompt: 'Type name',
        verification: {
          type: 'input',
          check: (_ctx: TourContext, el?: HTMLElement | null) => {
            const input = el as HTMLInputElement;
            return Boolean(input && input.value && input.value.trim().length >= 2);
          }
        },
        confirmationMessage: '✓ Name entered!'
      },
      {
        id: 'quick-save-contact',
        targetTourId: TOUR_TARGETS.CONTACT_SAVE_BTN,
        targetTab: 'contacts',
        instruction: 'Tap Create Contact Profile to complete your exercise.',
        actionPrompt: 'Tap Create Profile',
        verification: {
          type: 'click'
        },
        confirmationMessage: '✓ You have successfully created your first contact!'
      }
    ]
  }
];

export const maintenanceTourSteps: WalkthroughStep[] = [
  {
    id: 'maintenance-exercise',
    targetTab: 'contacts',
    title: 'Relationship Cadence Walkthrough',
    purpose: 'Learn how to inspect cadence reminders and keep in touch with key connections.',
    section: 'Maintenance',
    subActions: [
      {
        id: 'maint-tap-button',
        targetTourId: TOUR_TARGETS.HEADER_MAINTAIN_BTN,
        targetTab: 'contacts',
        instruction: 'Tap Maintain in the header to open overdue touchpoint reminders.',
        actionPrompt: 'Tap Maintain',
        verification: {
          type: 'click',
          check: (ctx: TourContext) => ctx.isMaintenanceOpen === true
        },
        confirmationMessage: '✓ Cadence queue opened!'
      },
      {
        id: 'maint-close-drawer',
        targetTourId: TOUR_TARGETS.MAINTENANCE_DRAWER_CLOSE,
        targetTab: 'contacts',
        instruction: 'Tap the Close button to return to the directory.',
        actionPrompt: 'Tap Close',
        verification: {
          type: 'click',
          check: (ctx: TourContext) => ctx.isMaintenanceOpen === false
        },
        confirmationMessage: '✓ Queue closed!'
      }
    ]
  }
];

export const strategyTourSteps: WalkthroughStep[] = [
  {
    id: 'strategy-exercise',
    targetTab: 'strategy',
    title: 'Strategic Pathway Walkthrough',
    purpose: 'Learn how to design multi-hop referral chains.',
    section: 'Strategy',
    subActions: [
      {
        id: 'strat-tap-tab',
        targetTourId: TOUR_TARGETS.STRATEGY_TAB,
        targetTab: 'strategy',
        instruction: 'Tap the Strategy tab.',
        actionPrompt: 'Tap Strategy tab',
        verification: {
          type: 'click',
          check: (ctx: TourContext) => ctx.activeTab === 'strategy'
        },
        confirmationMessage: '✓ Strategy opened!'
      },
      {
        id: 'strat-inspect-card',
        targetTourId: TOUR_TARGETS.STRATEGY_FIRST_CARD,
        targetTab: 'strategy',
        instruction: 'Inspect the target pathway and introduction sequence.',
        actionPrompt: 'Inspect pathway',
        verification: {
          type: 'manual'
        },
        confirmationMessage: '✓ Pathway reviewed!'
      }
    ]
  }
];

export function getStepsForTour(tourType: TourType): WalkthroughStep[] {
  switch (tourType) {
    case 'create-contact':
      return createContactTourSteps;
    case 'maintenance':
      return maintenanceTourSteps;
    case 'strategy':
      return strategyTourSteps;
    case 'full':
    default:
      return fullTourSteps;
  }
}
