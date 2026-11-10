import React from 'react';
import { CommunicationChannel, SocialPlatform } from '../../types';
import { PLATFORM_CONFIGS, getContactChannels } from './communicationPlatforms';
import { Star, ExternalLink, Phone, Mail, Globe } from 'lucide-react';

interface SocialContactIconsProps {
  channels?: CommunicationChannel[];
  size?: 'xs' | 'sm' | 'md' | 'lg';
  maxVisible?: number;
  showLabels?: boolean;
  align?: 'left' | 'right' | 'center';
  className?: string;
  onChannelClick?: (channel: CommunicationChannel) => void;
}

// Crisp, lightweight brand SVG vectors
export const PlatformBrandIcon: React.FC<{ platform: SocialPlatform; className?: string }> = ({
  platform,
  className = 'w-4 h-4'
}) => {
  switch (platform) {
    case 'whatsapp':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-label="WhatsApp">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.81 13.47 3.81 11.91C3.81 7.37 7.5 3.68 12.04 3.68C14.25 3.68 16.31 4.54 17.87 6.1C19.42 7.66 20.28 9.72 20.28 11.93C20.28 16.48 16.58 20.15 12.04 20.15ZM16.56 14.41C16.31 14.29 15.1 13.69 14.88 13.61C14.65 13.53 14.49 13.49 14.32 13.73C14.16 13.98 13.69 14.53 13.54 14.69C13.4 14.86 13.25 14.88 13 14.76C12.75 14.63 11.97 14.38 11.04 13.55C10.32 12.91 9.83 12.11 9.69 11.86C9.55 11.62 9.68 11.48 9.8 11.36C9.91 11.25 10.05 11.07 10.18 10.92C10.3 10.77 10.34 10.65 10.42 10.48C10.51 10.32 10.46 10.17 10.4 10.05C10.34 9.93 9.85 8.73 9.65 8.23C9.45 7.75 9.25 7.82 9.1 7.81H8.63C8.46 7.81 8.19 7.87 7.96 8.12C7.73 8.37 7.08 8.98 7.08 10.22C7.08 11.46 7.98 12.65 8.11 12.82C8.23 12.98 9.9 15.55 12.44 16.65C13.05 16.91 13.52 17.07 13.88 17.18C14.5 17.38 15.06 17.35 15.5 17.29C16 17.21 17.03 16.66 17.25 16.05C17.47 15.43 17.47 14.9 17.41 14.79C17.34 14.68 17.18 14.61 16.93 14.49L16.56 14.41Z" />
        </svg>
      );
    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-label="Instagram">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069ZM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0ZM12 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8ZM18.406 4.155a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-label="LinkedIn">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
        </svg>
      );
    case 'telegram':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-label="Telegram">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
        </svg>
      );
    case 'x':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-label="X">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case 'facebook':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-label="Facebook">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-label="TikTok">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 2.89 3.5 2.78 1.23-.03 2.37-.64 2.98-1.7.35-.58.5-1.27.5-1.95.03-4.63.01-9.26.01-13.89z" />
        </svg>
      );
    case 'youtube':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-label="YouTube">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case 'email':
      return <Mail className={className} />;
    case 'phone':
      return <Phone className={className} />;
    case 'custom':
    default:
      return <Globe className={className} />;
  }
};

export const SocialContactIcons: React.FC<SocialContactIconsProps> = ({
  channels = [],
  size = 'sm',
  maxVisible = 6,
  showLabels = false,
  align = 'left',
  className = '',
  onChannelClick
}) => {
  if (!channels || channels.length === 0) return null;

  // Sort channels so preferred channels are first, then remaining
  const sorted = [...channels].sort((a, b) => {
    if (a.isPreferred && !b.isPreferred) return -1;
    if (!a.isPreferred && b.isPreferred) return 1;
    return 0;
  });

  const visibleChannels = sorted.slice(0, maxVisible);
  const overflowCount = sorted.length - visibleChannels.length;

  const sizeClasses = {
    xs: {
      btn: 'w-7 h-7 text-xs',
      icon: 'w-3.5 h-3.5',
      star: 'w-2 h-2 -top-1 -right-1',
      gap: 'gap-1'
    },
    sm: {
      btn: 'w-8 h-8 text-xs',
      icon: 'w-4 h-4',
      star: 'w-2.5 h-2.5 -top-1 -right-1',
      gap: 'gap-1.5'
    },
    md: {
      btn: 'w-9 h-9 text-sm',
      icon: 'w-4.5 h-4.5',
      star: 'w-3 h-3 -top-1.5 -right-1.5',
      gap: 'gap-2'
    },
    lg: {
      btn: 'w-10 h-10 text-base',
      icon: 'w-5 h-5',
      star: 'w-3.5 h-3.5 -top-1.5 -right-1.5',
      gap: 'gap-2.5'
    }
  }[size];

  const alignClass = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end'
  }[align];

  return (
    <div className={`flex flex-wrap items-center ${alignClass} ${sizeClasses.gap} ${className}`}>
      {visibleChannels.map((channel) => {
        const config = PLATFORM_CONFIGS[channel.platform] || PLATFORM_CONFIGS.custom;
        const isPref = !!channel.isPreferred;

        const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
          e.stopPropagation(); // Prevent triggering parent card selection / drawer toggles
          if (onChannelClick) {
            onChannelClick(channel);
          }
        };

        return (
          <a
            key={channel.id}
            href={channel.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            title={`${config.name}: ${channel.value}${isPref ? ' (Preferred Method ★)' : ''}`}
            style={{
              color: config.brandColor,
              borderColor: isPref ? '#F59E0B' : undefined
            }}
            className={`
              group relative inline-flex items-center justify-center rounded-lg border transition-all duration-200
              ${sizeClasses.btn}
              ${isPref 
                ? 'bg-amber-400/10 border-amber-400/80 shadow-[0_0_10px_rgba(251,191,36,0.25)] ring-1 ring-amber-400/50 hover:bg-amber-400/20 hover:scale-105' 
                : 'bg-black/30 border-white/10 hover:border-white/25 hover:bg-white/10 hover:scale-105'
              }
              active:scale-95 cursor-pointer
            `}
          >
            <PlatformBrandIcon platform={channel.platform} className={sizeClasses.icon} />

            {/* Preferred Star Badge */}
            {isPref && (
              <span 
                className={`absolute ${sizeClasses.star} flex items-center justify-center rounded-full bg-amber-400 text-black shadow-sm ring-1 ring-black/40`}
                title="Preferred Communication Channel"
              >
                <Star className="w-2 h-2 fill-black stroke-black" />
              </span>
            )}

            {/* Optional text label */}
            {showLabels && (
              <span className="ml-1.5 font-medium text-xs text-zinc-200 truncate max-w-[120px]">
                {channel.customLabel || channel.value}
              </span>
            )}
          </a>
        );
      })}

      {/* Overflow Badge */}
      {overflowCount > 0 && (
        <span 
          className={`
            inline-flex items-center justify-center rounded-lg border border-white/10 bg-black/40 text-zinc-400 font-semibold
            ${sizeClasses.btn}
          `}
          title={`${overflowCount} more channel${overflowCount > 1 ? 's' : ''}`}
        >
          +{overflowCount}
        </span>
      )}
    </div>
  );
};
