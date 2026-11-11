import React, { useState, useEffect } from 'react';
import { 
  Bell, Clock, Smartphone, CheckCircle, AlertCircle, 
  X, Send, ShieldCheck, Moon, RefreshCw, Sparkles 
} from 'lucide-react';
import { 
  getPushStatus, 
  subscribeToPush, 
  unsubscribeFromPush, 
  triggerTestPush,
  PushStatus 
} from '../../services/notificationService';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [pushStatus, setPushStatus] = useState<PushStatus>({
    isSupported: false,
    permission: 'default',
    isSubscribed: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // User Preferences State
  const [preferredTime, setPreferredTime] = useState(() => {
    return localStorage.getItem('rolodox_notif_preferred_time') || '09:00';
  });

  const [reminderTiming, setReminderTiming] = useState<'on-time' | '1-hour' | '1-day'>(() => {
    return (localStorage.getItem('rolodox_notif_timing') as any) || 'on-time';
  });

  const [snoozeDefault, setSnoozeDefault] = useState<'1-hour' | '1-day' | '3-days'>(() => {
    return (localStorage.getItem('rolodox_notif_snooze') as any) || '1-day';
  });

  const [enableInApp, setEnableInApp] = useState(() => {
    return localStorage.getItem('rolodox_notif_in_app') !== 'false';
  });

  const [userTimezone, setUserTimezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  });

  useEffect(() => {
    if (isOpen) {
      getPushStatus().then(setPushStatus);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTogglePush = async () => {
    setIsLoading(true);
    setTestResult(null);

    if (pushStatus.isSubscribed) {
      await unsubscribeFromPush();
      const updated = await getPushStatus();
      setPushStatus(updated);
    } else {
      const res = await subscribeToPush();
      if (!res.success) {
        alert(res.error || 'Failed to enable notifications');
      }
      const updated = await getPushStatus();
      setPushStatus(updated);

      // Also sync user's preferred settings to server
      await fetch('/api/notifications/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            enabled: true,
            preferredTimeOfDay: preferredTime,
            advanceNotice: reminderTiming,
            snoozeDefault,
            timezone: userTimezone
          }
        })
      }).catch(() => {});
    }
    setIsLoading(false);
  };

  const handleSendTestPush = async () => {
    setIsLoading(true);
    setTestResult(null);
    const res = await triggerTestPush();
    setIsLoading(false);
    if (res.success) {
      setTestResult(`Test notification sent successfully! (${res.sent || 1} device received)`);
    } else {
      setTestResult(`Failed to send test: ${res.error || 'Check device subscription'}`);
    }
  };

  const handleSavePreferences = () => {
    localStorage.setItem('rolodox_notif_preferred_time', preferredTime);
    localStorage.setItem('rolodox_notif_timing', reminderTiming);
    localStorage.setItem('rolodox_notif_snooze', snoozeDefault);
    localStorage.setItem('rolodox_notif_in_app', enableInApp.toString());

    // Update backend settings
    fetch('/api/notifications/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        settings: {
          enabled: pushStatus.isSubscribed,
          preferredTimeOfDay: preferredTime,
          advanceNotice: reminderTiming,
          snoozeDefault,
          timezone: userTimezone
        }
      })
    }).catch(() => {});

    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl space-y-5 text-left max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">Notification Settings</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Automated Web Push & In-App Relationship Reminders</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Push Notifications Toggle Card */}
        <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <span>System Web Push Notifications</span>
                {pushStatus.isSubscribed ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold">
                    Active
                  </span>
                ) : pushStatus.permission === 'denied' ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-mono font-bold">
                    Blocked in Browser
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono">
                    Off
                  </span>
                )}
              </span>
              <p className="text-[11px] text-zinc-400">
                Receive reminders on Android, iOS (Installed PWA), and Desktop even when the app is closed.
              </p>
            </div>

            <button
              type="button"
              disabled={isLoading || !pushStatus.isSupported}
              onClick={handleTogglePush}
              className={`
                px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0
                ${pushStatus.isSubscribed
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                }
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {isLoading ? 'Updating...' : pushStatus.isSubscribed ? 'Turn Off' : 'Enable'}
            </button>
          </div>

          {pushStatus.permission === 'denied' && (
            <div className="text-[11px] text-amber-400 bg-amber-950/30 border border-amber-900/40 p-2.5 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Notification permissions are blocked in your browser settings. To enable, click the lock or site settings icon beside the URL in your browser and allow notifications.
              </span>
            </div>
          )}

          {pushStatus.isSubscribed && (
            <div className="pt-2 border-t border-zinc-900 flex items-center justify-between gap-2">
              <span className="text-[11px] text-zinc-500 font-mono flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                VAPID Verified Device
              </span>

              <button
                type="button"
                onClick={handleSendTestPush}
                disabled={isLoading}
                className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-zinc-900 border border-indigo-500/30 transition-all cursor-pointer"
              >
                <Send className="w-3 h-3" />
                Send Test Notification
              </button>
            </div>
          )}

          {testResult && (
            <div className="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-900/40 p-2.5 rounded-xl animate-fade-in flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{testResult}</span>
            </div>
          )}
        </div>

        {/* 2. Timing & Preferred Hour */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase font-mono block">
              Preferred Delivery Time
            </label>
            <input 
              type="time" 
              value={preferredTime}
              onChange={e => setPreferredTime(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-indigo-500"
            />
            <p className="text-[10px] text-zinc-500">
              Daily reminders trigger after this hour (Timezone: {userTimezone}).
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase font-mono block">
              Advance Notice
            </label>
            <select
              value={reminderTiming}
              onChange={e => setReminderTiming(e.target.value as any)}
              className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500"
            >
              <option value="on-time">On the scheduled maintenance day</option>
              <option value="1-hour">1 hour before preferred time</option>
              <option value="1-day">1 day before scheduled date</option>
            </select>
            <p className="text-[10px] text-zinc-500">
              When to trigger initial reminder notice.
            </p>
          </div>
        </div>

        {/* 3. In-App Notifications & Snooze Config */}
        <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">In-App Pop-up Banners</span>
              <span className="text-[11px] text-zinc-400">Display summary toast when entering app with due contacts</span>
            </div>
            <input 
              type="checkbox"
              checked={enableInApp}
              onChange={e => setEnableInApp(e.target.checked)}
              className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          <div className="pt-2 border-t border-zinc-900 flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-white block">Default Snooze Duration</span>
              <span className="text-[11px] text-zinc-400">Delay reminder when selecting "Remind Later"</span>
            </div>
            <select
              value={snoozeDefault}
              onChange={e => setSnoozeDefault(e.target.value as any)}
              className="bg-zinc-900 border border-zinc-800 text-white rounded-xl px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500"
            >
              <option value="1-hour">1 Hour</option>
              <option value="1-day">Tomorrow (24 Hours)</option>
              <option value="3-days">3 Days</option>
            </select>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSavePreferences}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
