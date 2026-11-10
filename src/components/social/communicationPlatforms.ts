import React from 'react';
import { SocialPlatform, CommunicationChannel, Contact } from '../../types';

export interface PlatformConfig {
  id: SocialPlatform;
  name: string;
  placeholder: string;
  example: string;
  brandColor: string;
  brandBg: string;
  brandBorder: string;
  badgeBg: string;
  normalize: (input: string) => { value: string; url: string; isValid: boolean; error?: string };
}

// Helper to strip whitespace and common symbols
const cleanDigits = (str: string) => str.replace(/[\s+()\-]/g, '');

export const PLATFORM_CONFIGS: Record<SocialPlatform, PlatformConfig> = {
  whatsapp: {
    id: 'whatsapp',
    name: 'WhatsApp',
    placeholder: '+27 82 123 4567 or wa.me/27821234567',
    example: '+27 82 123 4567',
    brandColor: '#25D366',
    brandBg: 'bg-[#25D366]/15 hover:bg-[#25D366]/25',
    brandBorder: 'border-[#25D366]/40',
    badgeBg: 'bg-[#25D366]/20 text-[#25D366]',
    normalize: (input: string) => {
      const trimmed = input.trim();
      if (!trimmed) return { value: '', url: '', isValid: false };

      // Handle wa.me URL directly
      const waMatch = trimmed.match(/(?:https?:\/\/)?wa\.me\/(\d+)/i);
      if (waMatch) {
        const digits = waMatch[1];
        return {
          value: `+${digits}`,
          url: `https://wa.me/${digits}`,
          isValid: digits.length >= 7
        };
      }

      const digits = cleanDigits(trimmed);
      if (digits.length < 7) {
        return {
          value: trimmed,
          url: '',
          isValid: false,
          error: 'Please include country code with at least 7 digits (e.g. +27 82 123 4567 or +1 555 019 2834).'
        };
      }

      return {
        value: trimmed.startsWith('+') ? trimmed : `+${digits}`,
        url: `https://wa.me/${digits}`,
        isValid: true
      };
    }
  },

  instagram: {
    id: 'instagram',
    name: 'Instagram',
    placeholder: '@username or instagram.com/username',
    example: '@alex_mercer',
    brandColor: '#E1306C',
    brandBg: 'bg-[#E1306C]/15 hover:bg-[#E1306C]/25',
    brandBorder: 'border-[#E1306C]/40',
    badgeBg: 'bg-[#E1306C]/20 text-[#E1306C]',
    normalize: (input: string) => {
      let trimmed = input.trim();
      if (!trimmed) return { value: '', url: '', isValid: false };

      // Extract username from full URL
      const urlMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9._]+)/i);
      if (urlMatch) {
        const handle = urlMatch[1].replace(/\/$/, '');
        return {
          value: `@${handle}`,
          url: `https://instagram.com/${handle}`,
          isValid: true
        };
      }

      const handle = trimmed.replace(/^@/, '').trim();
      if (!/^[a-zA-Z0-9._]{1,30}$/.test(handle)) {
        return {
          value: trimmed,
          url: '',
          isValid: false,
          error: 'Instagram usernames must be 1-30 alphanumeric characters, underscores, or periods.'
        };
      }

      return {
        value: `@${handle}`,
        url: `https://instagram.com/${handle}`,
        isValid: true
      };
    }
  },

  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    placeholder: 'linkedin.com/in/username or username',
    example: 'linkedin.com/in/alex-mercer',
    brandColor: '#0A66C2',
    brandBg: 'bg-[#0A66C2]/15 hover:bg-[#0A66C2]/25',
    brandBorder: 'border-[#0A66C2]/40',
    badgeBg: 'bg-[#0A66C2]/20 text-[#0A66C2]',
    normalize: (input: string) => {
      let trimmed = input.trim();
      if (!trimmed) return { value: '', url: '', isValid: false };

      if (/^https?:\/\//i.test(trimmed)) {
        return {
          value: trimmed.replace(/^https?:\/\/(?:www\.)?linkedin\.com\/in\//i, '').replace(/\/$/, '') || 'LinkedIn Profile',
          url: trimmed,
          isValid: true
        };
      }

      if (/^linkedin\.com\/in\//i.test(trimmed)) {
        return {
          value: trimmed.replace(/^linkedin\.com\/in\//i, '').replace(/\/$/, ''),
          url: `https://${trimmed}`,
          isValid: true
        };
      }

      const cleanHandle = trimmed.replace(/^@/, '').replace(/^in\//, '').trim();
      return {
        value: cleanHandle,
        url: `https://linkedin.com/in/${cleanHandle}`,
        isValid: cleanHandle.length > 0
      };
    }
  },

  telegram: {
    id: 'telegram',
    name: 'Telegram',
    placeholder: '@username or t.me/username',
    example: '@alex_mercer',
    brandColor: '#229ED9',
    brandBg: 'bg-[#229ED9]/15 hover:bg-[#229ED9]/25',
    brandBorder: 'border-[#229ED9]/40',
    badgeBg: 'bg-[#229ED9]/20 text-[#229ED9]',
    normalize: (input: string) => {
      let trimmed = input.trim();
      if (!trimmed) return { value: '', url: '', isValid: false };

      const urlMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?t\.me\/([a-zA-Z0-9_]+)/i);
      if (urlMatch) {
        const handle = urlMatch[1];
        return {
          value: `@${handle}`,
          url: `https://t.me/${handle}`,
          isValid: true
        };
      }

      const handle = trimmed.replace(/^@/, '').trim();
      if (!/^[a-zA-Z0-9_]{3,32}$/.test(handle)) {
        return {
          value: trimmed,
          url: '',
          isValid: false,
          error: 'Telegram username must be 3-32 alphanumeric characters or underscores.'
        };
      }

      return {
        value: `@${handle}`,
        url: `https://t.me/${handle}`,
        isValid: true
      };
    }
  },

  x: {
    id: 'x',
    name: 'X (Twitter)',
    placeholder: '@handle or x.com/handle',
    example: '@alex_mercer',
    brandColor: '#E2E8F0',
    brandBg: 'bg-zinc-800 hover:bg-zinc-700',
    brandBorder: 'border-zinc-700',
    badgeBg: 'bg-zinc-800 text-zinc-100',
    normalize: (input: string) => {
      let trimmed = input.trim();
      if (!trimmed) return { value: '', url: '', isValid: false };

      const urlMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?(?:x\.com|twitter\.com)\/([a-zA-Z0-9_]+)/i);
      if (urlMatch) {
        const handle = urlMatch[1];
        return {
          value: `@${handle}`,
          url: `https://x.com/${handle}`,
          isValid: true
        };
      }

      const handle = trimmed.replace(/^@/, '').trim();
      if (!/^[a-zA-Z0-9_]{1,15}$/.test(handle)) {
        return {
          value: trimmed,
          url: '',
          isValid: false,
          error: 'X handles must be 1-15 alphanumeric characters or underscores.'
        };
      }

      return {
        value: `@${handle}`,
        url: `https://x.com/${handle}`,
        isValid: true
      };
    }
  },

  facebook: {
    id: 'facebook',
    name: 'Facebook',
    placeholder: 'username or facebook.com/username',
    example: 'alex.mercer.dev',
    brandColor: '#1877F2',
    brandBg: 'bg-[#1877F2]/15 hover:bg-[#1877F2]/25',
    brandBorder: 'border-[#1877F2]/40',
    badgeBg: 'bg-[#1877F2]/20 text-[#1877F2]',
    normalize: (input: string) => {
      let trimmed = input.trim();
      if (!trimmed) return { value: '', url: '', isValid: false };

      if (/^https?:\/\//i.test(trimmed)) {
        return {
          value: trimmed.replace(/^https?:\/\/(?:www\.)?facebook\.com\//i, '').replace(/\/$/, '') || 'Facebook Profile',
          url: trimmed,
          isValid: true
        };
      }

      const clean = trimmed.replace(/^facebook\.com\//i, '').replace(/^@/, '').trim();
      return {
        value: clean,
        url: `https://facebook.com/${clean}`,
        isValid: clean.length > 0
      };
    }
  },

  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    placeholder: '@username or tiktok.com/@username',
    example: '@alex_tech',
    brandColor: '#EE1D52',
    brandBg: 'bg-[#EE1D52]/15 hover:bg-[#EE1D52]/25',
    brandBorder: 'border-[#EE1D52]/40',
    badgeBg: 'bg-[#EE1D52]/20 text-[#EE1D52]',
    normalize: (input: string) => {
      let trimmed = input.trim();
      if (!trimmed) return { value: '', url: '', isValid: false };

      const match = trimmed.match(/(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@([a-zA-Z0-9._]+)/i);
      if (match) {
        const handle = match[1];
        return {
          value: `@${handle}`,
          url: `https://tiktok.com/@${handle}`,
          isValid: true
        };
      }

      const handle = trimmed.replace(/^@/, '').trim();
      return {
        value: `@${handle}`,
        url: `https://tiktok.com/@${handle}`,
        isValid: handle.length > 0
      };
    }
  },

  youtube: {
    id: 'youtube',
    name: 'YouTube',
    placeholder: '@channel or youtube.com/@channel',
    example: '@AlexTechTalks',
    brandColor: '#FF0000',
    brandBg: 'bg-[#FF0000]/15 hover:bg-[#FF0000]/25',
    brandBorder: 'border-[#FF0000]/40',
    badgeBg: 'bg-[#FF0000]/20 text-[#FF0000]',
    normalize: (input: string) => {
      let trimmed = input.trim();
      if (!trimmed) return { value: '', url: '', isValid: false };

      if (/^https?:\/\//i.test(trimmed)) {
        return {
          value: trimmed.replace(/^https?:\/\/(?:www\.)?youtube\.com\//i, '').replace(/\/$/, '') || 'YouTube Channel',
          url: trimmed,
          isValid: true
        };
      }

      const clean = trimmed.replace(/^youtube\.com\//i, '').trim();
      const channelTag = clean.startsWith('@') ? clean : `@${clean}`;
      return {
        value: channelTag,
        url: `https://youtube.com/${channelTag}`,
        isValid: clean.length > 0
      };
    }
  },

  email: {
    id: 'email',
    name: 'Email',
    placeholder: 'name@company.com',
    example: 'alex.mercer@gmail.com',
    brandColor: '#818CF8',
    brandBg: 'bg-indigo-600/15 hover:bg-indigo-600/25',
    brandBorder: 'border-indigo-500/40',
    badgeBg: 'bg-indigo-600/20 text-indigo-400',
    normalize: (input: string) => {
      let trimmed = input.trim();
      if (!trimmed) return { value: '', url: '', isValid: false };

      const clean = trimmed.replace(/^mailto:/i, '').trim();
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean);

      return {
        value: clean,
        url: `mailto:${clean}`,
        isValid,
        error: isValid ? undefined : 'Please enter a valid email address (e.g. name@company.com).'
      };
    }
  },

  phone: {
    id: 'phone',
    name: 'Phone Call',
    placeholder: '+27 82 123 4567 or local number',
    example: '+27 82 123 4567',
    brandColor: '#10B981',
    brandBg: 'bg-emerald-600/15 hover:bg-emerald-600/25',
    brandBorder: 'border-emerald-500/40',
    badgeBg: 'bg-emerald-600/20 text-emerald-400',
    normalize: (input: string) => {
      let trimmed = input.trim();
      if (!trimmed) return { value: '', url: '', isValid: false };

      const raw = trimmed.replace(/^tel:/i, '').trim();
      const digits = cleanDigits(raw);

      if (digits.length < 5) {
        return {
          value: raw,
          url: '',
          isValid: false,
          error: 'Please enter a valid phone number.'
        };
      }

      const dialTarget = raw.startsWith('+') ? `+${digits}` : digits;
      return {
        value: raw,
        url: `tel:${dialTarget}`,
        isValid: true
      };
    }
  },

  custom: {
    id: 'custom',
    name: 'Custom Web Link',
    placeholder: 'https://example.com/profile',
    example: 'https://portfolio.dev',
    brandColor: '#38BDF8',
    brandBg: 'bg-sky-500/15 hover:bg-sky-500/25',
    brandBorder: 'border-sky-500/40',
    badgeBg: 'bg-sky-500/20 text-sky-300',
    normalize: (input: string) => {
      let trimmed = input.trim();
      if (!trimmed) return { value: '', url: '', isValid: false };

      const url = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
      return {
        value: trimmed.replace(/^https?:\/\//i, '').replace(/\/$/, '') || trimmed,
        url,
        isValid: true
      };
    }
  }
};

/**
 * Migration & backward compatibility helper:
 * Extracts existing social channels or synthesizes from legacy fields (socials, whatsAppUrl)
 */
export function getContactChannels(contact: Contact): CommunicationChannel[] {
  if (contact.communicationChannels && contact.communicationChannels.length > 0) {
    return contact.communicationChannels;
  }

  const channels: CommunicationChannel[] = [];

  // Synthesize from legacy whatsAppUrl or socials.whatsapp
  if (contact.whatsAppUrl) {
    const norm = PLATFORM_CONFIGS.whatsapp.normalize(contact.whatsAppUrl);
    if (norm.isValid) {
      channels.push({
        id: `wa-legacy-${contact.id}`,
        platform: 'whatsapp',
        value: norm.value,
        url: norm.url,
        isPreferred: true // Default legacy active channel to preferred
      });
    }
  } else if (contact.socials?.whatsapp) {
    const norm = PLATFORM_CONFIGS.whatsapp.normalize(contact.socials.whatsapp);
    if (norm.isValid) {
      channels.push({
        id: `wa-legacy-socials-${contact.id}`,
        platform: 'whatsapp',
        value: norm.value,
        url: norm.url,
        isPreferred: true
      });
    }
  }

  // Synthesize from legacy socials.linkedin
  if (contact.socials?.linkedin) {
    const norm = PLATFORM_CONFIGS.linkedin.normalize(contact.socials.linkedin);
    if (norm.isValid) {
      channels.push({
        id: `li-legacy-${contact.id}`,
        platform: 'linkedin',
        value: norm.value,
        url: norm.url,
        isPreferred: channels.length === 0
      });
    }
  }

  return channels;
}
