import React, { useState } from 'react';
import { CommunicationChannel, SocialPlatform } from '../../types';
import { PLATFORM_CONFIGS } from './communicationPlatforms';
import { PlatformBrandIcon, SocialContactIcons } from './SocialContactIcons';
import { Plus, Trash2, Star, ExternalLink, AlertCircle, Check, Sparkles } from 'lucide-react';

interface ContactCommunicationEditorProps {
  channels: CommunicationChannel[];
  onChange: (channels: CommunicationChannel[]) => void;
  className?: string;
}

const ALL_PLATFORMS: SocialPlatform[] = [
  'whatsapp',
  'linkedin',
  'instagram',
  'telegram',
  'x',
  'email',
  'phone',
  'facebook',
  'tiktok',
  'youtube',
  'custom'
];

export const ContactCommunicationEditor: React.FC<ContactCommunicationEditorProps> = ({
  channels = [],
  onChange,
  className = ''
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>('whatsapp');
  const [inputValue, setInputValue] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [isPreferredNew, setIsPreferredNew] = useState(channels.length === 0);
  const [validationError, setValidationError] = useState<string | null>(null);

  const currentConfig = PLATFORM_CONFIGS[selectedPlatform] || PLATFORM_CONFIGS.custom;

  const handleAddChannel = () => {
    if (!inputValue.trim()) {
      setValidationError('Please enter a username, handle, phone number, or URL.');
      return;
    }

    const norm = currentConfig.normalize(inputValue);
    if (!norm.isValid) {
      setValidationError(norm.error || 'Invalid format for this platform.');
      return;
    }

    const newChannel: CommunicationChannel = {
      id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      platform: selectedPlatform,
      value: norm.value,
      url: norm.url,
      customLabel: selectedPlatform === 'custom' && customLabel.trim() ? customLabel.trim() : undefined,
      isPreferred: isPreferredNew
    };

    const updated = [...channels, newChannel];
    onChange(updated);

    // Reset input
    setInputValue('');
    setCustomLabel('');
    setValidationError(null);
    setIsPreferredNew(false);
  };

  const handleRemoveChannel = (id: string) => {
    const updated = channels.filter((c) => c.id !== id);
    onChange(updated);
  };

  const handleTogglePreferred = (id: string) => {
    const updated = channels.map((c) => {
      if (c.id === id) {
        return { ...c, isPreferred: !c.isPreferred };
      }
      return c;
    });
    onChange(updated);
  };

  const handleQuickAddPredefined = (plat: SocialPlatform) => {
    setSelectedPlatform(plat);
    setValidationError(null);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with live summary */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Communication Channels & Social Profiles
          </h4>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Add profiles, mark multiple preferred methods (★), and launch direct links.
          </p>
        </div>
        {channels.length > 0 && (
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-[11px] text-zinc-400">Card Preview:</span>
            <SocialContactIcons channels={channels} size="xs" />
          </div>
        )}
      </div>

      {/* Existing Channels List */}
      {channels.length > 0 && (
        <div className="space-y-2">
          {channels.map((channel) => {
            const config = PLATFORM_CONFIGS[channel.platform] || PLATFORM_CONFIGS.custom;
            const isPref = !!channel.isPreferred;

            return (
              <div
                key={channel.id}
                className={`
                  flex items-center justify-between p-2.5 rounded-xl border transition-all duration-150
                  ${isPref 
                    ? 'bg-amber-400/[0.04] border-amber-400/40 shadow-[0_0_8px_rgba(251,191,36,0.1)]' 
                    : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                  }
                `}
              >
                {/* Left: Icon + Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                    style={{
                      color: config.brandColor,
                      backgroundColor: `${config.brandColor}15`,
                      borderColor: `${config.brandColor}35`
                    }}
                  >
                    <PlatformBrandIcon platform={channel.platform} className="w-4 h-4" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-200">
                        {channel.customLabel || config.name}
                      </span>
                      {isPref && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          Preferred
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 truncate max-w-[180px] sm:max-w-xs font-mono mt-0.5">
                      {channel.value}
                    </p>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Test link */}
                  {channel.url && (
                    <a
                      href={channel.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                      title="Open link"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {/* Toggle Preferred button */}
                  <button
                    type="button"
                    onClick={() => handleTogglePreferred(channel.id)}
                    className={`
                      p-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1
                      ${isPref
                        ? 'text-amber-300 bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent'
                      }
                    `}
                    title={isPref ? 'Click to remove preferred status' : 'Mark as preferred communication method'}
                  >
                    <Star className={`w-3.5 h-3.5 ${isPref ? 'fill-amber-400 text-amber-400' : 'text-zinc-400'}`} />
                  </button>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveChannel(channel.id)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Remove channel"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add New Channel Box */}
      <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/60 space-y-3">
        <div className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5 text-[#007BFF]" />
          <span>Add Communication Channel</span>
        </div>

        {/* Quick Platform Selector Pill-bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {ALL_PLATFORMS.map((plat) => {
            const cfg = PLATFORM_CONFIGS[plat];
            const isSelected = selectedPlatform === plat;
            return (
              <button
                key={plat}
                type="button"
                onClick={() => handleQuickAddPredefined(plat)}
                className={`
                  px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 flex items-center gap-1.5 border transition-all
                  ${isSelected
                    ? 'border-[#007BFF] bg-[#007BFF]/20 text-white shadow-sm'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }
                `}
              >
                <div style={{ color: cfg.brandColor }}>
                  <PlatformBrandIcon platform={plat} className="w-3.5 h-3.5" />
                </div>
                <span>{cfg.name}</span>
              </button>
            );
          })}
        </div>

        {/* Custom label input if custom platform */}
        {selectedPlatform === 'custom' && (
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              Custom Platform / Website Name
            </label>
            <input
              type="text"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder="e.g. Portfolio, Substack, Discord"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-[#007BFF]"
            />
          </div>
        )}

        {/* Main identifier input */}
        <div>
          <label className="block text-[11px] font-medium text-zinc-400 mb-1">
            {currentConfig.name} Handle, Phone, or URL
          </label>
          <div className="relative">
            <div
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: currentConfig.brandColor }}
            >
              <PlatformBrandIcon platform={selectedPlatform} className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (validationError) setValidationError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddChannel();
                }
              }}
              placeholder={currentConfig.placeholder}
              className={`
                w-full bg-zinc-900 border rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none
                ${validationError ? 'border-red-500/80 focus:border-red-500' : 'border-zinc-800 focus:border-[#007BFF]'}
              `}
            />
          </div>
          <div className="flex items-center justify-between mt-1 text-[11px] text-zinc-500">
            <span>e.g. {currentConfig.example}</span>
            {selectedPlatform === 'whatsapp' && (
              <span className="text-emerald-400/80">Include country code</span>
            )}
          </div>
        </div>

        {/* Validation error display */}
        {validationError && (
          <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Bottom controls: Preferred checkbox & Add button */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isPreferredNew}
              onChange={(e) => setIsPreferredNew(e.target.checked)}
              className="w-3.5 h-3.5 rounded bg-zinc-900 border-zinc-700 text-amber-500 focus:ring-amber-400/50"
            />
            <span className="text-xs text-zinc-300 flex items-center gap-1">
              <Star className={`w-3 h-3 ${isPreferredNew ? 'fill-amber-400 text-amber-400' : 'text-zinc-500'}`} />
              Mark as preferred method
            </span>
          </label>

          <button
            type="button"
            onClick={handleAddChannel}
            className="px-3 py-1.5 rounded-lg bg-[#007BFF] hover:bg-[#007BFF]/90 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Channel
          </button>
        </div>
      </div>
    </div>
  );
};
