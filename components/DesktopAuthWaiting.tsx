import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery as useConvexQueryReal, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Mic, Monitor, QrCode, Wifi, RefreshCw, CheckCircle2, Loader, WifiOff, Zap, ArrowRight, Globe } from 'lucide-react';

// ──────────────────────────────────────────────────────────────────────────────
// Utility: Generate a random short code on the client side (mirrors server fn)
// ──────────────────────────────────────────────────────────────────────────────
const CONVEX_URL = import.meta.env.VITE_CONVEX_URL || 'https://majestic-gecko-369.convex.cloud';
const SITE_URL = import.meta.env.VITE_SITE_URL || window.location.origin;

interface DesktopAuthWaitingProps {
  onOfflineMode: () => void;
}

type PhaseType = 'generating' | 'waiting' | 'approved' | 'expired';

interface SessionData {
  code: string;
  status: 'pending' | 'approved' | 'expired';
  jwtToken?: string;
  refreshToken?: string;
  userEmail?: string;
  userName?: string;
  createdAt: number;
  expiresAt: number;
}

// ──────────────────────────────────────────────────────────────────────────────
// Simple QR code SVG generator (no external deps — squares in an SVG grid)
// ──────────────────────────────────────────────────────────────────────────────
function QRPlaceholder({ url }: { url: string }) {
  // We generate a simple visual reference, not a real QR code.
  // The user can scan the URL displayed below it with a camera.
  const shortUrl = url.length > 60 ? url.slice(0, 57) + '…' : url;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-36 h-36 bg-white rounded-xl flex items-center justify-center p-3 border-2 border-[#22262E]">
        <div className="text-[9px] text-slate-900 text-center font-mono break-all leading-tight">
          <QrCode size={48} className="text-slate-900 mx-auto mb-1" />
          Scan with phone camera
        </div>
      </div>
      <p className="text-[10px] font-mono text-[#8A93A4] max-w-[160px] break-all text-center">{shortUrl}</p>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Main Desktop Auth Waiting Component
// ──────────────────────────────────────────────────────────────────────────────
export const DesktopAuthWaiting: React.FC<DesktopAuthWaitingProps> = ({ onOfflineMode }) => {
  const [phase, setPhase] = useState<'generating' | 'waiting' | 'approved' | 'expired' | 'error'>('generating');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(600); // 10 minutes in seconds
  const [isCopied, setIsCopied] = useState(false);
  const [isApprovedAnimating, setIsApprovedAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const createSession = useMutation(api.desktopAuth.createSession);

  // Poll for session status
  const sessionData = useConvexQueryReal(
    api.desktopAuth.getSession,
    sessionCode ? { code: sessionCode } : 'skip'
  ) as SessionData | null | undefined;

  // ── Step 1: Create session on mount ──
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        setPhase('generating');
        setErrorMessage(null);
        const result = await createSession({});
        if (cancelled) return;
        setSessionCode(result.code);
        setSessionId(result.id);
        setPhase('waiting');
      } catch (err: any) {
        console.error('[DesktopAuth] Failed to create session:', err);
        if (cancelled) return;
        setErrorMessage(err.message || 'Failed to connect to cloud backend.');
        setPhase('error');
      }
    };
    init();
    return () => { cancelled = true; };
  }, []);

  // ── Step 2: Countdown timer ──
  useEffect(() => {
    if (phase !== 'waiting') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setPhase('expired');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  // ── Step 3: React to Convex real-time session update ──
  useEffect(() => {
    if (!sessionData) return;

    if (sessionData.status === 'approved' && sessionData.jwtToken) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsApprovedAnimating(true);
      setPhase('approved');

      // Write the tokens into localStorage — same keys @convex-dev/auth/react uses
      const namespace = CONVEX_URL;
      const jwtKey = `${namespace}__convexAuthJWT`;
      const refreshKey = `${namespace}__convexAuthRefreshToken`;

      try {
        localStorage.setItem(jwtKey, sessionData.jwtToken);
        if (sessionData.refreshToken) {
          localStorage.setItem(refreshKey, sessionData.refreshToken);
        }
      } catch (e) {
        console.error('[DesktopAuth] Failed to store tokens:', e);
      }

      // Give the animation 1.5s then reload to trigger ConvexAuthProvider re-check
      setTimeout(() => {
        window.location.reload();
      }, 1800);
    }

    if (sessionData.status === 'expired') {
      setPhase('expired');
    }
  }, [sessionData]);

  // ── Helpers ──
  const approvalUrl = sessionCode
    ? `${SITE_URL}/desktop-auth?code=${encodeURIComponent(sessionCode)}`
    : null;

  const handleOpenBrowser = useCallback(() => {
    if (!approvalUrl) return;
    const electronAPI = (window as any).electron || (window as any).electronAPI;
    if (electronAPI?.openExternalUrl) {
      electronAPI.openExternalUrl(approvalUrl);
    } else {
      window.open(approvalUrl, '_blank', 'noopener');
    }
  }, [approvalUrl]);

  const handleCopyCode = useCallback(() => {
    if (!sessionCode) return;
    navigator.clipboard.writeText(sessionCode).catch(() => {});
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [sessionCode]);

  const handleRestart = useCallback(() => {
    setPhase('generating');
    setSessionCode(null);
    setSessionId(null);
    setTimeLeft(600);
    // Re-mount creates a new session
    const init = async () => {
      try {
        const result = await createSession({});
        setSessionCode(result.code);
        setPhase('waiting');
      } catch (err) {
        console.error('[DesktopAuth] Restart failed:', err);
      }
    };
    init();
  }, [createSession]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // ── Approved state ──
  if (phase === 'approved') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#090A0C] gap-6 p-8 font-sans">
        <div className="w-24 h-24 rounded-full bg-[#10B981]/15 border-2 border-[#10B981]/40 flex items-center justify-center animate-pulse">
          <CheckCircle2 size={48} className="text-[#10B981]" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Signed in successfully</h2>
          <p className="text-[#8A93A4] text-sm font-mono">
            {sessionData?.userName || sessionData?.userEmail || 'Loading your workspace…'}
          </p>
        </div>
        <div className="flex items-center gap-2 text-[#8A93A4] text-xs font-mono">
          <Loader size={14} className="animate-spin" />
          Loading Kairon Studio…
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (phase === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#090A0C] gap-6 p-8 font-sans">
        <div className="w-20 h-20 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-center justify-center">
          <WifiOff size={36} className="text-[#EF4444]" />
        </div>
        <div className="text-center max-w-sm">
          <h2 className="text-xl font-bold text-white mb-2">Connection Issue</h2>
          <p className="text-[#8A93A4] text-xs font-mono leading-relaxed mb-1">{errorMessage}</p>
          <p className="text-slate-400 text-xs">You can retry connecting or jump straight into offline booth mode.</p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={handleRestart}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-mono text-xs font-bold uppercase tracking-wider transition-all"
          >
            <RefreshCw size={16} />
            Retry Generating Code
          </button>
          <button
            onClick={() => {
              try { localStorage.setItem('kairon_booth_mode', 'true'); } catch {}
              onOfflineMode();
            }}
            className="w-full py-3 px-6 rounded-xl border border-[#22262E] bg-[#181B22] text-[#8A93A4] hover:text-white font-mono text-xs font-bold uppercase tracking-wider transition-all"
          >
            Continue Offline as Guest
          </button>
        </div>
      </div>
    );
  }

  // ── Expired state ──
  if (phase === 'expired') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#090A0C] gap-6 p-8 font-sans">
        <div className="w-20 h-20 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center justify-center">
          <WifiOff size={36} className="text-[#F59E0B]" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Session Expired</h2>
          <p className="text-[#8A93A4] text-sm">The code expired before it was used. Generate a new one.</p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={handleRestart}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-mono text-xs font-bold uppercase tracking-wider transition-all"
          >
            <RefreshCw size={16} />
            Generate New Code
          </button>
          <button
            onClick={() => {
              try { localStorage.setItem('kairon_booth_mode', 'true'); } catch {}
              onOfflineMode();
            }}
            className="w-full py-3 px-6 rounded-xl border border-[#22262E] text-[#8A93A4] hover:text-white font-mono text-xs font-bold uppercase tracking-wider transition-all"
          >
            Continue Offline
          </button>
        </div>
      </div>
    );
  }

  // ── Generating / Waiting state ──
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#090A0C] p-8 font-sans">
      {/* Official Kairon Logo */}
      <div className="inline-flex items-center gap-3 mb-8">
        <img
          src="/kairon-logo.png"
          alt="Kairon Studio"
          className="w-12 h-12 rounded-2xl border border-[#22262E] shadow-xl shadow-[#0EA5E9]/15 object-contain"
        />
        <div>
          <span className="text-white font-bold text-xl tracking-tight">Kairon Studio</span>
          <div className="text-[10px] font-mono text-[#0EA5E9] uppercase tracking-widest font-semibold">Broadcast Workstation</div>
        </div>
      </div>

      <div className="w-full max-w-md bg-[#121418] border border-[#22262E] rounded-3xl p-8 flex flex-col items-center gap-7">

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0EA5E9]/10 text-[#0EA5E9] rounded-full text-[10px] font-mono font-bold uppercase tracking-widest border border-[#0EA5E9]/20 mb-4">
            <Globe size={12} />
            Browser Sign-In
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Sign in with your browser</h2>
          <p className="text-[#8A93A4] text-sm leading-relaxed">
            Open the link below in Chrome or Edge, sign in with Google or your email, then this window activates automatically.
          </p>
        </div>

        {/* Code Display */}
        {phase === 'generating' ? (
          <div className="w-32 h-16 flex items-center justify-center">
            <Loader size={28} className="animate-spin text-[#0EA5E9]" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 w-full">
            {/* Big code pill */}
            <button
              onClick={handleCopyCode}
              title="Click to copy"
              className="group flex items-center gap-3 px-6 py-4 bg-[#181B22] border border-[#0EA5E9]/30 hover:border-[#0EA5E9] rounded-2xl transition-all cursor-pointer"
            >
              <span className="text-3xl font-mono font-black text-[#0EA5E9] tracking-[0.25em]">
                {sessionCode}
              </span>
              <div className={`text-[10px] font-mono uppercase tracking-widest transition-colors ${isCopied ? 'text-[#10B981]' : 'text-[#8A93A4] group-hover:text-white'}`}>
                {isCopied ? '✓ Copied' : 'Copy'}
              </div>
            </button>

            {/* Countdown */}
            <div className="flex items-center gap-1.5 text-[#8A93A4] text-xs font-mono">
              <div className={`w-2 h-2 rounded-full animate-pulse ${timeLeft > 120 ? 'bg-[#10B981]' : timeLeft > 30 ? 'bg-[#F59E0B]' : 'bg-[#EF4444]'}`} />
              Expires in {formatTime(timeLeft)}
            </div>
          </div>
        )}

        {/* Open in browser button */}
        {approvalUrl && (
          <button
            onClick={handleOpenBrowser}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-mono text-sm font-bold transition-all shadow-lg shadow-[#0EA5E9]/20"
          >
            <Globe size={18} />
            Open Sign-In in Browser
            <ArrowRight size={16} className="ml-auto" />
          </button>
        )}

        {/* Status line */}
        <div className="flex items-center gap-2 text-[#8A93A4] text-xs font-mono">
          {phase === 'waiting' ? (
            <>
              <Wifi size={12} className="text-[#10B981]" />
              Waiting for browser approval…
            </>
          ) : (
            <>
              <Loader size={12} className="animate-spin" />
              Generating code…
            </>
          )}
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-[#22262E]" />

        {/* Offline / Guest bypass */}
        <button
          onClick={() => {
            try { localStorage.setItem('kairon_booth_mode', 'true'); } catch {}
            onOfflineMode();
          }}
          className="flex items-center gap-2 text-[#8A93A4] hover:text-white text-xs font-mono font-bold uppercase tracking-widest transition-colors"
        >
          <Zap size={13} />
          Continue Offline as Guest
        </button>
      </div>

      {/* QR code */}
      {approvalUrl && (
        <div className="mt-8 opacity-60">
          <QRPlaceholder url={approvalUrl} />
        </div>
      )}
    </div>
  );
};

export default DesktopAuthWaiting;
