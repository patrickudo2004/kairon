import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  ArrowUpCircle, 
  Download, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle,
  Laptop
} from 'lucide-react';
import { 
  checkForUpdates, 
  openDownloadUrl, 
  UpdateCheckResult, 
  CURRENT_APP_VERSION, 
  detectPlatform 
} from '../services/updateService';

interface UpdateCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cachedResult?: UpdateCheckResult | null;
  onResultUpdated?: (res: UpdateCheckResult) => void;
}

export const UpdateCheckerModal: React.FC<UpdateCheckerModalProps> = ({
  isOpen,
  onClose,
  cachedResult,
  onResultUpdated,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<UpdateCheckResult | null>(cachedResult || null);
  const [autoCheck, setAutoCheck] = useState<boolean>(() => {
    try {
      return localStorage.getItem('kairon_auto_check_updates') !== 'false';
    } catch {
      return true;
    }
  });

  const performCheck = async (force = true) => {
    setLoading(true);
    try {
      const res = await checkForUpdates(force);
      setResult(res);
      onResultUpdated?.(res);
    } catch (err: any) {
      console.error('Update check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (!cachedResult) {
        performCheck(true);
      } else {
        setResult(cachedResult);
      }
    }
  }, [isOpen, cachedResult]);

  const handleToggleAutoCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked;
    setAutoCheck(val);
    try {
      localStorage.setItem('kairon_auto_check_updates', String(val));
    } catch {}
  };

  if (!isOpen) return null;

  const currentVersion = result?.currentVersion || CURRENT_APP_VERSION;
  const platform = result?.targetOS || detectPlatform();

  const getPlatformLabel = () => {
    switch (platform) {
      case 'windows': return 'Windows (.exe)';
      case 'mac': return 'macOS (.dmg)';
      case 'linux': return 'Linux (.AppImage)';
      default: return 'Desktop Installer';
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#090A0C]/80 backdrop-blur-md animate-in fade-in duration-200" 
        onClick={onClose} 
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-[#121418] border border-[#22262E] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 font-sans text-slate-200">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#22262E] bg-[#181B22]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0EA5E9]/15 border border-[#0EA5E9]/30 flex items-center justify-center text-[#0EA5E9]">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">Kairon Studio Updates</h3>
              <p className="text-[11px] text-[#8A93A4] font-mono">Current build: v{currentVersion}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8A93A4] hover:text-white hover:bg-[#22262E] transition-colors"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <RefreshCw size={28} className="animate-spin text-[#0EA5E9]" />
              <p className="text-sm font-medium text-white">Checking for latest release on GitHub...</p>
              <p className="text-xs text-[#8A93A4]">Querying patrickudo2004/kairon</p>
            </div>
          ) : result?.error && !result?.isUpdateAvailable ? (
            /* Error / Offline state */
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <AlertCircle size={24} />
              </div>
              <h4 className="text-base font-bold text-white">Update Server Unreachable</h4>
              <p className="text-xs text-[#8A93A4] max-w-sm leading-relaxed">
                Could not connect to GitHub to check for updates. Kairon continues to run offline without interruption.
              </p>
              <button
                onClick={() => performCheck(true)}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#22262E] hover:bg-[#2D333F] text-xs font-mono font-bold text-white transition-colors"
              >
                <RefreshCw size={13} />
                <span>Retry Check</span>
              </button>
            </div>
          ) : result?.isUpdateAvailable ? (
            /* Update Available State */
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                  <ArrowUpCircle size={20} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">New Version Available</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                      v{result.latestVersion}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    A newer release of Kairon Studio is available. Upgrading brings performance improvements, offline reliability fixes, and new features.
                  </p>
                </div>
              </div>

              {/* Version Comparison Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#181B22] border border-[#22262E]">
                  <span className="text-[10px] font-mono uppercase text-[#8A93A4] block mb-1">Installed Build</span>
                  <span className="text-sm font-mono font-bold text-slate-300">v{result.currentVersion}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#181B22] border border-emerald-500/30">
                  <span className="text-[10px] font-mono uppercase text-emerald-400 block mb-1">Latest Release</span>
                  <span className="text-sm font-mono font-bold text-emerald-400">v{result.latestVersion}</span>
                </div>
              </div>

              {/* Release Notes Preview */}
              {result.releaseNotes && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-[#8A93A4]">Changelog Summary</span>
                  <div className="p-3.5 rounded-xl bg-[#090A0C] border border-[#22262E] max-h-36 overflow-y-auto text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-line custom-scrollbar">
                    {result.releaseNotes}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={() => openDownloadUrl(result.downloadUrl || result.releaseUrl)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] hover:from-[#38BDF8] hover:to-[#0EA5E9] text-white text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-lg shadow-[#0EA5E9]/20 cursor-pointer active:scale-[0.98]"
                >
                  <Download size={15} />
                  <span>Download for {getPlatformLabel()}</span>
                </button>

                <button
                  onClick={() => openDownloadUrl(result.releaseUrl)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#181B22] hover:bg-[#22262E] border border-[#22262E] text-[#8A93A4] hover:text-white text-xs font-mono font-bold transition-colors cursor-pointer"
                  title="View on GitHub"
                >
                  <ExternalLink size={14} />
                  <span>GitHub</span>
                </button>
              </div>
            </div>
          ) : (
            /* Up-to-date State */
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3.5">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 size={28} />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">Kairon Studio is Up to Date</h4>
                <p className="text-xs text-[#8A93A4] max-w-sm">
                  You are currently running the latest production build (<span className="font-mono text-emerald-400 font-bold">v{currentVersion}</span>).
                </p>
              </div>

              <div className="pt-3 flex items-center gap-3">
                <button
                  onClick={() => performCheck(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#181B22] hover:bg-[#22262E] border border-[#22262E] text-xs font-mono font-bold text-slate-300 hover:text-white transition-colors"
                >
                  <RefreshCw size={12} />
                  <span>Check Again</span>
                </button>

                <button
                  onClick={() => openDownloadUrl(result?.releaseUrl || 'https://github.com/patrickudo2004/kairon/releases')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#181B22] hover:bg-[#22262E] border border-[#22262E] text-xs font-mono font-bold text-[#8A93A4] hover:text-white transition-colors"
                >
                  <ExternalLink size={12} />
                  <span>Release History</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Bar: Auto-check Preference */}
        <div className="px-6 py-3.5 border-t border-[#22262E] bg-[#181B22]/40 flex items-center justify-between text-xs text-[#8A93A4]">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoCheck}
              onChange={handleToggleAutoCheck}
              className="rounded bg-[#090A0C] border-[#22262E] text-[#0EA5E9] focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-[11px]">Automatically check for updates on startup</span>
          </label>

          <span className="text-[10px] font-mono text-[#8A93A4] hidden sm:inline flex items-center gap-1">
            <Laptop size={11} /> {platform.toUpperCase()}
          </span>
        </div>

      </div>
    </div>
  );
};
