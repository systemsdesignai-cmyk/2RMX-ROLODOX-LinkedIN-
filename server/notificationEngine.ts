import * as webpushModule from 'web-push';
import fs from 'fs';
import path from 'path';

const webpush: any = (webpushModule as any).default || webpushModule;

export interface PushSubscriptionItem {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: string;
  userAgent?: string;
}

export interface ContactReminderItem {
  contactId: number;
  contactName: string;
  contactTitle?: string;
  cadenceDays: number;
  lastMaintainedDate?: string;
  nextDueDate: string;
  preferredChannels?: string[];
  snoozedUntil?: string; // ISO date string
  lastNotifiedDate?: string; // Date string (YYYY-MM-DD)
}

export interface NotificationSettings {
  enabled: boolean;
  preferredTimeOfDay: string; // e.g. "09:00"
  advanceNotice: 'on-time' | '1-hour' | '1-day';
  snoozeDefault: '1-hour' | '1-day' | '3-days';
  timezone: string;
}

interface ServerDataStore {
  subscriptions: PushSubscriptionItem[];
  reminders: ContactReminderItem[];
  settings: NotificationSettings;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'notifications-store.json');
const VAPID_FILE = path.join(DATA_DIR, 'vapid-keys.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 1. Initialize or load VAPID Keys
export function getOrCreateVapidKeys() {
  const envPublic = process.env.VAPID_PUBLIC_KEY;
  const envPrivate = process.env.VAPID_PRIVATE_KEY;
  const envSubject = process.env.VAPID_SUBJECT || 'mailto:admin@rolodox.local';

  if (envPublic && envPrivate) {
    webpush.setVapidDetails(envSubject, envPublic, envPrivate);
    return { publicKey: envPublic, privateKey: envPrivate, subject: envSubject };
  }

  // Load from file or generate new
  if (fs.existsSync(VAPID_FILE)) {
    try {
      const saved = JSON.parse(fs.readFileSync(VAPID_FILE, 'utf-8'));
      if (saved.publicKey && saved.privateKey) {
        webpush.setVapidDetails(saved.subject || envSubject, saved.publicKey, saved.privateKey);
        return saved;
      }
    } catch (e) {
      console.warn('Could not read existing VAPID file, generating fresh keys.');
    }
  }

  const generated = webpush.generateVAPIDKeys();
  const vapidData = {
    publicKey: generated.publicKey,
    privateKey: generated.privateKey,
    subject: envSubject
  };

  fs.writeFileSync(VAPID_FILE, JSON.stringify(vapidData, null, 2), 'utf-8');
  webpush.setVapidDetails(vapidData.subject, vapidData.publicKey, vapidData.privateKey);
  console.log('Generated fresh VAPID keys for Web Push notifications.');
  return vapidData;
}

// 2. Load / Save persistent store
function loadStore(): ServerDataStore {
  const defaultStore: ServerDataStore = {
    subscriptions: [],
    reminders: [],
    settings: {
      enabled: true,
      preferredTimeOfDay: '09:00',
      advanceNotice: 'on-time',
      snoozeDefault: '1-day',
      timezone: 'UTC'
    }
  };

  if (fs.existsSync(DATA_FILE)) {
    try {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return { ...defaultStore, ...JSON.parse(content) };
    } catch (err) {
      console.error('Error loading notification store, using defaults:', err);
    }
  }
  return defaultStore;
}

function saveStore(store: ServerDataStore) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving notification store:', err);
  }
}

// In-memory working copy
let store = loadStore();
const vapidKeys = getOrCreateVapidKeys();

export function getVapidPublicKey() {
  return vapidKeys.publicKey;
}

export function getNotificationSettings() {
  return store.settings;
}

export function updateNotificationSettings(newSettings: Partial<NotificationSettings>) {
  store.settings = { ...store.settings, ...newSettings };
  saveStore(store);
  return store.settings;
}

export function addSubscription(sub: PushSubscriptionItem) {
  // Prune any existing matching endpoint
  store.subscriptions = store.subscriptions.filter(s => s.endpoint !== sub.endpoint);
  store.subscriptions.push(sub);
  saveStore(store);
  console.log(`[Push Notification] Registered subscription (Total: ${store.subscriptions.length})`);
  return { success: true, total: store.subscriptions.length };
}

export function removeSubscription(endpoint: string) {
  store.subscriptions = store.subscriptions.filter(s => s.endpoint !== endpoint);
  saveStore(store);
  console.log(`[Push Notification] Removed subscription (Total: ${store.subscriptions.length})`);
  return { success: true };
}

export function syncReminders(reminders: ContactReminderItem[]) {
  // Merge reminders preserving existing lastNotifiedDate and snoozedUntil if dates haven't changed
  const existingMap = new Map<number, ContactReminderItem>();
  store.reminders.forEach(r => existingMap.set(r.contactId, r));

  const updatedReminders: ContactReminderItem[] = reminders.map(newRem => {
    const prev = existingMap.get(newRem.contactId);
    if (!prev) return newRem;

    // If nextDueDate has moved forward (e.g. maintained or rescheduled), reset lastNotifiedDate
    const isRescheduled = prev.nextDueDate !== newRem.nextDueDate;
    return {
      ...newRem,
      lastNotifiedDate: isRescheduled ? undefined : prev.lastNotifiedDate,
      snoozedUntil: isRescheduled ? undefined : prev.snoozedUntil
    };
  });

  store.reminders = updatedReminders;
  saveStore(store);
  console.log(`[Notification Engine] Synced ${store.reminders.length} contact reminders`);
  return { count: store.reminders.length };
}

export function snoozeReminder(contactId: number, snoozeHours: number) {
  const target = store.reminders.find(r => r.contactId === contactId);
  if (!target) return { success: false, error: 'Contact reminder not found' };

  const snoozeDate = new Date();
  snoozeDate.setHours(snoozeDate.getHours() + snoozeHours);
  target.snoozedUntil = snoozeDate.toISOString();
  // Clear lastNotifiedDate so it can notify when snooze expires
  target.lastNotifiedDate = undefined;

  saveStore(store);
  console.log(`[Notification Engine] Snoozed reminder for Contact #${contactId} until ${target.snoozedUntil}`);
  return { success: true, snoozedUntil: target.snoozedUntil };
}

// 3. Dispatch Web Push Notification
export async function sendPushToAll(payload: {
  title: string;
  body: string;
  icon?: string;
  contactId?: number;
  action?: string;
}) {
  if (store.subscriptions.length === 0) {
    console.log('[Push Notification] No subscriptions registered to receive push.');
    return { sent: 0, failed: 0 };
  }

  const message = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    contactId: payload.contactId,
    action: payload.action || 'maintain',
    url: payload.contactId ? `/?openMaintenanceContact=${payload.contactId}` : '/',
    timestamp: Date.now()
  });

  let sent = 0;
  let failed = 0;
  const deadEndpoints = new Set<string>();

  await Promise.all(
    store.subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys
          },
          message,
          {
            TTL: 60 * 60 * 24 // 24 hours
          }
        );
        sent++;
      } catch (err: any) {
        failed++;
        console.warn(`[Push Notification] Error sending to ${sub.endpoint.slice(0, 30)}... :`, err?.statusCode || err?.message);
        // Prune unsubscribed or expired endpoints (410 Gone or 404 Not Found)
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          deadEndpoints.add(sub.endpoint);
        }
      }
    })
  );

  if (deadEndpoints.size > 0) {
    store.subscriptions = store.subscriptions.filter(s => !deadEndpoints.has(s.endpoint));
    saveStore(store);
    console.log(`[Push Notification] Pruned ${deadEndpoints.size} expired subscriptions.`);
  }

  return { sent, failed };
}

// 4. Background Reminder Evaluator
export async function processDueReminders() {
  if (!store.settings.enabled) return;
  if (store.subscriptions.length === 0 && store.reminders.length === 0) return;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  for (const reminder of store.reminders) {
    // 1. Check if snoozed
    if (reminder.snoozedUntil) {
      const snoozeTime = new Date(reminder.snoozedUntil);
      if (now < snoozeTime) {
        // Still snoozed, skip
        continue;
      }
    }

    // 2. Check if due today or overdue
    const isDue = reminder.nextDueDate <= todayStr;
    if (!isDue) continue;

    // 3. Idempotency check: Already notified today?
    if (reminder.lastNotifiedDate === todayStr) {
      continue;
    }

    // 4. Time of day check: only trigger if current time >= preferredTimeOfDay
    const [prefHour, prefMin] = (store.settings.preferredTimeOfDay || '09:00').split(':').map(Number);
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const isPastPreferredTime = currentHour > prefHour || (currentHour === prefHour && currentMin >= prefMin);

    // If snoozed expired, trigger immediately regardless of time of day
    const isSnoozeExpired = !!reminder.snoozedUntil && now >= new Date(reminder.snoozedUntil);

    if (isPastPreferredTime || isSnoozeExpired) {
      console.log(`[Notification Engine] Triggering due push for ${reminder.contactName} (Due: ${reminder.nextDueDate})`);

      const overdueDays = Math.max(0, Math.floor((now.getTime() - new Date(reminder.nextDueDate).getTime()) / (1000 * 60 * 60 * 24)));
      const overdueText = overdueDays > 0 ? ` (Overdue by ${overdueDays}d)` : ' (Due today)';

      await sendPushToAll({
        title: `🔔 Follow-up Reminder: ${reminder.contactName}`,
        body: `${reminder.contactName} is due for relationship maintenance${overdueText}. Tap to check in via preferred channels.`,
        contactId: reminder.contactId
      });

      // Mark as notified today to prevent duplicate spam
      reminder.lastNotifiedDate = todayStr;
      reminder.snoozedUntil = undefined;
      saveStore(store);
    }
  }
}

// 5. Start background worker (evaluates every 60 seconds)
let intervalHandle: NodeJS.Timeout | null = null;
export function startReminderScheduler() {
  if (intervalHandle) return;

  console.log('[Notification Engine] Background reminder scheduler started (60s tick)');
  intervalHandle = setInterval(() => {
    processDueReminders().catch(err => {
      console.error('[Notification Engine] Error processing due reminders:', err);
    });
  }, 60 * 1000);

  // Run immediately on boot
  processDueReminders().catch(err => {
    console.error('[Notification Engine] Error in initial reminder check:', err);
  });
}

export function getEngineStats() {
  return {
    subscriptionsCount: store.subscriptions.length,
    remindersCount: store.reminders.length,
    settings: store.settings
  };
}
