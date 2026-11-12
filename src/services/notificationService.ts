import { Contact } from '../types';

export interface PushStatus {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  mode?: 'server' | 'device';
  endpoint?: string;
  error?: string;
}

// Embedded production-grade VAPID fallback public key (RFC 8292 standard P-256)
const DEFAULT_VAPID_PUBLIC_KEY = 'BKs5orIKiAe5KD8t3TianF0FuDMSSmkvNB7xDfMckeZfCx3gmCXJEn66MxstLXcll1NWy0-vHJGylmVg6FeBfRU';

// Convert VAPID base64 public key to Uint8Array for pushManager
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Checks if browser supports Notifications and Service Worker
 */
export function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Retrieves current Notification status (Server Web Push or Device Notification)
 */
export async function getPushStatus(): Promise<PushStatus> {
  if (!isPushSupported()) {
    return {
      isSupported: false,
      permission: 'denied',
      isSubscribed: false
    };
  }

  const permission = Notification.permission;
  const isLocallyEnabled = localStorage.getItem('rolodox_notifications_enabled') === 'true';

  try {
    const reg = await navigator.serviceWorker.ready.catch(() => null);
    let sub: PushSubscription | null = null;
    if (reg && 'pushManager' in reg) {
      sub = await reg.pushManager.getSubscription().catch(() => null);
    }

    const isSubscribed = permission === 'granted' && (!!sub || isLocallyEnabled);

    return {
      isSupported: true,
      permission,
      isSubscribed,
      mode: sub ? 'server' : 'device',
      endpoint: sub?.endpoint
    };
  } catch (err: any) {
    return {
      isSupported: true,
      permission,
      isSubscribed: permission === 'granted' && isLocallyEnabled,
      mode: 'device',
      error: err?.message
    };
  }
}

/**
 * Requests Notification permission and activates notifications.
 * Seamlessly handles both backend server environments and static hosting (e.g., Vercel, PWA).
 */
export async function subscribeToPush(): Promise<{ success: boolean; mode?: 'server' | 'device'; error?: string }> {
  if (!isPushSupported()) {
    return { success: false, error: 'Notifications are not supported in this browser environment.' };
  }

  try {
    // 1. Request native browser notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { 
        success: false, 
        error: permission === 'denied' 
          ? 'Notification permission was denied. Please allow notifications in your browser settings.' 
          : 'Notification permission was dismissed.' 
      };
    }

    // Mark notifications as enabled locally
    localStorage.setItem('rolodox_notifications_enabled', 'true');

    // 2. Attempt to fetch server VAPID public key with timeout
    let publicKey = DEFAULT_VAPID_PUBLIC_KEY;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const keyRes = await fetch('/api/notifications/vapid-public-key', {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (keyRes.ok) {
        const contentType = keyRes.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await keyRes.json();
          if (data && data.publicKey) {
            publicKey = data.publicKey;
          }
        }
      }
    } catch (e) {
      // Backend not available (e.g. Vercel static deployment or offline); fallback to embedded VAPID key
      console.info('Backend VAPID endpoint unavailable, using autonomous device notification mode.');
    }

    // 3. Register push with ServiceWorker PushManager if supported
    let sub: PushSubscription | null = null;
    try {
      const reg = await navigator.serviceWorker.ready.catch(() => null);
      if (reg && 'pushManager' in reg) {
        sub = await reg.pushManager.getSubscription().catch(() => null);
        
        if (!sub && publicKey) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey)
          }).catch((err) => {
            console.warn('PushManager subscription skipped; device system notification mode is active.', err);
            return null;
          });
        }
      }
    } catch (pushErr) {
      console.warn('PushManager registration fallback:', pushErr);
    }

    // 4. Send subscription to server if backend is active
    if (sub) {
      fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub })
      }).catch(() => {});
    }

    return { success: true, mode: sub ? 'server' : 'device' };
  } catch (err: any) {
    console.error('Failed to subscribe to notifications:', err);
    return { success: false, error: err?.message || 'Failed to enable notifications' };
  }
}

/**
 * Unsubscribes from Notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  localStorage.removeItem('rolodox_notifications_enabled');
  if (!isPushSupported()) return false;

  try {
    const reg = await navigator.serviceWorker.ready.catch(() => null);
    if (reg && 'pushManager' in reg) {
      const sub = await reg.pushManager.getSubscription().catch(() => null);
      if (sub) {
        fetch('/api/notifications/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint })
        }).catch(() => {});
        await sub.unsubscribe().catch(() => {});
      }
    }
    return true;
  } catch (err) {
    console.error('Error unsubscribing:', err);
    return false;
  }
}

/**
 * Dispatches an immediate test notification to verify device alerts.
 * Works seamlessly across server push and direct device system notifications.
 */
export async function triggerTestPush(): Promise<{ success: boolean; sent?: number; error?: string }> {
  try {
    // 1. Try server-side push if reachable
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const res = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '🔔 Rolodox Test Push Notification',
          body: 'Success! Your device is linked and will receive automated relationship follow-up reminders.'
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (data && data.success && data.sent > 0) {
            return { success: true, sent: data.sent };
          }
        }
      }
    } catch {
      // Backend test push unreachable; proceed to direct device notification
    }

    // 2. Direct Service Worker / System Notification (works offline, Vercel, PWA, etc.)
    const reg = await navigator.serviceWorker.ready.catch(() => null);
    if (reg && 'showNotification' in reg) {
      await reg.showNotification('🔔 Rolodox Test Push Notification', {
        body: 'Success! Your device is linked and will receive automated relationship follow-up reminders.',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        vibrate: [150, 80, 150],
        tag: 'rolodox-test-push',
        renotify: true,
        data: {
          url: '/'
        }
      });
      return { success: true, sent: 1 };
    } else if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('🔔 Rolodox Test Push Notification', {
        body: 'Success! Your device is linked and will receive automated relationship follow-up reminders.',
        icon: '/pwa-192x192.png'
      });
      return { success: true, sent: 1 };
    }

    return { success: false, error: 'Notification display permission not granted' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Evaluates contacts and dispatches native system notifications for due/overdue relationships.
 * Autonomous client engine that works even without a backend server.
 */
export async function checkAndDispatchDueReminders(contacts: Contact[]): Promise<number> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 0;
  if (Notification.permission !== 'granted') return 0;

  const isEnabled = localStorage.getItem('rolodox_notifications_enabled') === 'true';
  if (!isEnabled) return 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const notifiedContactsKey = `rolodox_notified_${todayStr}`;
  
  let notifiedIds: number[] = [];
  try {
    const raw = localStorage.getItem(notifiedContactsKey);
    if (raw) notifiedIds = JSON.parse(raw);
  } catch {}

  const reg = await navigator.serviceWorker.ready.catch(() => null);
  let dispatchedCount = 0;

  for (const contact of contacts) {
    if (notifiedIds.includes(contact.id)) continue;

    // Check snooze
    const snoozeUntil = localStorage.getItem(`rolodox_snooze_${contact.id}`);
    if (snoozeUntil && new Date(snoozeUntil).getTime() > Date.now()) {
      continue;
    }

    const cadence = contact.maintenanceCadenceDays || 14;
    let isDue = false;

    if (contact.nextFollowUpDate) {
      isDue = contact.nextFollowUpDate <= todayStr;
    } else if (contact.lastMaintainedDate) {
      const lastD = new Date(contact.lastMaintainedDate);
      const dueD = new Date(lastD);
      dueD.setDate(dueD.getDate() + cadence);
      isDue = dueD.toISOString().split('T')[0] <= todayStr;
    } else {
      isDue = true; // Never maintained
    }

    if (isDue) {
      const preferred = (contact.communicationChannels || []).find(ch => ch.isPreferred)?.platform;
      const channelText = preferred ? ` via ${preferred}` : '';
      const title = `🔔 Follow up with ${contact.name}`;
      const body = `Relationship follow-up is due${channelText}. Tap to view maintenance actions.`;

      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, {
          body,
          icon: contact.avatar || '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          vibrate: [150, 80, 150],
          tag: `maint-${contact.id}`,
          renotify: true,
          data: {
            url: `/?openMaintenanceContact=${contact.id}`,
            contactId: contact.id
          }
        });
      } else {
        new Notification(title, {
          body,
          icon: contact.avatar || '/pwa-192x192.png'
        });
      }

      notifiedIds.push(contact.id);
      dispatchedCount++;
    }
  }

  try {
    localStorage.setItem(notifiedContactsKey, JSON.stringify(notifiedIds));
  } catch {}

  return dispatchedCount;
}

/**
 * Synchronizes contacts' maintenance due dates with the backend reminder engine
 */
export async function syncContactRemindersWithBackend(contacts: Contact[]): Promise<boolean> {
  // 1. Run local autonomous notification evaluator
  checkAndDispatchDueReminders(contacts).catch(() => {});

  // 2. Sync to server if backend is active
  try {
    const reminders = contacts.map(c => {
      const cadence = c.maintenanceCadenceDays || 14;
      let nextDue = c.nextFollowUpDate;

      if (!nextDue) {
        if (c.lastMaintainedDate) {
          const d = new Date(c.lastMaintainedDate);
          d.setDate(d.getDate() + cadence);
          nextDue = d.toISOString().split('T')[0];
        } else {
          nextDue = new Date().toISOString().split('T')[0];
        }
      }

      return {
        contactId: c.id,
        contactName: c.name,
        contactTitle: c.title,
        cadenceDays: cadence,
        lastMaintainedDate: c.lastMaintainedDate,
        nextDueDate: nextDue,
        preferredChannels: (c.communicationChannels || []).filter(ch => ch.isPreferred).map(ch => ch.platform)
      };
    });

    const res = await fetch('/api/notifications/sync-reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reminders })
    });

    return res.ok;
  } catch (err) {
    return false;
  }
}

/**
 * Snooze a contact's maintenance reminder
 */
export async function snoozeContactReminder(contactId: number, hours: number = 24): Promise<boolean> {
  const snoozeUntil = new Date(Date.now() + hours * 3600 * 1000).toISOString();
  try {
    localStorage.setItem(`rolodox_snooze_${contactId}`, snoozeUntil);
  } catch {}

  // Also notify server if backend is running
  fetch('/api/notifications/snooze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contactId, hours })
  }).catch(() => {});

  return true;
}

