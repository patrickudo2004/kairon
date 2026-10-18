import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthActions, useAuthToken } from '@convex-dev/auth/react';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Loader, 
  ArrowRight, 
  Monitor, 
  ShieldCheck, 
  Globe, 
  Mail, 
  Sparkles,
  Lock,
  UserCheck
} from 'lucide-react';

/**
 * DesktopAuthApproval
 *
 * This page lives in the user's web BROWSER (Chrome / Edge / Safari).
 * Route: /desktop-auth?code=KRN-XXXX (or /?desktopCode=KRN-XXXX)
 *
 * Handles:
 * 1. Direct authorization if user is already logged in in browser.
 * 2. In-place Google and Email OTP sign-in if not authenticated, keeping the session code intact.
 * 3. Real-time approval dispatch to Convex backend, waking up Kairon Studio on desktop.
 */
export const DesktopAuthApproval: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const rawCode = searchParams.get('code') || searchParams.get('desktopCode') || '';
  const code = rawCode.trim().toUpperCase();

  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { signIn } = useAuthActions();
  const token = useAuthToken();

  const session = useQuery(api.desktopAuth.getSession, code ? { code } : "skip");
  const currentUser = useQuery(api.authQueries.getCurrentUser, isAuthenticated ? {} : "skip");
  const approveSession = useMutation(api.desktopAuth.approveSession);

  const [phase, setPhase] = useState<'loading' | 'ready' | 'approving' | 'success' | 'error' | 'invalid'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  // Email OTP state for in-place sign-in
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'signIn' | 'verifyCode'>('signIn');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [authFeedback, setAuthFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!code) {
      setPhase('invalid');
      return;
    }
    setPhase('ready');
  }, [authLoading, code]);

  const handleGoogleSignIn = async () => {
    try {
      setIsSubmittingAuth(true);
      setAuthFeedback(null);
      await signIn("google", { redirectTo: window.location.href });
    } catch (err: any) {
      console.error("[DesktopAuthApproval] Google sign-in failed:", err);
      setAuthFeedback({ type: 'error', text: err.message || 'Google sign-in failed. Please try again.' });
      setIsSubmittingAuth(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setIsSubmittingAuth(true);
      setAuthFeedback(null);
      if (step === 'signIn') {
        await signIn("password", { email, flow: "email" });
        setAuthFeedback({
          type: 'success',
          text: 'Check your email for a one-time verification code.'
        });
        setStep('verifyCode');
      } else {
        await signIn("password", { email, code: otpCode.trim() });
      }
    } catch (err: any) {
      console.error("[DesktopAuthApproval] Email sign-in failed:", err);
      setAuthFeedback({
        type: 'error',
        text: err.message || 'Sign-in failed. Please check the code and try again.'
      });
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleApprove = async () => {
    if (!code) return;
    setPhase('approving');
    setErrorMsg('');

    try {
      // Find the refresh token from localStorage if present
      let refreshToken: string | undefined;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i) || '';
        if (key.includes('__convexAuthRefreshToken')) {
          refreshToken = localStorage.getItem(key) || undefined;
          break;
        }
      }

      const userEmail = currentUser?.email || undefined;
      const userName = (currentUser as any)?.name || (currentUser as any)?.fullName || undefined;

      await approveSession({
        code,
        jwtToken: token || 'browser-approved-session',
        refreshToken,
        userEmail,
        userName,
      });

      setPhase('success');
    } catch (err: any) {
      console.error('[DesktopAuthApproval] Failed to approve session:', err);
      setErrorMsg(err.message || 'Failed to authorize desktop app. Please verify the code and try again.');
      setPhase('error');
    }
  };

  // ── Invalid code ──
  if (phase === 'invalid' || (code && session === null)) {
    return (
      <div className="min-h-screen bg-[#090A0C] flex flex-col items-center justify-center gap-6 p-8 font-sans">
        <div className="w-20 h-20 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/30 flex items-center justify-center">
          <AlertTriangle size={36} className="text-[#EF4444]" />
        </div>
        <div className="text-center max-w-sm">
          <h2 className="text-xl font-bold text-white mb-2">Invalid or Expired Code</h2>
          <p className="text-[#8A93A4] text-sm leading-relaxed">
            The authorization code <span className="font-mono text-[#0EA5E9] font-bold">{code || 'N/A'}</span> was not found or has expired. Please request a new code in Kairon Desktop Studio.
          </p>
        </div>
        <button 
          onClick={() => navigate('/')} 
          className="py-3 px-6 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-mono text-xs font-bold uppercase tracking-wider transition-all"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // ── Success state ──
  if (phase === 'success' || (session && session.status === 'approved')) {
    return (
      <div className="min-h-screen bg-[#090A0C] flex flex-col items-center justify-center gap-6 p-8 font-sans">
        <div className="w-24 h-24 rounded-full bg-[#10B981]/15 border-2 border-[#10B981]/40 flex items-center justify-center animate-bounce">
          <CheckCircle2 size={48} className="text-[#10B981]" />
        </div>
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-white mb-2">Desktop Studio Authorized!</h2>
          <p className="text-[#8A93A4] text-sm leading-relaxed mb-1">
            Kairon Studio on your desktop has received your credentials and is launching now.
          </p>
          <p className="text-[#10B981] text-xs font-mono font-medium">
            ✓ You can safely close this browser tab and return to the Kairon app.
          </p>
        </div>
        <div className="flex items-center gap-2 px-5 py-3 bg-[#121418] border border-[#22262E] rounded-xl mt-2">
          <Monitor size={16} className="text-[#0EA5E9]" />
          <span className="text-[#8A93A4] text-xs font-mono">Session Code: {code}</span>
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
          <p className="text-[#8A93A4] text-sm leading-relaxed">{errorMsg}</p>
        </div>
        <button
          onClick={() => setPhase('ready')}
          className="py-3 px-6 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-mono text-xs font-bold uppercase tracking-wider transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  // ── Loading state ──
  if (phase === 'loading' || authLoading) {
    return (
      <div className="min-h-screen bg-[#090A0C] flex flex-col items-center justify-center gap-4 font-sans">
        <Loader size={32} className="animate-spin text-[#0EA5E9]" />
        <p className="text-[#8A93A4] text-sm font-mono">Verifying authorization session…</p>
      </div>
    );
  }

  // ── Main Card (Signed In vs Sign-In Required) ──
  return (
    <div className="min-h-screen bg-[#090A0C] flex flex-col items-center justify-center p-6 font-sans">

      {/* Brand Header */}
      <div className="inline-flex items-center gap-3 mb-8">
        <img
          src="/kairon-logo.png"
          alt="Kairon Studio"
          className="w-10 h-10 rounded-xl border border-[#22262E] shadow-md shadow-[#0EA5E9]/20 object-contain"
        />
        <div className="text-left">
          <span className="text-white font-bold text-lg tracking-tight block">Kairon Studio</span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#8A93A4]">Device Authorization</span>
        </div>
      </div>

      <div className="w-full max-w-md bg-[#121418] border border-[#22262E] rounded-3xl p-8 flex flex-col items-center gap-6 shadow-2xl">

        {/* Device Icon */}
        <div className="w-16 h-16 rounded-2xl bg-[#0EA5E9]/10 border border-[#0EA5E9]/30 flex items-center justify-center shadow-inner shadow-[#0EA5E9]/20">
          <Monitor size={30} className="text-[#0EA5E9]" />
        </div>

        {/* Heading */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-1.5">Authorize Kairon Desktop</h2>
          <p className="text-[#8A93A4] text-sm leading-relaxed">
            Link your account with Kairon Studio on this computer.
          </p>
        </div>

        {/* Session Code Display */}
        <div className="w-full flex flex-col items-center gap-1.5 py-3 px-4 bg-[#181B22] border border-[#0EA5E9]/25 rounded-2xl">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#8A93A4]">Pairing Code</span>
          <span className="text-2xl font-mono font-black text-[#0EA5E9] tracking-[0.25em]">{code}</span>
        </div>

        {/* Conditional Flow: Already Signed In vs Sign In Required */}
        {isAuthenticated ? (
          <div className="w-full flex flex-col gap-4">
            {/* Account Info Pill */}
            <div className="w-full flex items-center gap-3 p-3.5 bg-[#181B22] border border-[#22262E] rounded-2xl">
              <div className="w-9 h-9 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center flex-shrink-0">
                <UserCheck size={18} className="text-[#10B981]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-mono text-[#8A93A4] uppercase tracking-wider">Signed in as</p>
                <p className="text-xs font-bold text-white truncate">
                  {currentUser?.email || (currentUser as any)?.name || 'Authenticated User'}
                </p>
              </div>
            </div>

            {/* Security note */}
            <div className="flex items-center gap-2 text-[#8A93A4] text-[11px]">
              <ShieldCheck size={14} className="text-[#10B981] flex-shrink-0" />
              <span>This will securely grant full operator access to Kairon Desktop.</span>
            </div>

            {/* Authorize Button */}
            <button
              onClick={handleApprove}
              disabled={phase === 'approving'}
              className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] disabled:opacity-60 text-white font-mono text-sm font-bold transition-all shadow-lg shadow-[#0EA5E9]/25"
            >
              {phase === 'approving' ? (
                <><Loader size={18} className="animate-spin" /> Authorizing Studio…</>
              ) : (
                <><CheckCircle2 size={18} /> Authorize Kairon Desktop <ArrowRight size={16} className="ml-auto" /></>
              )}
            </button>
          </div>
        ) : (
          /* Sign-In Options Directly in Place */
          <div className="w-full flex flex-col gap-4">
            <div className="p-3 bg-[#181B22] border border-[#22262E] rounded-xl text-center">
              <p className="text-xs text-[#8A93A4]">
                Sign in with your Kairon account to complete authorization.
              </p>
            </div>

            {authFeedback && (
              <div className={`p-3 rounded-xl text-xs font-mono flex items-center gap-2 ${
                authFeedback.type === 'error'
                  ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                  : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              }`}>
                {authFeedback.type === 'error' ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                <span>{authFeedback.text}</span>
              </div>
            )}

            {/* Google Sign-In */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isSubmittingAuth}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-60 text-slate-900 font-bold text-xs transition-all shadow-md"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-[#22262E]" />
              <span className="text-[10px] font-mono uppercase text-[#8A93A4] tracking-wider">or email</span>
              <div className="flex-1 h-px bg-[#22262E]" />
            </div>

            {/* Email OTP Sign-In */}
            <form onSubmit={handleEmailSignIn} className="flex flex-col gap-3">
              {step === 'signIn' ? (
                <div>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A93A4]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="w-full bg-[#181B22] border border-[#22262E] focus:border-[#0EA5E9] text-white text-xs rounded-xl pl-10 pr-4 py-3 outline-none transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmittingAuth || !email}
                    className="w-full mt-3 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] disabled:opacity-60 text-white font-mono text-xs font-bold transition-all shadow-md shadow-[#0EA5E9]/20"
                  >
                    {isSubmittingAuth ? <Loader size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    <span>Send Login Code</span>
                  </button>
                </div>
              ) : (
                <div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A93A4]" />
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      required
                      autoFocus
                      className="w-full bg-[#181B22] border border-[#22262E] focus:border-[#0EA5E9] text-white font-mono tracking-widest text-center text-sm rounded-xl py-3 outline-none transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmittingAuth || !otpCode}
                    className="w-full mt-3 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#10B981] hover:bg-[#059669] disabled:opacity-60 text-white font-mono text-xs font-bold transition-all shadow-md shadow-[#10B981]/20"
                  >
                    {isSubmittingAuth ? <Loader size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    <span>Verify & Authorize</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStep('signIn'); setOtpCode(''); }}
                    className="w-full mt-2 text-center text-[11px] text-[#8A93A4] hover:text-white transition-colors"
                  >
                    Use a different email
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

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
