import React, { useState } from 'react';
import { 
  Download, Upload, HardDrive, CheckCircle2, AlertCircle, 
  X, Database, Smartphone, FileJson, RefreshCw
} from 'lucide-react';
import { exportLocalBackup, importLocalBackup, getLocalStorageFootprint } from '../../utils/localBackup';
import { PWAInstallButton } from './PWAInstallButton';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface LocalBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRestored?: () => void;
}

export const LocalBackupModal: React.FC<LocalBackupModalProps> = ({
  isOpen,
  onClose,
  onDataRestored
}) => {
  const { isInstalled } = usePWAInstall();
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [stats, setStats] = useState(getLocalStorageFootprint());

  if (!isOpen) return null;

  const handleExport = () => {
    try {
      const result = exportLocalBackup();
      setExportStatus(`Saved ${result.filename} to your local device!`);
      setTimeout(() => setExportStatus(null), 5000);
    } catch (err: any) {
      setExportStatus(`Failed to export: ${err.message}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        importLocalBackup(content);
        setImportStatus({
          success: true,
          message: 'All contacts and relationship records restored from local backup!'
        });
        setStats(getLocalStorageFootprint());
        if (onDataRestored) {
          onDataRestored();
        }
      } catch (err: any) {
        setImportStatus({
          success: false,
          message: `Restore failed: ${err.message || 'Invalid JSON file'}`
        });
      }
    };
    reader.readAsText(file);
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
            <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">Local Storage & WebApp</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Manage offline installability and save data directly to your device</p>
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

        {/* Local Storage Stats */}
        <div className="grid grid-cols-3 gap-2.5 bg-zinc-950/80 p-3.5 rounded-2xl border border-zinc-850 text-center">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase font-mono font-bold block">Contacts</span>
            <span className="text-base font-bold text-white font-mono">{stats.totalContacts}</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 uppercase font-mono font-bold block">Events</span>
            <span className="text-base font-bold text-white font-mono">{stats.totalEvents}</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 uppercase font-mono font-bold block">Local Footprint</span>
            <span className="text-base font-bold text-blue-400 font-mono">{stats.sizeKB} KB</span>
          </div>
        </div>

        {/* Install as WebApp Section */}
        <div className="p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-blue-400" />
              <h4 className="text-xs font-bold text-white">Save as Local WebApp (PWA)</h4>
            </div>
            {isInstalled ? (
              <span className="text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-900/40 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Installed
              </span>
            ) : (
              <PWAInstallButton variant="header" />
            )}
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Install Remix Rolodox onto your phone home screen or desktop to launch full-screen with offline caching, fast load times, and standalone app behavior.
          </p>
        </div>

        {/* Export / Save to Local File Section */}
        <div className="p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-white">Save Backup to Local Drive</h4>
            </div>
            <button
              type="button"
              onClick={handleExport}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
            >
              <FileJson className="w-3.5 h-3.5" />
              Export .JSON
            </button>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Download a complete, offline JSON copy of your Rolodex (contacts, notes, social channels, and strategies) directly into your local Downloads folder.
          </p>
          {exportStatus && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-900/40 p-2.5 rounded-xl animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{exportStatus}</span>
            </div>
          )}
        </div>

        {/* Import / Restore from Local File Section */}
        <div className="p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-400" />
              <h4 className="text-xs font-bold text-white">Restore from Local File</h4>
            </div>
            <label className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-sm">
              <Upload className="w-3.5 h-3.5 text-blue-400" />
              Choose File
              <input 
                type="file" 
                accept=".json,application/json" 
                className="hidden" 
                onChange={handleFileChange}
              />
            </label>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Select a previously exported <code className="text-zinc-300 font-mono text-[11px]">.json</code> backup from your computer or phone to restore all data.
          </p>
          {importStatus && (
            <div className={`flex items-center gap-2 text-xs p-2.5 rounded-xl border animate-fade-in ${
              importStatus.success 
                ? 'text-emerald-400 bg-emerald-950/30 border-emerald-900/40' 
                : 'text-red-400 bg-red-950/30 border-red-900/40'
            }`}>
              {importStatus.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{importStatus.message}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-xs font-semibold transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
