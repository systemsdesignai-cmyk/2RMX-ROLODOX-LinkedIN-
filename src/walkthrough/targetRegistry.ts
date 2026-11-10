/**
 * Target Registry & Discovery Engine
 * Resolves DOM elements using stable selectors (data-tour-id, id)
 * with robust fallbacks and descriptive metadata.
 */

export const TOUR_TARGETS = {
  // Navigation Tabs
  CONTACTS_TAB: 'contacts-tab',
  EVENTS_TAB: 'events-tab',
  STRATEGY_TAB: 'strategy-tab',
  VISUALIZER_TAB: 'visualizer-tab',
  PROFILE_TAB: 'profile-tab',

  // Header Controls
  HEADER_CREATE_BTN: 'create-contact-button',
  HEADER_MAINTAIN_BTN: 'maintain-button',
  HEADER_SEARCH_INPUT: 'global-search-input',
  SIDEBAR_HAMBURGER_BTN: 'sidebar-hamburger-button',
  PLATFORM_SWITCH_BTN: 'platform-switch-button',
  TOUR_HELP_TRIGGER: 'tour-help-button',

  // Directory & Contact Controls
  CONTACTS_SEARCH_INPUT: 'contacts-search-input',
  CONTACT_FIRST_CARD: 'contact-first-card',
  GROUP_BY_CATEGORY: 'group-by-category-button',

  // Contact Creation Form Controls
  CONTACT_NAME_INPUT: 'contact-name-input',
  CONTACT_TITLE_INPUT: 'contact-title-input',
  CONTACT_SAVE_BTN: 'save-contact-button',

  // Events Controls
  EVENTS_BOARD_TOGGLE: 'events-board-toggle',
  EVENTS_LIST_TOGGLE: 'events-list-toggle',

  // Strategy Controls
  STRATEGY_FIRST_CARD: 'strategy-first-card',

  // Visualizer Controls
  VIZ_MODE_UNIFIED: 'viz-mode-unified',
  VIZ_MODE_DIRECT: 'viz-mode-direct',
  VIZ_PHYSICS_TOGGLE: 'viz-physics-toggle',

  // Maintenance Drawer Controls
  MAINTENANCE_DRAWER_CLOSE: 'maintenance-drawer-close',
  MAINTENANCE_FIRST_ITEM: 'maintenance-first-item'
} as const;

export type TourTargetKey = typeof TOUR_TARGETS[keyof typeof TOUR_TARGETS] | string;

// Fallback selector map for backwards compatibility with existing element IDs
const SELECTOR_FALLBACKS: Record<string, string[]> = {
  'contacts-tab': ['[data-tour-id="contacts-tab"]', '#nav-tab-contacts'],
  'events-tab': ['[data-tour-id="events-tab"]', '#nav-tab-events'],
  'strategy-tab': ['[data-tour-id="strategy-tab"]', '#nav-tab-strategy'],
  'visualizer-tab': ['[data-tour-id="visualizer-tab"]', '#nav-tab-visualizer'],
  'profile-tab': ['[data-tour-id="profile-tab"]', '#nav-tab-profile'],
  'create-contact-button': ['[data-tour-id="create-contact-button"]', '#header-create-btn'],
  'maintain-button': ['[data-tour-id="maintain-button"]', '#header-maintain-btn'],
  'global-search-input': ['[data-tour-id="global-search-input"]', '#global-header-search'],
  'sidebar-hamburger-button': ['[data-tour-id="sidebar-hamburger-button"]', '#sidebar-hamburger-menu-btn'],
  'platform-switch-button': ['[data-tour-id="platform-switch-button"]', '#platform-switch-btn'],
  'tour-help-button': ['[data-tour-id="tour-help-button"]', '#walkthrough-help-trigger'],
  'contacts-search-input': ['[data-tour-id="contacts-search-input"]', '#search-input'],
  'contact-name-input': ['[data-tour-id="contact-name-input"]', '#contact-form-name'],
  'contact-title-input': ['[data-tour-id="contact-title-input"]', '#contact-form-title', 'input[placeholder*="Headline"]'],
  'save-contact-button': ['[data-tour-id="save-contact-button"]', '#save-contact-profile-btn'],
  'contact-first-card': ['[data-tour-id="contact-first-card"]', '[id^="contact-row-"]'],
  'group-by-category-button': ['[data-tour-id="group-by-category-button"]', '#group-tab-category'],
  'events-board-toggle': ['[data-tour-id="events-board-toggle"]', '#view-kanban-btn'],
  'events-list-toggle': ['[data-tour-id="events-list-toggle"]', '#view-list-btn'],
  'strategy-first-card': ['[data-tour-id="strategy-first-card"]', '[id^="strategy-card-"]'],
  'viz-mode-unified': ['[data-tour-id="viz-mode-unified"]', '#viz-mode-unified-btn'],
  'viz-mode-direct': ['[data-tour-id="viz-mode-direct"]', '#viz-mode-direct-btn'],
  'viz-physics-toggle': ['[data-tour-id="viz-physics-toggle"]', '#viz-physics-toggle'],
  'maintenance-drawer-close': ['[data-tour-id="maintenance-drawer-close"]', '#close-maintenance-drawer-btn', '#drawer-close-btn'],
  'maintenance-first-item': ['[data-tour-id="maintenance-first-item"]', '[id^="maint-card-"]', '[id^="maint-item-"]']
};

/**
 * Resolves a target element from the DOM with cascading queries
 */
export function resolveTargetElement(targetIdentifier?: string): HTMLElement | null {
  if (!targetIdentifier) return null;

  // 1. Direct query by data-tour-id attribute
  const byDataAttr = document.querySelector<HTMLElement>(`[data-tour-id="${targetIdentifier}"]`);
  if (byDataAttr && isElementVisible(byDataAttr)) {
    return byDataAttr;
  }

  // 2. Direct query by ID
  const byId = document.getElementById(targetIdentifier);
  if (byId && isElementVisible(byId)) {
    return byId;
  }

  // 3. Fallback cascading selectors
  const fallbacks = SELECTOR_FALLBACKS[targetIdentifier];
  if (fallbacks && fallbacks.length > 0) {
    for (const selector of fallbacks) {
      try {
        const el = document.querySelector<HTMLElement>(selector);
        if (el && isElementVisible(el)) {
          return el;
        }
      } catch {
        // ignore invalid selector syntax
      }
    }
  }

  return null;
}

/**
 * Validates that an element is physically rendered and visible in the DOM
 */
export function isElementVisible(el: HTMLElement): boolean {
  if (!el || !el.isConnected) return false;
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return false;
  }
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}
