import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, Calendar, Target, Plus, User, Search, X, ArrowUpRight, Sparkles, AlertCircle, Network,
  Menu, Clock, Smartphone, HelpCircle, HardDrive
} from 'lucide-react';
import { ActiveTab, ViewState, CustomFolders, Contact, Event, Strategy, UserProfile } from './types';
import { initialContacts, initialEvents, initialStrategies, initialUserProfile } from './data/mockData';
import ContactsView from './components/ContactsView';
import EventsView from './components/EventsView';
import StrategyView from './components/StrategyView';
import NavButton from './components/NavButton';
import RelationshipVisualizer from './components/RelationshipVisualizer';
import UserProfileView from './components/UserProfileView';
import RelationshipMaintenanceDrawer from './components/RelationshipMaintenanceDrawer';
import { usePlatform } from './utils/platform';
import { useWalkthroughState } from './walkthrough/useWalkthroughState';
import { OnboardingWalkthrough } from './walkthrough/OnboardingWalkthrough';
import { WalkthroughHelpModal } from './walkthrough/WalkthroughHelpModal';
import { PWAInstallButton } from './components/pwa/PWAInstallButton';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { LocalBackupModal } from './components/pwa/LocalBackupModal';
import { NotificationCenter } from './components/notifications/NotificationCenter';
import { InAppReminderBanner } from './components/notifications/InAppReminderBanner';
import { NotificationSettingsModal } from './components/notifications/NotificationSettingsModal';
import { syncContactRemindersWithBackend, snoozeContactReminder } from './services/notificationService';

export default function App() {
  const { mode, activePlatform, isIOS, isAndroid, togglePlatform } = usePlatform();
  const [activeTab, setActiveTab] = useState<ActiveTab>('contacts');
  
  // User Profile persistent local state
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('rolodox_user_profile_v1');
      return saved ? JSON.parse(saved) : initialUserProfile;
    } catch {
      return initialUserProfile;
    }
  });

  // Contacts persistent local state
  const [contacts, setContacts] = useState<Contact[]>(() => {
    try {
      const saved = localStorage.getItem('rolodox_contacts_v1');
      return saved ? JSON.parse(saved) : initialContacts;
    } catch {
      return initialContacts;
    }
  });

  // Events persistent local state
  const [events, setEvents] = useState<Event[]>(() => {
    try {
      const saved = localStorage.getItem('rolodox_events_v1');
      return saved ? JSON.parse(saved) : initialEvents;
    } catch {
      return initialEvents;
    }
  });

  // Strategies persistent local state
  const [strategies, setStrategies] = useState<Strategy[]>(() => {
    try {
      const saved = localStorage.getItem('rolodox_strategies_v1');
      return saved ? JSON.parse(saved) : initialStrategies;
    } catch {
      return initialStrategies;
    }
  });
  
  // Custom Folders persistent state
  const [customFolders, setCustomFolders] = useState<CustomFolders>(() => {
    const defaultFolders: CustomFolders = { 
      events: [], 
      skills: [], 
      tags: [], 
      network: [], 
      projects: [],
      categories: []
    };
    try {
      const saved = localStorage.getItem('rolodox_custom_folders_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.categories) {
          parsed.categories = [];
        }
        return parsed;
      }
      return defaultFolders;
    } catch {
      return defaultFolders;
    }
  });

  const [viewState, setViewState] = useState<ViewState>({ view: 'list', id: null });
  const [skipReset, setSkipReset] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isLocalBackupOpen, setIsLocalBackupOpen] = useState(false);
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState(false);
  const [selectedMaintenanceContactId, setSelectedMaintenanceContactId] = useState<number | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Synchronize relationship maintenance schedules with push notification scheduler & check due reminders
  useEffect(() => {
    syncContactRemindersWithBackend(contacts);
    const intervalId = setInterval(() => {
      syncContactRemindersWithBackend(contacts);
    }, 60000);
    return () => clearInterval(intervalId);
  }, [contacts]);

  // Deep-link listener for Web Push notification clicks
  useEffect(() => {
    // 1. Check URL query parameters (e.g. ?openMaintenanceContact=123)
    const params = new URLSearchParams(window.location.search);
    const targetContact = params.get('openMaintenanceContact');
    if (targetContact) {
      const id = Number(targetContact);
      if (!isNaN(id)) {
        setSelectedMaintenanceContactId(id);
        setIsMaintenanceOpen(true);
      }
      // Clean query string from browser bar without refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // 2. Listen for live message events from service worker
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const handleSWMessage = (event: MessageEvent) => {
        if (event.data?.type === 'NOTIFICATION_CLICK') {
          const id = Number(event.data.contactId);
          if (!isNaN(id)) {
            setSelectedMaintenanceContactId(id);
            setIsMaintenanceOpen(true);
          }
        }
      };
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
      return () => navigator.serviceWorker.removeEventListener('message', handleSWMessage);
    }
  }, []);

  const handleSnoozeContact = async (contactId: number, hours: number = 24) => {
    await snoozeContactReminder(contactId, hours);
  };

  const reloadLocalData = () => {
    try {
      const c = localStorage.getItem('rolodox_contacts_v1');
      if (c) setContacts(JSON.parse(c));
      const e = localStorage.getItem('rolodox_events_v1');
      if (e) setEvents(JSON.parse(e));
      const s = localStorage.getItem('rolodox_strategies_v1');
      if (s) setStrategies(JSON.parse(s));
      const f = localStorage.getItem('rolodox_custom_folders_v1');
      if (f) setCustomFolders(JSON.parse(f));
      const p = localStorage.getItem('rolodox_user_profile_v1');
      if (p) setUserProfile(JSON.parse(p));
    } catch (err) {
      console.warn('Failed to reload local data:', err);
    }
  };

  // Production-grade interactive walkthrough state
  const walkthrough = useWalkthroughState();

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Tour Context for precision targeting and real-time state verification
  const tourContext = useMemo(() => ({
    contacts,
    events,
    strategies,
    activeTab,
    viewState,
    isMaintenanceOpen,
    platformMode: mode,
    activePlatform
  }), [contacts, events, strategies, activeTab, viewState, isMaintenanceOpen, mode, activePlatform]);
  const dueContactsCount = useMemo(() => {
    return contacts.filter(c => {
      if (c.nextFollowUpDate && c.nextFollowUpDate <= todayStr) return true;
      if (!c.lastMaintainedDate && (!c.conversations || c.conversations.length === 0)) return true;
      if (c.lastMaintainedDate) {
        const diffDays = Math.floor((new Date(todayStr).getTime() - new Date(c.lastMaintainedDate).getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= (c.maintenanceCadenceDays || 14) && (!c.nextFollowUpDate || c.nextFollowUpDate <= todayStr)) {
          return true;
        }
      }
      return false;
    }).length;
  }, [contacts, todayStr]);

  // Close search results dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navigateToContact = (id: number) => {
    setSkipReset(true);
    setActiveTab('contacts');
    setViewState({ view: 'detail', id });
  };

  const navigateToEvent = (id: number) => {
    setSkipReset(true);
    setActiveTab('events');
    setViewState({ view: 'detail', id });
  };

  const navigateToStrategy = (id: number) => {
    setSkipReset(true);
    setActiveTab('strategy');
    setTimeout(() => {
      const el = document.getElementById(`strategy-card-${id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Transient highlighting animation
        el.classList.add('ring-2', 'ring-indigo-500', 'shadow-[0_0_25px_rgba(0,123,255,0.35)]', 'border-indigo-500');
        setTimeout(() => {
          el.classList.remove('ring-2', 'ring-indigo-500', 'shadow-[0_0_25px_rgba(0,123,255,0.35)]', 'border-indigo-500');
        }, 3000);
      }
    }, 150);
  };

  // High performance custom fuzzy search implementation matching multiple entities
  const searchResults = useMemo(() => {
    const query = searchQuery.trim();
    if (!query) return { contacts: [], events: [], strategies: [] };

    const fuzzySearch = (text: string, q: string) => {
      const cleanText = (text || '').toLowerCase();
      const cleanQuery = q.toLowerCase();
      
      if (cleanText === cleanQuery) return { matches: true, score: 1000 };
      
      const index = cleanText.indexOf(cleanQuery);
      if (index !== -1) {
        return { matches: true, score: 500 - index + cleanQuery.length * 5 };
      }
      
      let qIdx = 0;
      let tIdx = 0;
      let score = 0;
      let consecutive = 0;
      
      while (qIdx < cleanQuery.length && tIdx < cleanText.length) {
        if (cleanQuery[qIdx] === cleanText[tIdx]) {
          qIdx++;
          consecutive++;
          score += 10 + consecutive * 5;
        } else {
          consecutive = 0;
        }
        tIdx++;
      }
      
      if (qIdx === cleanQuery.length) {
        return { matches: true, score: score - (cleanText.length - cleanQuery.length) };
      }
      return { matches: false, score: 0 };
    };

    // 1. Match Contacts
    const matchedContacts = contacts
      .map(c => {
        let bestScore = 0;
        let matchedField = '';

        const nameRes = fuzzySearch(c.name, query);
        if (nameRes.matches && nameRes.score > bestScore) {
          bestScore = nameRes.score + 100;
          matchedField = 'Name';
        }

        const titleRes = fuzzySearch(c.title, query);
        if (titleRes.matches && titleRes.score > bestScore) {
          bestScore = titleRes.score + 50;
          matchedField = 'Title';
        }

        if (c.skills) {
          c.skills.forEach(s => {
            const skillRes = fuzzySearch(s.name, query);
            if (skillRes.matches && skillRes.score > bestScore) {
              bestScore = skillRes.score + 25;
              matchedField = `Skill: ${s.name}`;
            }
          });
        }

        if (c.tags) {
          c.tags.forEach(t => {
            const tagRes = fuzzySearch(t, query);
            if (tagRes.matches && tagRes.score > bestScore) {
              bestScore = tagRes.score + 30;
              matchedField = `Tag: #${t}`;
            }
          });
        }

        if (c.projects) {
          c.projects.forEach(p => {
            const projRes = fuzzySearch(p, query);
            if (projRes.matches && projRes.score > bestScore) {
              bestScore = projRes.score + 20;
              matchedField = `Project: ${p}`;
            }
          });
        }

        return { item: c, score: bestScore, matchedField };
      })
      .filter(res => res.score > 0)
      .sort((a, b) => b.score - a.score);

    // 2. Match Events
    const matchedEvents = events
      .map(e => {
        let bestScore = 0;
        let matchedField = '';

        const nameRes = fuzzySearch(e.name, query);
        if (nameRes.matches && nameRes.score > bestScore) {
          bestScore = nameRes.score + 100;
          matchedField = 'Event Name';
        }

        const locRes = fuzzySearch(e.location, query);
        if (locRes.matches && locRes.score > bestScore) {
          bestScore = locRes.score + 40;
          matchedField = 'Location';
        }

        if (e.goals) {
          const goalsRes = fuzzySearch(e.goals, query);
          if (goalsRes.matches && goalsRes.score > bestScore) {
            bestScore = goalsRes.score + 20;
            matchedField = 'Goals';
          }
        }

        return { item: e, score: bestScore, matchedField };
      })
      .filter(res => res.score > 0)
      .sort((a, b) => b.score - a.score);

    // 3. Match Strategies
    const matchedStrategies = strategies
      .map(s => {
        let bestScore = 0;
        let matchedField = '';

        const goalRes = fuzzySearch(s.goal, query);
        if (goalRes.matches && goalRes.score > bestScore) {
          bestScore = goalRes.score + 100;
          matchedField = 'Objective';
        }

        const targetRes = fuzzySearch(s.target, query);
        if (targetRes.matches && targetRes.score > bestScore) {
          bestScore = targetRes.score + 80;
          matchedField = 'Target Profile';
        }

        if (s.chain) {
          s.chain.forEach(link => {
            const linkNameRes = fuzzySearch(link.person, query);
            if (linkNameRes.matches && linkNameRes.score > bestScore) {
              bestScore = linkNameRes.score + 60;
              matchedField = `Pathway: ${link.person}`;
            }

            const linkRoleRes = fuzzySearch(link.role, query);
            if (linkRoleRes.matches && linkRoleRes.score > bestScore) {
              bestScore = linkRoleRes.score + 30;
              matchedField = `Pathway Role: ${link.role}`;
            }

            if (link.whyNeeded) {
              const whyRes = fuzzySearch(link.whyNeeded, query);
              if (whyRes.matches && whyRes.score > bestScore) {
                bestScore = whyRes.score + 15;
                matchedField = 'Pathway Context';
              }
            }
          });
        }

        return { item: s, score: bestScore, matchedField };
      })
      .filter(res => res.score > 0)
      .sort((a, b) => b.score - a.score);

    return {
      contacts: matchedContacts,
      events: matchedEvents,
      strategies: matchedStrategies
    };
  }, [searchQuery, contacts, events, strategies]);

  const goToList = () => setViewState({ view: 'list', id: null });
  const goToDetail = (id: number) => setViewState({ view: 'detail', id });
  const goToCreate = () => setViewState({ view: 'create', id: null });

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('rolodox_contacts_v1', JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem('rolodox_events_v1', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('rolodox_strategies_v1', JSON.stringify(strategies));
  }, [strategies]);

  useEffect(() => {
    localStorage.setItem('rolodox_custom_folders_v1', JSON.stringify(customFolders));
  }, [customFolders]);

  useEffect(() => {
    localStorage.setItem('rolodox_user_profile_v1', JSON.stringify(userProfile));
  }, [userProfile]);

  // Reset view state when changing navigation tabs
  useEffect(() => {
    if (skipReset) {
      setSkipReset(false);
      return;
    }
    goToList();
  }, [activeTab]);

  return (
    <div className="flex flex-col h-screen bg-zinc-950 font-sans text-zinc-100 selection:bg-indigo-500/30 overflow-hidden">
      {/* Top Application Bar */}
      <header className="bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800/80 text-white px-3 sm:px-6 py-2 pt-safe z-30 flex justify-between items-center shrink-0 gap-2 sm:gap-4">
        {/* Left Actions: Hamburger Menu */}
        <div className="flex items-center shrink-0">
          <button
            id="sidebar-hamburger-menu-btn"
            data-tour-id="sidebar-hamburger-button"
            type="button"
            onClick={() => setIsMaintenanceOpen(true)}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center p-2 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-xl transition-all relative cursor-pointer active:scale-95"
            title="Open Relationship Maintenance & Reminders"
          >
            <Menu className="w-5 h-5" />
            {dueContactsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-zinc-950" />
            )}
          </button>
        </div>

        {/* Global Fuzzy Search Bar */}
        <div ref={searchContainerRef} className="relative flex-1 max-w-[440px] mx-1 sm:mx-2">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="global-header-search"
              data-tour-id="global-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              placeholder="Search contacts, skills, events..."
              className="w-full bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-xl pl-8 pr-7 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500/60 focus:border-indigo-500/80 outline-none transition-all placeholder:text-zinc-400"
            />
            {searchQuery && (
              <button
                id="clear-global-search"
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchResults(false);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Search Dropdown Panel - Mobile Optimized */}
          {showSearchResults && searchQuery.trim() && (
            <div className="fixed inset-x-3 top-14 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-[420px] md:w-[460px] bg-zinc-900/95 border border-zinc-800 rounded-2xl shadow-2xl max-h-[70vh] sm:max-h-[460px] overflow-y-auto z-50 p-4 space-y-4 backdrop-blur-xl animate-fade-in no-scrollbar">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Search Results
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  {searchResults.contacts.length + searchResults.events.length + searchResults.strategies.length} matches
                </span>
              </div>

              {/* Contacts Results */}
              {searchResults.contacts.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                    Directory ({searchResults.contacts.length})
                  </h4>
                  <div className="space-y-1">
                    {searchResults.contacts.slice(0, 5).map(({ item, matchedField }) => (
                      <div
                        key={item.id}
                        id={`search-contact-result-${item.id}`}
                        onClick={() => {
                          navigateToContact(item.id);
                          setShowSearchResults(false);
                        }}
                        className="flex items-center justify-between bg-zinc-950/70 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-zinc-700 px-3 py-2 rounded-xl cursor-pointer transition-all duration-150 group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-xs text-zinc-100 flex items-center gap-1.5 group-hover:text-indigo-400 transition-colors">
                            <span className="truncate">{item.name}</span>
                            <ArrowUpRight className="w-3 h-3 text-zinc-500 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                          </div>
                          <div className="text-[10px] text-zinc-400 truncate mt-0.5">{item.title}</div>
                        </div>
                        {matchedField && matchedField !== 'Name' && matchedField !== 'Title' && (
                          <span className="text-[9px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-mono shrink-0 select-none max-w-[120px] truncate">
                            {matchedField}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Events Results */}
              {searchResults.events.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                    Events ({searchResults.events.length})
                  </h4>
                  <div className="space-y-1">
                    {searchResults.events.slice(0, 5).map(({ item, matchedField }) => (
                      <div
                        key={item.id}
                        id={`search-event-result-${item.id}`}
                        onClick={() => {
                          navigateToEvent(item.id);
                          setShowSearchResults(false);
                        }}
                        className="flex items-center justify-between bg-zinc-950/70 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-zinc-700 px-3 py-2 rounded-xl cursor-pointer transition-all duration-150 group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-xs text-zinc-100 flex items-center gap-1.5 group-hover:text-indigo-400 transition-colors">
                            <span className="truncate">{item.name}</span>
                            <ArrowUpRight className="w-3 h-3 text-zinc-500 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                          </div>
                          <div className="text-[10px] text-zinc-400 truncate mt-0.5 flex items-center gap-1.5">
                            <span className="shrink-0 font-mono">{item.date}</span>
                            {item.location && <span className="truncate text-zinc-500">· {item.location}</span>}
                          </div>
                        </div>
                        {matchedField && matchedField !== 'Event Name' && (
                          <span className="text-[9px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-mono shrink-0 select-none max-w-[120px] truncate">
                            {matchedField}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strategies Results */}
              {searchResults.strategies.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                    Strategies ({searchResults.strategies.length})
                  </h4>
                  <div className="space-y-1">
                    {searchResults.strategies.slice(0, 5).map(({ item, matchedField }) => (
                      <div
                        key={item.id}
                        id={`search-strategy-result-${item.id}`}
                        onClick={() => {
                          navigateToStrategy(item.id);
                          setShowSearchResults(false);
                        }}
                        className="flex items-center justify-between bg-zinc-950/70 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-zinc-700 px-3 py-2 rounded-xl cursor-pointer transition-all duration-150 group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-xs text-zinc-100 flex items-center gap-1.5 group-hover:text-indigo-400 transition-colors">
                            <span className="truncate">{item.goal}</span>
                            <ArrowUpRight className="w-3 h-3 text-zinc-500 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-0.5 truncate flex items-center gap-1.5">
                            <span className="shrink-0 text-indigo-400 font-medium">Target: {item.target}</span>
                            <span className="shrink-0 text-zinc-500 font-mono text-[9px]">· {item.status}</span>
                          </div>
                        </div>
                        {matchedField && matchedField !== 'Objective' && matchedField !== 'Target Profile' && (
                          <span className="text-[9px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-mono shrink-0 select-none max-w-[120px] truncate" title={matchedField}>
                            {matchedField}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results Fallback */}
              {searchResults.contacts.length === 0 && searchResults.events.length === 0 && searchResults.strategies.length === 0 && (
                <div className="py-8 text-center text-zinc-500 space-y-2">
                  <AlertCircle className="w-7 h-7 text-zinc-600 mx-auto" />
                  <p className="text-xs">No matching contacts, events, or strategies found.</p>
                  <p className="text-[10px] text-zinc-600">Try searching a name, skill, or objective</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Header Right Actions - Reclaimed space, preserved Notifications and Maintain */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Notification Center Popover */}
          <NotificationCenter
            contacts={contacts}
            onOpenMaintenance={(id) => {
              setSelectedMaintenanceContactId(id || null);
              setIsMaintenanceOpen(true);
            }}
            onOpenContact={navigateToContact}
            onOpenSettings={() => setIsNotificationSettingsOpen(true)}
            onSnoozeContact={handleSnoozeContact}
          />

          {/* Relationship Maintenance Shortcut & Counter */}
          <button
            id="header-maintain-btn"
            data-tour-id="maintain-button"
            type="button"
            onClick={() => setIsMaintenanceOpen(true)}
            className="min-h-[38px] bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-medium px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-sm"
            title="Relationship Maintenance To-Do"
          >
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Maintain</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
              dueContactsCount > 0 
                ? 'bg-amber-500/20 text-amber-300 font-bold' 
                : 'text-zinc-500'
            }`}>
              {dueContactsCount}
            </span>
          </button>
        </div>
      </header>

      {/* Main Scrollable Area */}
      <main className={`flex-1 overflow-y-auto w-full px-3.5 sm:px-6 pt-4 pb-28 sm:pb-24 relative transition-all duration-200 ${
        activeTab === 'visualizer' ? 'max-w-6xl mx-auto h-full flex flex-col' : 
        activeTab === 'profile' ? 'max-w-4xl mx-auto' : 'max-w-3xl mx-auto'
      }`}>
        {activeTab === 'contacts' && (
          <ContactsView 
            contacts={contacts} 
            setContacts={setContacts} 
            events={events} 
            setEvents={setEvents}
            customFolders={customFolders} 
            setCustomFolders={setCustomFolders}
            viewState={viewState} 
            goToList={goToList} 
            goToDetail={goToDetail} 
          />
        )}
        {activeTab === 'events' && (
          <EventsView 
            events={events} 
            setEvents={setEvents} 
            contacts={contacts}
            customFolders={customFolders}
            setCustomFolders={setCustomFolders}
            viewState={viewState} 
            goToList={goToList} 
            goToDetail={goToDetail} 
            goToCreate={goToCreate}
          />
        )}
        {activeTab === 'strategy' && (
          <StrategyView 
            strategies={strategies} 
            setStrategies={setStrategies} 
            viewState={viewState} 
            goToList={goToList} 
            goToDetail={goToDetail} 
            goToCreate={goToCreate}
            contacts={contacts}
            setContacts={setContacts}
            navigateToContact={navigateToContact}
          />
        )}
        {activeTab === 'visualizer' && (
          <div className="flex-1 min-h-[500px] h-full flex flex-col">
            <RelationshipVisualizer
              contacts={contacts}
              events={events}
              strategies={strategies}
              navigateToContact={navigateToContact}
              navigateToEvent={navigateToEvent}
              navigateToStrategy={navigateToStrategy}
            />
          </div>
        )}
        {activeTab === 'profile' && (
          <UserProfileView
            userProfile={userProfile}
            setUserProfile={setUserProfile}
            contacts={contacts}
            navigateToContact={navigateToContact}
          />
        )}
      </main>

      {/* Fixed Bottom Tab Navigation - Mobile Native Dock (Apple HIG vs Material 3) */}
      <nav className={`flex items-center justify-around fixed bottom-0 left-0 right-0 z-30 transition-all ${
        isAndroid 
          ? 'bg-zinc-900 border-t border-zinc-800/80 min-h-[68px] sm:min-h-[76px] pb-safe pt-1 px-1 sm:bottom-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-[500px] sm:rounded-3xl shadow-2xl' 
          : 'bg-zinc-950/90 backdrop-blur-xl border-t border-white/10 min-h-[50px] pb-safe pt-1 px-2 sm:bottom-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-[480px] sm:rounded-2xl shadow-2xl'
      }`}>
        <NavButton 
          id="nav-tab-contacts"
          dataTourId="contacts-tab"
          active={activeTab === 'contacts'} 
          icon={<Users />} 
          label="Directory" 
          onClick={() => setActiveTab('contacts')} 
          platform={activePlatform}
        />
        <NavButton 
          id="nav-tab-events"
          dataTourId="events-tab"
          active={activeTab === 'events'} 
          icon={<Calendar />} 
          label="Events" 
          onClick={() => setActiveTab('events')} 
          platform={activePlatform}
        />
        <NavButton 
          id="nav-tab-strategy"
          dataTourId="strategy-tab"
          active={activeTab === 'strategy'} 
          icon={<Target />} 
          label="Strategy" 
          onClick={() => setActiveTab('strategy')} 
          platform={activePlatform}
        />
        <NavButton 
          id="nav-tab-visualizer"
          dataTourId="visualizer-tab"
          active={activeTab === 'visualizer'} 
          icon={<Network />} 
          label="Network" 
          onClick={() => setActiveTab('visualizer')} 
          platform={activePlatform}
        />
        <NavButton 
          id="nav-tab-profile"
          dataTourId="profile-tab"
          active={activeTab === 'profile'} 
          icon={<User />} 
          label="Profile" 
          onClick={() => setActiveTab('profile')} 
          platform={activePlatform}
        />
      </nav>

      {/* Vertically Stacked Floating Action Buttons (FABs): Add (+) on top, Help (?) directly underneath */}
      <div 
        className="fixed right-4 sm:right-5 z-25 flex flex-col items-center gap-3 pointer-events-none select-none"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 78px)'
        }}
      >
        {/* Add (+) Button - Circular, blue background, white plus icon */}
        {viewState.view === 'list' && (
          <button
            id="header-create-btn"
            data-tour-id="create-contact-button"
            type="button"
            onClick={() => {
              if (activeTab === 'visualizer' || activeTab === 'profile') {
                setActiveTab('contacts');
              }
              goToCreate();
            }}
            className="pointer-events-auto w-[54px] h-[54px] rounded-full bg-[#007BFF] hover:bg-[#0069D9] active:bg-[#0056B3] text-white flex items-center justify-center shadow-xl shadow-[#007BFF]/35 active:scale-95 transition-all cursor-pointer border border-[#007BFF]/40 focus:outline-none focus:ring-2 focus:ring-[#007BFF]/50"
            title={`Create new item in ${activeTab}`}
            aria-label="Add new entry"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        )}

        {/* Help (?) Button - Circular, dark background, blue question-mark icon */}
        <button
          id="walkthrough-help-trigger"
          data-tour-id="tour-help-button"
          type="button"
          onClick={() => setIsHelpModalOpen(true)}
          className="pointer-events-auto w-[54px] h-[54px] rounded-full bg-zinc-900/95 hover:bg-zinc-850 active:bg-zinc-800 text-[#38BDF8] border border-zinc-800 hover:border-zinc-700 flex items-center justify-center shadow-xl shadow-black/60 active:scale-95 transition-all cursor-pointer backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-[#38BDF8]/40"
          title="Interactive Walkthroughs & Guided Tours"
          aria-label="Open Guided Tours & Help"
        >
          <HelpCircle className="w-6 h-6 text-[#38BDF8]" />
        </button>
      </div>

      {/* Relationship Maintenance Slide-out Drawer */}
      <RelationshipMaintenanceDrawer
        isOpen={isMaintenanceOpen}
        onClose={() => {
          setIsMaintenanceOpen(false);
          setSelectedMaintenanceContactId(null);
        }}
        contacts={contacts}
        setContacts={setContacts}
        navigateToContact={navigateToContact}
        initialContactId={selectedMaintenanceContactId}
      />

      {/* In-App Floating Reminder Alert */}
      <InAppReminderBanner
        contacts={contacts}
        onOpenMaintenance={(id) => {
          setSelectedMaintenanceContactId(id || null);
          setIsMaintenanceOpen(true);
        }}
        onSnooze={(id) => handleSnoozeContact(id, 24)}
      />

      {/* Push Notification Settings Modal */}
      <NotificationSettingsModal
        isOpen={isNotificationSettingsOpen}
        onClose={() => setIsNotificationSettingsOpen(false)}
      />

      {/* Production-Grade Interactive Onboarding Walkthrough */}
      <OnboardingWalkthrough
        isActive={walkthrough.isActive}
        currentStep={walkthrough.currentStep}
        currentStepIndex={walkthrough.currentStepIndex}
        currentSubAction={walkthrough.currentSubAction}
        currentSubActionIndex={walkthrough.currentSubActionIndex}
        totalSteps={walkthrough.totalSteps}
        activeTab={activeTab}
        tourContext={tourContext}
        onNavigateTab={(tab) => {
          setSkipReset(true);
          setActiveTab(tab);
          goToList();
        }}
        onNext={walkthrough.nextStep}
        onPrev={walkthrough.prevStep}
        onAdvanceSubAction={walkthrough.advanceSubAction}
        onSkip={walkthrough.skipTour}
        onFinish={walkthrough.finishTour}
      />

      {/* Walkthrough & Guided Tour Launcher Modal */}
      <WalkthroughHelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        onStartTour={(type) => walkthrough.startTour(type)}
        onResetOnboarding={walkthrough.resetOnboarding}
        hasCompleted={walkthrough.hasCompleted}
        hasDismissed={walkthrough.hasDismissed}
      />

      {/* Local Storage & Device Backup Modal */}
      <LocalBackupModal
        isOpen={isLocalBackupOpen}
        onClose={() => setIsLocalBackupOpen(false)}
        onDataRestored={reloadLocalData}
      />

      {/* PWA Offline Connectivity Indicator */}
      <OfflineIndicator />
    </div>
  );
}

