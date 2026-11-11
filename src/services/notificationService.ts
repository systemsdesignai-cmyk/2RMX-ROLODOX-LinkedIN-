import { Contact } from '../types';

export interface PushStatus {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  endpoint?: string;
  error?: string;
}

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
 * Checks if browser supports Notifications and Service Worker Push API
 */
export function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/**
 * Retrieves current Push status
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
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return {
      isSupported: true,
      permission,
      isSubscribed: !!sub,
      endpoint: sub?.endpoint
    };
  } catch (err: any) {
    return {
      isSupported: true,
      permission,
      isSubscribed: false,
      error: err?.message
    };
  }
}

/**
 * Requests Notification permission and registers Web Push subscription with backend
 */
export async function subscribeToPush(): Promise<{ success: boolean; error?: string }> {
  if (!isPushSupported()) {
    return { success: false, error: 'Web Push is not supported in this browser environment.' };
  }

  try {
    // 1. Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, error: 'Notification permission was not granted.' };
    }

    // 2. Fetch server VAPID public key
    const keyRes = await fetch('/api/notifications/vapid-public-key');
    if (!keyRes.ok) {
      throw new Error('Failed to fetch VAPID public key from server');
    }
    const { publicKey } = await keyRes.json();
    if (!publicKey) {
      throw new Error('Server returned an empty VAPID key');
    }

    // 3. Register push with ServiceWorker
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });
    }

    // 4. Send subscription to server
    const subRes = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: sub })
    });

    if (!subRes.ok) {
      throw new Error('Failed to register push subscription on server');
    }

    return { success: true };
  } catch (err: any) {
    console.error('Failed to subscribe to Web Push:', err);
    return { success: false, error: err?.message || 'Failed to enable push notifications' };
  }
}

/**
 * Unsubscribes from Web Push
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint })
      });
      await sub.unsubscribe();
    }
    return true;
  } catch (err) {
    console.error('Error unsubscribing:', err);
    return false;
  }
}

/**
 * Synchronizes contacts' maintenance due dates with the backend reminder engine
 */
export async function syncContactRemindersWithBackend(contacts: Contact[]): Promise<boolean> {
  try {
    const reminders = contacts.map(c => {
      // Calculate next due date
      const cadence = c.maintenanceCadenceDays || 14;
      let nextDue = c.nextFollowUpDate;

      if (!nextDue) {
        if (c.lastMaintainedDate) {
          const d = new Date(c.lastMaintainedDate);
          d.setDate(d.getDate() + cadence);
          nextDue = d.toISOString().split('T')[0];
        } else {
          // If never maintained, due today
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
    console.warn('Could not sync reminders with backend scheduler:', err);
    return false;
  }
}

/**
 * Triggers a test push notification to verify device connectivity
 */
export async function triggerTestPush(): Promise<{ success: boolean; sent?: number; error?: string }> {
  try {
    const res = await fetch('/api/notifications/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '🔔 Rolodox Test Push Notification',
        body: 'Success! Your device is linked and will receive automated relationship follow-up reminders.'
      })
    });
    const data = await res.json();
    return { success: data.success, sent: data.sent };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Snooze a contact's maintenance reminder
 */
export async function snoozeContactReminder(contactId: number, hours: number = 24): Promise<boolean> {
  try {
    const res = await fetch('/api/notifications/snooze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactId, hours })
    });
    const data = await res.json();
    return !!data.success;
  } catch {
    return false;
  }
}
