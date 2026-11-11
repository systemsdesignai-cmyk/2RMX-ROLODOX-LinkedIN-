import React, { useState, useEffect } from 'react';
import { Bell, Clock, ChevronRight, X, Sparkles, MessageCircle, AlertCircle } from 'lucide-react';
import { Contact } from '../../types';
import { SocialContactIcons } from '../social/SocialContactIcons';
import { getContactChannels } from '../social/communicationPlatforms';

interface InAppReminderBannerProps {
  contacts: Contact[];
  onOpenMaintenance: (contactId?: number) => void;
  onSnooze: (contactId: number) => void;
}

export const InAppReminderBanner: React.FC<InAppReminderBannerProps> = ({
  contacts,
  onOpenMaintenance,
  onSnooze
}) => {
  const [isDismissed, setIsDismissed] = useState(() => {
    return sessionStorage.getItem('rolodox_in_app_reminder_dismissed') === 'true';
  });

  const todayStr = new Date().toISOString().split('T')[0];

  // Identify due and overdue contacts
  const dueContacts = contacts.filter(c => {
    if (c.nextFollowUpDate && c.nextFollowUpDate <= todayStr) return true;
    if (!c.lastMaintainedDate && (!c.conversations || c.conversations.length === 0)) return true;
    if (c.lastMaintainedDate) {
      const diffDays = Math.floor((new Date(todayStr).getTime() - new Date(c.lastMaintainedDate).getTime()) / (1000 * 60 * 60 * 24));
      const cadence = c.maintenanceCadenceDays || 14;
      if (diffDays >= cadence && (!c.nextFollowUpDate || c.nextFollowUpDate <= todayStr)) {
        return true;
      }
    }
    return false;
  });

  if (isDismissed || dueContacts.length === 0) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('rolodox_in_app_reminder_dismissed', 'true');
  };

  const handleRemindLater = () => {
    if (dueContacts[0]) {
      onSnooze(dueContacts[0].id);
    }
    handleDismiss();
  };

  const topTwo = dueContacts.slice(0, 2);
  const remainingCount = dueContacts.length - topTwo.length;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-40 max-w-sm w-[calc(100vw-24px)] sm:w-96 rounded-2xl bg-zinc-900/95 border border-indigo-500/40 shadow-2xl backdrop-blur-xl p-4 text-left animate-slide-in-up">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
            <Bell className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-display">
              <span>{dueContacts.length} {dueContacts.length === 1 ? 'Relationship Needs' : 'Relationships Need'} Attention</span>
            </h4>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          title="Dismiss for this session"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Contact Snippets */}
      <div className="py-2.5 space-y-2">
        {topTwo.map(contact => {
          const isOverdue = contact.nextFollowUpDate && contact.nextFollowUpDate < todayStr;
          const channels = getContactChannels(contact);

          let reason = 'Follow-up due today';
          if (contact.nextFollowUpDate && isOverdue) {
            const diffDays = Math.floor((new Date(todayStr).getTime() - new Date(contact.nextFollowUpDate).getTime()) / (1000 * 60 * 60 * 24));
            reason = `Overdue by ${diffDays}d`;
          } else if (!contact.lastMaintainedDate) {
            reason = 'New connection — no check-in logged';
          }

          return (
            <div 
              key={contact.id} 
              className="flex items-center justify-between gap-2 p-2 rounded-xl bg-zinc-950/70 border border-zinc-850 hover:border-zinc-750 transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {contact.avatar ? (
                  <img src={contact.avatar} alt={contact.name} className="w-7 h-7 rounded-lg object-cover shrink-0 border border-zinc-800" />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0">
                    {contact.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-zinc-200 block truncate font-display">{contact.name}</span>
                  <span className={`text-[10px] font-mono ${isOverdue ? 'text-red-400' : 'text-amber-400'}`}>
                    {reason}
                  </span>
                </div>
              </div>

              {/* Quick Communication Icons */}
              <div className="shrink-0 flex items-center gap-1">
                <SocialContactIcons channels={channels} size="xs" maxVisible={2} />
              </div>
            </div>
          );
        })}

        {remainingCount > 0 && (
          <p className="text-[11px] text-zinc-500 font-mono text-center">
            +{remainingCount} more contact{remainingCount > 1 ? 's' : ''} scheduled
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleRemindLater}
          className="text-xs text-zinc-400 hover:text-zinc-200 font-medium px-2.5 py-1.5 rounded-lg hover:bg-zinc-800/60 transition-colors"
        >
          Remind Later
        </button>

        <button
          type="button"
          onClick={() => {
            handleDismiss();
            onOpenMaintenance(topTwo[0]?.id);
          }}
          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all active:scale-95 flex items-center gap-1 shadow-md shadow-indigo-600/30"
        >
          <span>View Relationships</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
