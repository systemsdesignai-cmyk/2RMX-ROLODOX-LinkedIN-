export interface LocalBackupData {
  version: number;
  appName: string;
  exportedAt: string;
  data: {
    contacts?: any[];
    events?: any[];
    customFolders?: Record<string, string[]>;
    strategies?: any[];
    userProfile?: any;
    customSortBys?: string[];
  };
}

export const LOCAL_STORAGE_KEYS = {
  contacts: 'rolodox_contacts_v1',
  events: 'rolodox_events_v1',
  folders: 'rolodox_folders_v1',
  strategies: 'rolodox_strategies_v1',
  profile: 'rolodox_profile_v1',
  sortBys: 'rolodox_custom_sortbys_v1'
} as const;

/**
 * Exports all local data to a JSON file and prompts browser to save onto user's local drive
 */
export function exportLocalBackup(): { success: boolean; filename: string } {
  try {
    const backup: LocalBackupData = {
      version: 1,
      appName: 'Remix Rolodox',
      exportedAt: new Date().toISOString(),
      data: {
        contacts: getParsedItem(LOCAL_STORAGE_KEYS.contacts),
        events: getParsedItem(LOCAL_STORAGE_KEYS.events),
        customFolders: getParsedItem(LOCAL_STORAGE_KEYS.folders),
        strategies: getParsedItem(LOCAL_STORAGE_KEYS.strategies),
        userProfile: getParsedItem(LOCAL_STORAGE_KEYS.profile),
        customSortBys: getParsedItem(LOCAL_STORAGE_KEYS.sortBys)
      }
    };

    const jsonString = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `rolodox_local_backup_${dateStr}.json`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, filename };
  } catch (err) {
    console.error('Failed to export local backup:', err);
    throw err;
  }
}

/**
 * Parses and restores a backup JSON file from the user's local filesystem
 */
export function importLocalBackup(fileContent: string): LocalBackupData['data'] {
  try {
    const parsed = JSON.parse(fileContent) as LocalBackupData;

    if (!parsed || !parsed.data) {
      throw new Error('Invalid backup file format: Missing data payload.');
    }

    const { data } = parsed;

    if (Array.isArray(data.contacts)) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.contacts, JSON.stringify(data.contacts));
    }
    if (Array.isArray(data.events)) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.events, JSON.stringify(data.events));
    }
    if (data.customFolders && typeof data.customFolders === 'object') {
      localStorage.setItem(LOCAL_STORAGE_KEYS.folders, JSON.stringify(data.customFolders));
    }
    if (Array.isArray(data.strategies)) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.strategies, JSON.stringify(data.strategies));
    }
    if (data.userProfile && typeof data.userProfile === 'object') {
      localStorage.setItem(LOCAL_STORAGE_KEYS.profile, JSON.stringify(data.userProfile));
    }
    if (Array.isArray(data.customSortBys)) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.sortBys, JSON.stringify(data.customSortBys));
    }

    return data;
  } catch (err: any) {
    console.error('Failed to parse backup:', err);
    throw new Error(err?.message || 'Invalid backup file');
  }
}

/**
 * Calculates current local storage footprint
 */
export function getLocalStorageFootprint(): { sizeKB: number; totalContacts: number; totalEvents: number } {
  try {
    let totalBytes = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalBytes += (localStorage[key]?.length || 0) * 2; // UTF-16 approx 2 bytes
      }
    }

    const contacts = getParsedItem(LOCAL_STORAGE_KEYS.contacts) || [];
    const events = getParsedItem(LOCAL_STORAGE_KEYS.events) || [];

    return {
      sizeKB: Math.round((totalBytes / 1024) * 10) / 10,
      totalContacts: Array.isArray(contacts) ? contacts.length : 0,
      totalEvents: Array.isArray(events) ? events.length : 0
    };
  } catch {
    return { sizeKB: 0, totalContacts: 0, totalEvents: 0 };
  }
}

function getParsedItem(key: string) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
