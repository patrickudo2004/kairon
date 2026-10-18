import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthActions } from '@convex-dev/auth/react';
import { useConvexAuth } from 'convex/react';
import { useMutation } from 'convex/react';
import { useAuthToken } from '@convex-dev/auth/react';
import { api } from '../convex/_generated/api';
import { Mic, CheckCircle2, AlertTriangle, Loader, ArrowRight, Monitor, ShieldCheck, Globe } from 'lucide-react';

/**
 * DesktopAuthApproval
 *
 * This page lives in the user's web BROWSER (Chrome / Edge / Safari), NOT in Electron.
 * Route: /desktop-auth?code=KRN-XXXX
 *
 * Flow:
 * 1. User arrives here (already logged in or prompted to log in first)
 * 2. They see the code, description, and an "Authorize Kairon Desktop" button
 * 3. We call api.desktopAuth.approveSession with their JWT token
 * 4. Convex pushes the update to the desktop app in real time
 * 5. The desktop app reloads and is authenticated
 */
export const DesktopAuthApproval: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get('code') || '';

  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const token = useAuthToken();

  const approveSession = useMutation(api.desktopAuth.approveSession);

  const [phase, setPhase] = useState<'loading' | 'confirm' | 'approving' | 'success' | 'error' | 'invalid'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  // ── Once auth is resolved, move to confirm or redirect to login ──
  useEffect(() => {
    if (authLoading) return;
    if (!code) {
      setPhase('invalid');
      return;
    }
    if (!isAuthenticated) {
      // Redirect to the main login page, preserving the code in return URL
      navigate(`/?desktopCode=${encodeURIComponent(code)}`, { replace: true });
      return;
    }
    setPhase('confirm');
  }, [authLoading, isAuthenticated, code]);

  const handleApprove = async () => {
    if (!code || !token) return;
    setPhase('approving');

    try {
      // We need to extract JWT & refresh token from localStorage to pass to the desktop
      const namespace = (window as any).__convex_url__ || '';
      const jwtKey = `${namespace}__convexAuthJWT`;
      const refreshKey = `${namespace}__convexAuthRefreshToken`;

      // Try all known storage key patterns @convex-dev/auth uses
      let jwtToken = token;
      let refreshToken: string | undefined;

      // Try to find the refresh token from localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i) || '';
        if (key.includes('__convexAuthRefreshToken')) {
          refreshToken = localStorage.getItem(key) || undefined;
          break;
        }
      }

      const userEmail = (window as any).__convexUser?.email;
      const userName = (window as any).__convexUser?.name;

      await approveSession({
        code,
        jwtToken,
        refreshToken,
        userEmail,
        userName,
      });

      setPhase('success');
    } catch (err: any) {
      console.error('[DesktopAuthApproval] Failed to approve session:', err);
      setErrorMsg(err.message || 'Failed to authorize desktop app. Please try again.');
      setPhase('error');
    }
  };

  // ── Invalid code ──
  if (phase === 'invalid') {
    return (
      <div className="min-h-screen bg-[#090A0C] flex flex-col items-center justify-center gap-6 p-8 font-sans">
        <div className="w-20 h-20 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-center justify-center">
          <AlertTriangle size={36} className="text-[#EF4444]" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Invalid or Missing Code</h2>
          <p className="text-[#8A93A4] text-sm">The authorization code is missing or malformed. Please restart the sign-in process from Kairon Desktop.</p>
        </div>
        <button onClick={() => navigate('/')} className="py-3 px-6 rounded-xl bg-[#0EA5E9] text-white font-mono text-xs font-bold uppercase tracking-wider">
          Back to Home
        </button>
      </div>
    );
  }

  // ── Success state ──
  if (phase === 'success') {
    return (
      <div className="min-h-screen bg-[#090A0C] flex flex-col items-center justify-center gap-6 p-8 font-sans">
        <div className="w-24 h-24 rounded-full bg-[#10B981]/15 border-2 border-[#10B981]/40 flex items-center justify-center">
          <CheckCircle2 size={48} className="text-[#10B981]" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Desktop App Authorized!</h2>
          <p className="text-[#8A93A4] text-sm leading-relaxed">
            Kairon Studio on your desktop has been signed in. You can close this browser tab and return to the desktop app.
          </p>
        </div>
        <div className="flex items-center gap-2 px-5 py-3 bg-[#121418] border border-[#22262E] rounded-xl">
          <Monitor size={16} className="text-[#0EA5E9]" />
          <span className="text-[#8A93A4] text-xs font-mono">Switch back to Kairon Studio</span>
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (phase === 'error') {
    return (
      <div className="min-h-screen bg-[#090A0C] flex flex-col items-center justify-center gap-6 p-8 font-sans">
        <div className="w-20 h-20 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-center justify-center">
          <AlertTriangle size={36} className="text-[#EF4444]" />
        </div>
        <div className="text-center max-w-sm">
          <h2 className="text-xl font-bold text-white mb-2">Authorization Failed</h2>
          <p className="text-[#8A93A4] text-sm">{errorMsg}</p>
        </div>
        <button
          onClick={() => setPhase('confirm')}
          className="py-3 px-6 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-mono text-xs font-bold uppercase tracking-wider transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  // ── Loading ──
  if (phase === 'loading' || authLoading) {
    return (
      <div className="min-h-screen bg-[#090A0C] flex flex-col items-center justify-center gap-4 font-sans">
        <Loader size={32} className="animate-spin text-[#0EA5E9]" />
        <p className="text-[#8A93A4] text-sm font-mono">Verifying your session…</p>
      </div>
    );
  }

  // ── Confirm / Authorize screen ──
  return (
    <div className="min-h-screen bg-[#090A0C] flex flex-col items-center justify-center p-6 font-sans">

      {/* Logo strip */}
      <div className="inline-flex items-center gap-3 mb-8">
        <img
          src="/kairon-logo.png"
          alt="Kairon Studio"
          className="w-10 h-10 rounded-xl border border-[#22262E] shadow-md shadow-[#0EA5E9]/20 object-contain"
        />
        <span className="text-white font-bold text-lg tracking-tight">Kairon Studio</span>
      </div>

      <div className="w-full max-w-sm bg-[#121418] border border-[#22262E] rounded-3xl p-8 flex flex-col items-center gap-6">

        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-[#0EA5E9]/10 border border-[#0EA5E9]/30 flex items-center justify-center">
          <Monitor size={30} className="text-[#0EA5E9]" />
        </div>

        {/* Heading */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Authorize Desktop App</h2>
          <p className="text-[#8A93A4] text-sm leading-relaxed">
            You are about to sign in to <span className="text-white font-semibold">Kairon Studio</span> on your desktop.
          </p>
        </div>

        {/* Code display */}
        <div className="w-full flex flex-col items-center gap-2">
          <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#8A93A4]">Session Code</p>
          <div className="px-6 py-3 bg-[#181B22] border border-[#0EA5E9]/20 rounded-xl">
            <span className="text-2xl font-mono font-black text-[#0EA5E9] tracking-[0.3em]">{code}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#8A93A4] text-xs font-mono">
            <Globe size={11} />
            This code is bound to one desktop session only
          </div>
        </div>

        {/* Security badge */}
        <div className="w-full flex items-center gap-3 p-3 bg-[#181B22] border border-[#22262E] rounded-xl">
          <ShieldCheck size={16} className="text-[#10B981] flex-shrink-0" />
          <p className="text-[11px] text-[#8A93A4] leading-snug">
            This authorizes the desktop app to sign in as <span className="text-white font-semibold">{typeof window !== 'undefined' ? (document.cookie.includes('email') ? '…' : 'your account') : 'you'}</span>. The session expires in 10 minutes.
          </p>
        </div>

        {/* Authorize button */}
        <button
          onClick={handleApprove}
          disabled={phase === 'approving'}
          className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] disabled:opacity-60 text-white font-mono text-sm font-bold transition-all shadow-lg shadow-[#0EA5E9]/20"
        >
          {phase === 'approving' ? (
            <><Loader size={18} className="animate-spin" /> Authorizing…</>
          ) : (
            <><CheckCircle2 size={18} /> Authorize Kairon Desktop <ArrowRight size={16} className="ml-auto" /></>
          )}
        </button>

        <button
          onClick={() => navigate('/')}
          className="text-[#8A93A4] hover:text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default DesktopAuthApproval;
