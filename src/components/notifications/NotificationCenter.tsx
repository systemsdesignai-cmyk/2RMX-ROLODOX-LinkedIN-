import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Bell, Clock, Calendar, CheckCircle, ChevronRight, 
  Settings, X, Sparkles, ExternalLink, Moon, ArrowRight
} from 'lucide-react';
import { Contact } from '../../types';
import { SocialContactIcons } from '../social/SocialContactIcons';
import { getContactChannels } from '../social/communicationPlatforms';

interface NotificationCenterProps {
  contacts: Contact[];
  onOpenMaintenance: (contactId?: number) => void;
  onOpenContact: (contactId: number) => void;
  onOpenSettings: () => void;
  onSnoozeContact: (contactId: number, hours: number) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  contacts,
  onOpenMaintenance,
  onOpenContact,
  onOpenSettings,
  onSnoozeContact
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [readIds, setReadIds] = useState<number[]>(() => {
    try {
      const saved = sessionStorage.getItem('rolodox_read_notification_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Categorize reminders
  const { overdue, dueToday, upcoming } = useMemo(() => {
    const overdueList: { contact: Contact; daysOverdue: number }[] = [];
    const dueTodayList: Contact[] = [];
    const upcomingList: { contact: Contact; nextDate: string }[] = [];

    contacts.forEach(c => {
      if (c.nextFollowUpDate) {
        if (c.nextFollowUpDate < todayStr) {
          const diffDays = Math.max(1, Math.floor((new Date(todayStr).getTime() - new Date(c.nextFollowUpDate).getTime()) / (1000 * 60 * 60 * 24)));
          overdueList.push({ contact: c, daysOverdue: diffDays });
        } else if (c.nextFollowUpDate === todayStr) {
          dueTodayList.push(c);
        } else {
          upcomingList.push({ contact: c, nextDate: c.nextFollowUpDate });
        }
      } else if (!c.lastMaintainedDate) {
        dueTodayList.push(c);
      } else {
        const diffDays = Math.floor((new Date(todayStr).getTime() - new Date(c.lastMaintainedDate).getTime()) / (1000 * 60 * 60 * 24));
        const cadence = c.maintenanceCadenceDays || 14;
        if (diffDays >= cadence) {
          overdueList.push({ contact: c, daysOverdue: diffDays - cadence + 1 });
        }
      }
    });

    return { 
      overdue: overdueList.sort((a, b) => b.daysOverdue - a.daysOverdue), 
      dueToday: dueTodayList, 
      upcoming: upcomingList.slice(0, 5) 
    };
  }, [contacts, todayStr]);

  const totalActionable = overdue.length + dueToday.length;
  const unreadCount = (overdue.map(o => o.contact.id).concat(dueToday.map(d => d.id))).filter(id => !readIds.includes(id)).length;

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const markAllAsRead = () => {
    const allIds = contacts.map(c => c.id);
    setReadIds(allIds);
    sessionStorage.setItem('rolodox_read_notification_ids', JSON.stringify(allIds));
  };

  const handleSnooze = (contactId: number, hours: number) => {
    onSnoozeContact(contactId, hours);
    // Mark as read in current list
    const updated = [...readIds, contactId];
    setReadIds(updated);
    sessionStorage.setItem('rolodox_read_notification_ids', JSON.stringify(updated));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Header Bell Trigger Button */}
      <button
        id="notification-center-bell-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="min-h-[36px] min-w-[36px] relative p-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-all duration-150 active:scale-95 cursor-pointer flex items-center justify-center"
        title="Notifications & Relationship Reminders"
        aria-label="Notification Center"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-zinc-950 font-mono animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="fixed inset-x-3 top-14 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-96 rounded-2xl bg-zinc-900/98 border border-zinc-800 shadow-2xl backdrop-blur-xl z-50 overflow-hidden text-left animate-fade-in divide-y divide-zinc-800/80">
          {/* Header */}
          <div className="p-3.5 flex items-center justify-between bg-zinc-950/60">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-white uppercase tracking-wider font-display">Notification Center</span>
              {unreadCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-500/20 text-red-400 font-mono font-bold border border-red-500/30">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-[11px] text-zinc-400 hover:text-white px-2 py-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Mark read
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenSettings();
                }}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                title="Notification Settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="max-h-[65vh] sm:max-h-96 overflow-y-auto p-3 space-y-3 no-scrollbar">
            {totalActionable === 0 && (
              <div className="py-8 text-center text-zinc-500 space-y-2">
                <CheckCircle className="w-7 h-7 text-emerald-400 mx-auto" />
                <p className="text-xs font-semibold text-zinc-300">All Relationships Up to Date</p>
                <p className="text-[11px] text-zinc-500">No follow-ups due right now. You're completely caught up!</p>
              </div>
            )}

            {/* Overdue Section */}
            {overdue.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider font-mono flex items-center gap-1">
                  Overdue Follow-ups ({overdue.length})
                </span>
                <div className="space-y-1.5">
                  {overdue.map(({ contact, daysOverdue }) => (
                    <div
                      key={contact.id}
                      className="p-2.5 rounded-xl bg-red-950/20 border border-red-900/30 hover:border-red-800/50 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div 
                          className="flex items-center gap-2 min-w-0 cursor-pointer"
                          onClick={() => {
                            setIsOpen(false);
                            onOpenMaintenance(contact.id);
                          }}
                        >
                          {contact.avatar ? (
                            <img src={contact.avatar} alt={contact.name} className="w-6 h-6 rounded-md object-cover border border-zinc-800" />
                          ) : (
                            <div className="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300">
                              {contact.name.charAt(0)}
                            </div>
                          )}
                          <span className="text-xs font-bold text-white truncate hover:text-indigo-400 transition-colors font-display">
                            {contact.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-red-400 bg-red-900/30 px-1.5 py-0.5 rounded border border-red-800/40 shrink-0">
                          {daysOverdue}d overdue
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-red-900/20">
                        <SocialContactIcons channels={getContactChannels(contact)} size="xs" maxVisible={3} />
                        
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSnooze(contact.id, 24)}
                            className="text-[10px] text-zinc-400 hover:text-zinc-200 px-1.5 py-0.5 rounded hover:bg-zinc-800"
                            title="Snooze for 24h"
                          >
                            Snooze
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsOpen(false);
                              onOpenMaintenance(contact.id);
                            }}
                            className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900/40 flex items-center gap-0.5"
                          >
                            Maintain <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Due Today Section */}
            {dueToday.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider font-mono flex items-center gap-1">
                  Due Today ({dueToday.length})
                </span>
                <div className="space-y-1.5">
                  {dueToday.map(contact => (
                    <div
                      key={contact.id}
                      className="p-2.5 rounded-xl bg-amber-950/15 border border-amber-900/30 hover:border-amber-800/50 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div 
                          className="flex items-center gap-2 min-w-0 cursor-pointer"
                          onClick={() => {
                            setIsOpen(false);
                            onOpenMaintenance(contact.id);
                          }}
                        >
                          {contact.avatar ? (
                            <img src={contact.avatar} alt={contact.name} className="w-6 h-6 rounded-md object-cover border border-zinc-800" />
                          ) : (
                            <div className="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300">
                              {contact.name.charAt(0)}
                            </div>
                          )}
                          <span className="text-xs font-bold text-white truncate hover:text-indigo-400 transition-colors font-display">
                            {contact.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-amber-400 bg-amber-900/30 px-1.5 py-0.5 rounded border border-amber-800/40 shrink-0">
                          Due today
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-amber-900/20">
                        <SocialContactIcons channels={getContactChannels(contact)} size="xs" maxVisible={3} />
                        
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSnooze(contact.id, 24)}
                            className="text-[10px] text-zinc-400 hover:text-zinc-200 px-1.5 py-0.5 rounded hover:bg-zinc-800"
                            title="Snooze for 24h"
                          >
                            Snooze
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsOpen(false);
                              onOpenMaintenance(contact.id);
                            }}
                            className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900/40 flex items-center gap-0.5"
                          >
                            Maintain <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Section */}
            {upcoming.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-1">
                  Upcoming Scheduled
                </span>
                <div className="space-y-1">
                  {upcoming.map(({ contact, nextDate }) => (
                    <div
                      key={contact.id}
                      onClick={() => {
                        setIsOpen(false);
                        onOpenContact(contact.id);
                      }}
                      className="p-2 rounded-lg bg-zinc-950/40 hover:bg-zinc-800/60 border border-zinc-850 flex items-center justify-between gap-2 cursor-pointer transition-all"
                    >
                      <span className="text-xs text-zinc-300 truncate font-medium">{contact.name}</span>
                      <span className="text-[10px] font-mono text-zinc-500 shrink-0">{nextDate}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="p-3 bg-zinc-950/80 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenMaintenance();
              }}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              Open Full Relationship Maintenance <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
