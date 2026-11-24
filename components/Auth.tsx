import React, { useState } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';
import { useSearchParams, Link } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft, Loader, Sparkles, UserPlus, Building, ShieldCheck, Zap } from 'lucide-react';
import { DesktopAuthWaiting } from './DesktopAuthWaiting';
import { getCanonicalWebOrigin } from '../utils/url';

const isElectronRuntime = typeof window !== 'undefined' && Boolean((window as any).electron?.isElectron);

interface AuthProps {
    inviteDetails?: {
        organizationName: string;
        role: string;
        isGeneric?: boolean;
    } | null;
}

export const Auth: React.FC<AuthProps> = ({ inviteDetails }) => {
    const { signIn } = useAuthActions();
    const [searchParams] = useSearchParams();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [step, setStep] = useState<'signIn' | 'verifyCode'>('signIn');
    const [code, setCode] = useState('');

    const handleOfflineMode = () => {
        try {
            localStorage.setItem('kairon_booth_mode', 'true');
            window.dispatchEvent(new Event('kairon_booth_mode_changed'));
        } catch (e) {
            console.warn('Could not set kairon_booth_mode:', e);
        }
        window.location.reload();
    };

    // In Electron, unless a desktopCode is present (meaning user is authenticating in browser),
    // show the browser handshake auth screen.
    const hasDesktopCode = !!searchParams.get('desktopCode');
    if (isElectronRuntime && !hasDesktopCode) {
        return <DesktopAuthWaiting onOfflineMode={handleOfflineMode} />;
    }

    const handleGoogleSignIn = async () => {
        try {
            setIsLoading(true);
            const canonicalOrigin = getCanonicalWebOrigin();
            const isLocal = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1');
            const targetRedirect = isLocal ? `${canonicalOrigin}/` : `${window.location.origin}/`;
            await signIn("google", { redirectTo: targetRedirect });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Google sign-in failed.' });
            setIsLoading(false);
        }
    };

    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        try {
            setIsLoading(true);
            if (step === 'signIn') {
                await signIn("password", { email, flow: "email" });
                setMessage({
                    type: 'success',
                    text: 'Check your email for a one-time code!'
                });
                setStep('verifyCode');
            } else {
                await signIn("password", { email, code });
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Sign-in failed. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main id="main-content" tabIndex={-1} className="flex flex-col items-center justify-center min-h-screen bg-[#060709] text-slate-100 p-4 md:p-8 relative font-sans overflow-y-auto">
            {/* Subtle radial broadcast backdrop glow */}
            <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[360px] rounded-full bg-sky-500/[0.08] blur-[120px]" />
                <div className="absolute bottom-0 right-1/4 w-[480px] h-[320px] rounded-full bg-emerald-500/[0.05] blur-[120px]" />
            </div>

            {!isElectronRuntime && (
                <Link
                    to="/"
                    className="absolute top-4 left-4 md:top-8 md:left-8 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white text-xs font-mono font-semibold transition-all backdrop-blur-xl z-50"
                >
                    <ArrowLeft size={14} aria-hidden="true" />
                    <span>Back to Kairon</span>
                </Link>
            )}

            <div className={`relative z-10 w-full max-w-6xl mx-auto flex flex-col ${inviteDetails ? 'lg:flex-row' : 'items-center'} gap-8 lg:gap-16 py-14`}>
                {/* Auth Form Container (Glassmorphic Card) */}
                <div className="flex-1 w-full max-w-md order-1 lg:order-2 flex flex-col justify-center">
                    <div className="rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] p-7 sm:p-9 shadow-2xl shadow-black/50">
                        <div className={inviteDetails ? '' : 'text-center'}>
                            <div className={`mb-7 ${inviteDetails ? 'lg:mb-8' : ''}`}>
                                <img
                                    src="./kairon-logo.png"
                                    alt="Kairon Studio logo"
                                    className="w-14 h-14 rounded-2xl border border-white/[0.1] shadow-xl shadow-sky-500/15 object-contain mb-4 inline-block"
                                />
                                <h1 className="text-3xl font-bold text-white tracking-tight mb-1.5">Kairon Studio</h1>
                                <p className="text-[#94A3B8] text-sm">
                                    {inviteDetails
                                        ? `Sign in to join ${inviteDetails.organizationName}`
                                        : (mode === 'signin' ? 'Sign in to your production workspace' : 'Create your free Open Beta account')}
                                </p>
                            </div>

                            {message && (
                                <div
                                    role={message.type === 'error' ? 'alert' : 'status'}
                                    aria-live="polite"
                                    className={`mb-6 p-4 rounded-xl text-sm font-medium border text-left ${message.type === 'success'
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                                        }`}
                                >
                                    {message.text}
                                </div>
                            )}

                            {/* Google Sign-In Button */}
                            <button
                                type="button"
                                onClick={handleGoogleSignIn}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-xl border border-white/[0.12] bg-white/[0.05] hover:bg-white/[0.09] hover:border-sky-400/50 text-white font-medium transition-all duration-200 mb-4 disabled:opacity-60 text-sm"
                            >
                                {isLoading ? (
                                    <Loader size={18} className="animate-spin text-sky-400" aria-hidden="true" />
                                ) : (
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                )}
                                Continue with Google
                            </button>

                            <div className="flex items-center gap-4 my-5" aria-hidden="true">
                                <div className="flex-1 h-px bg-white/[0.08]" />
                                <span className="text-[11px] font-mono font-bold text-[#94A3B8] uppercase tracking-widest">or</span>
                                <div className="flex-1 h-px bg-white/[0.08]" />
                            </div>

                            {/* Email OTP Form */}
                            <form onSubmit={handleEmailSignIn} className="space-y-4 text-left">
                                <div>
                                    <label htmlFor="auth-email-input" className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5 px-1">
                                        Email address
                                    </label>
                                    <div className="relative">
                                        <Mail size={16} aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            id="auth-email-input"
                                            type="email"
                                            autoComplete="email"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            disabled={step === 'verifyCode'}
                                            className="w-full pl-10 pr-4 py-3 bg-[#0C0E13] border border-white/[0.1] rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#38BDF8] outline-none transition-all disabled:opacity-60 text-sm font-mono"
                                        />
                                    </div>
                                </div>

                                {step === 'verifyCode' && (
                                    <div className="animate-in slide-in-from-bottom-2 duration-300">
                                        <label htmlFor="auth-otp-code" className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5 px-1">
                                            Verification Code
                                        </label>
                                        <input
                                            id="auth-otp-code"
                                            type="text"
                                            inputMode="numeric"
                                            autoComplete="one-time-code"
                                            placeholder="Enter 6-digit code"
                                            value={code}
                                            onChange={(e) => setCode(e.target.value)}
                                            required
                                            className="w-full px-4 py-3 bg-[#0C0E13] border border-white/[0.1] rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#38BDF8] outline-none transition-all text-center text-xl font-bold tracking-[0.4em] font-mono shadow-inner"
                                        />
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading || !email}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-[#0369A1] hover:bg-[#0284C7] text-white font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 group disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <Loader size={18} className="animate-spin" aria-hidden="true" />
                                    ) : (
                                        <>
                                            {step === 'verifyCode' ? 'Verify Code' : (mode === 'signin' || inviteDetails ? 'Send Login Code' : 'Create Account')}
                                            <ArrowRight size={16} aria-hidden="true" className="group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>

                            {step === 'verifyCode' && (
                                <button
                                    type="button"
                                    onClick={() => { setStep('signIn'); setMessage(null); }}
                                    className="w-full mt-4 text-xs font-mono font-bold uppercase tracking-wider text-slate-300 hover:text-sky-400 transition-colors"
                                >
                                    ← Use a different email
                                </button>
                            )}

                            {!inviteDetails && (
                                <p className="text-center text-xs text-[#94A3B8] mt-6">
                                    {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
                                    <button
                                        type="button"
                                        onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage(null); setStep('signIn'); }}
                                        className="text-sky-400 font-bold hover:underline"
                                    >
                                        {mode === 'signin' ? 'Sign up' : 'Sign in'}
                                    </button>
                                </p>
                            )}

                            {/* Offline Booth Mode Quick Entry */}
                            <div className="mt-5 pt-5 border-t border-white/[0.08]">
                                <button
                                    type="button"
                                    onClick={handleOfflineMode}
                                    className="w-full py-2.5 px-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] text-slate-300 hover:text-white text-xs font-mono font-semibold transition-all"
                                >
                                    Try Offline Local Studio (No Account Required)
                                </button>
                            </div>

                            {/* Legal & Privacy Transparency Footer */}
                            <div className="mt-6 pt-5 border-t border-white/[0.08] text-center space-y-2">
                                <p className="text-xs text-[#94A3B8] leading-relaxed">
                                    Free Open Beta. By continuing, you agree to our{' '}
                                    <Link to="/terms" className="text-sky-400 hover:underline">Terms of Service</Link>
                                    {' '}and{' '}
                                    <Link to="/privacy" className="text-sky-400 hover:underline">Privacy Policy</Link>.
                                </p>
                                <div className="flex items-center justify-center gap-4 text-xs font-mono text-slate-400">
                                    <Link to="/cookies" className="hover:text-white transition-colors">Cookies</Link>
                                    <Link to="/accessibility" className="hover:text-white transition-colors">Accessibility</Link>
                                    <Link to="/guide" className="hover:text-white transition-colors">User Guide</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Invitation Card (Only shown if inviteDetails exists) */}
                {inviteDetails && (
                    <div className="flex-1 max-w-xl order-2 lg:order-1 font-sans">
                        <div className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden border border-white/[0.08]">
                            <div className="relative z-10 h-full flex flex-col justify-between">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-500/10 text-sky-300 rounded-full text-xs font-mono font-bold uppercase tracking-wider mb-6 border border-sky-500/20">
                                        <Sparkles size={14} aria-hidden="true" /> Team Invitation
                                    </div>

                                    <div className="w-16 h-16 bg-white/[0.04] rounded-2xl flex items-center justify-center mb-6 border border-white/[0.1]">
                                        <Building size={32} className="text-sky-400" aria-hidden="true" />
                                    </div>

                                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 leading-tight">
                                        You&apos;re Invited to Join.
                                    </h2>

                                    <p className="text-[#94A3B8] text-base font-medium leading-relaxed mb-6">
                                        Join <span className="text-white font-bold px-2 py-0.5 bg-white/[0.06] border border-white/[0.1] rounded-md">{inviteDetails.organizationName}</span> on Kairon and help operate live productions.
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 font-mono">
                                        <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
                                            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
                                                <ShieldCheck size={18} aria-hidden="true" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-bold uppercase tracking-widest text-[#94A3B8]">Your Role</span>
                                                <span className="font-bold text-sm capitalize text-white">{inviteDetails.role === 'speaker' ? 'Speaker / Presenter' : inviteDetails.role}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                                                <Zap size={18} aria-hidden="true" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-bold uppercase tracking-widest text-[#94A3B8]">Access</span>
                                                <span className="font-bold text-sm text-white">Real-Time Studio</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-white/[0.08] flex items-center justify-between font-mono">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full border border-white/[0.1] bg-white/[0.04] flex items-center justify-center text-sky-400">
                                            <UserPlus size={16} aria-hidden="true" />
                                        </div>
                                        <p className="text-xs font-bold text-[#94A3B8] tracking-wide uppercase">Open Beta • Built for Live Event Teams</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
};
