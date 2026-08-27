import React, { useState } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';
import { Mic, Mail, ArrowRight, Loader, Sun, Moon, Sparkles, UserPlus, Building, ShieldCheck, Zap } from 'lucide-react';
import { useUIStore } from '../store/uiStore';

interface AuthProps {
    inviteDetails?: {
        organizationName: string;
        role: string;
        isGeneric?: boolean;
    } | null;
}

export const Auth: React.FC<AuthProps> = ({ inviteDetails }) => {
    const { signIn } = useAuthActions();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [step, setStep] = useState<'signIn' | 'verifyCode'>('signIn');
    const [code, setCode] = useState('');
    const { isDarkMode, toggleTheme } = useUIStore();

    const handleGoogleSignIn = async () => {
        try {
            setIsLoading(true);
            await signIn("google", { redirectTo: window.location.href });
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
                // Send OTP code to email
                await signIn("password", { email, flow: "email" });
                setMessage({
                    type: 'success',
                    text: 'Check your email for a one-time code!'
                });
                setStep('verifyCode');
            } else {
                // Verify the OTP code
                await signIn("password", { email, code });
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Sign-in failed. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 md:p-8 relative font-sans">
            <button
                onClick={toggleTheme}
                className="absolute top-4 right-4 md:top-8 md:right-8 p-3 rounded-2xl bg-white/80 dark:bg-[#121418] border border-slate-200 dark:border-[#22262E] text-slate-500 dark:text-[#8A93A4] hover:text-[#0EA5E9] transition-all shadow-md backdrop-blur-md z-50"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className={`w-full max-w-6xl mx-auto flex flex-col ${inviteDetails ? 'lg:flex-row' : 'items-center'} gap-8 lg:gap-16`}>

                {/* Invitation Card (Only shown if inviteDetails exists) */}
                {inviteDetails && (
                    <div className="flex-1 max-w-xl order-2 lg:order-1 animate-in slide-in-from-left-8 duration-700 font-sans">
                        <div className="bg-[#121418] rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden group border border-[#22262E]">
                            <div className="relative z-10 h-full flex flex-col justify-between">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0EA5E9]/10 text-[#0EA5E9] backdrop-blur-md rounded-full text-[11px] font-mono font-bold uppercase tracking-wider mb-6 border border-[#0EA5E9]/20">
                                        <Sparkles size={14} className="animate-pulse" /> Team Invitation
                                    </div>

                                    <div className="w-16 h-16 bg-[#181B22] rounded-2xl flex items-center justify-center mb-6 shadow-md border border-[#22262E]">
                                        <Building size={32} className="text-[#0EA5E9]" />
                                    </div>

                                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 leading-tight">
                                        You're Invited to Join.
                                    </h2>

                                    <p className="text-[#8A93A4] text-base font-medium leading-relaxed mb-6">
                                        Join <span className="text-white font-bold px-2 py-0.5 bg-[#181B22] border border-[#22262E] rounded-md">{inviteDetails.organizationName}</span> on Kairon and help operate live productions.
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 font-mono">
                                        <div className="flex items-center gap-3 bg-[#181B22] border border-[#22262E] rounded-xl p-4">
                                            <div className="w-8 h-8 rounded-lg bg-[#0EA5E9]/10 text-[#0EA5E9] flex items-center justify-center">
                                                <ShieldCheck size={18} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#8A93A4]">Your Role</span>
                                                <span className="font-bold text-sm capitalize text-white">{inviteDetails.role}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 bg-[#181B22] border border-[#22262E] rounded-xl p-4">
                                            <div className="w-8 h-8 rounded-lg bg-[#10B981]/10 text-[#10B981] flex items-center justify-center">
                                                <Zap size={18} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#8A93A4]">Access</span>
                                                <span className="font-bold text-sm text-white">Full Collaboration</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-[#22262E] flex items-center justify-between font-mono">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full border border-[#22262E] bg-[#181B22] flex items-center justify-center text-[#0EA5E9]">
                                            <UserPlus size={16} />
                                        </div>
                                        <p className="text-xs font-bold text-[#8A93A4] tracking-wide uppercase">Join 1,000+ top producers</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Auth Form Container */}
                <div className={`flex-1 w-full ${inviteDetails ? 'max-w-md' : 'max-w-md'} order-1 lg:order-2 flex flex-col justify-center`}>
                    <div className={inviteDetails ? '' : 'text-center'}>
                        {/* Logo & Title */}
                        <div className={`mb-8 ${inviteDetails ? 'lg:mb-10' : ''}`}>
                            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#121418] border border-[#22262E] text-[#0EA5E9] shadow-lg mb-4 ${inviteDetails ? 'lg:hidden' : ''}`}>
                                <Mic size={28} />
                            </div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-1">Kairon</h1>
                            <p className="text-slate-500 dark:text-[#8A93A4] text-sm">
                                {inviteDetails
                                    ? `Step inside to accept your invitation`
                                    : (mode === 'signin' ? 'Sign in to your workspace' : 'Create your account')}
                            </p>
                        </div>

                        {/* Message Banner */}
                        {message && (
                            <div className={`mb-6 p-4 rounded-xl text-sm font-medium border ${message.type === 'success'
                                ? 'bg-emerald-50 dark:bg-[#10B981]/10 border-emerald-200 dark:border-[#10B981]/30 text-emerald-700 dark:text-[#10B981]'
                                : 'bg-rose-50 dark:bg-[#EF4444]/10 border-rose-200 dark:border-[#EF4444]/30 text-rose-700 dark:text-[#EF4444]'
                                }`}>
                                {message.text}
                            </div>
                        )}

                        {/* Google Sign-In Button */}
                        <button
                            onClick={handleGoogleSignIn}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-xl border border-slate-200 dark:border-[#22262E] bg-white dark:bg-[#121418] text-slate-800 dark:text-white font-medium hover:border-[#0EA5E9] hover:shadow-md transition-all duration-200 mb-4 group disabled:opacity-60 text-sm"
                        >
                            {isLoading ? (
                                <Loader size={18} className="animate-spin text-[#0EA5E9]" />
                            ) : (
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                            )}
                            Continue with Google
                        </button>

                        {/* Divider */}
                        <div className="flex items-center gap-4 my-6">
                            <div className="flex-1 h-px bg-slate-200 dark:border-[#22262E]" />
                            <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-[#8A93A4] uppercase tracking-widest">or</span>
                            <div className="flex-1 h-px bg-slate-200 dark:border-[#22262E]" />
                        </div>

                        {/* Email OTP Form */}
                        <form onSubmit={handleEmailSignIn} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-[#8A93A4] mb-1.5 px-1">
                                    Email address
                                </label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={step === 'verifyCode'}
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-[#121418] border border-slate-200 dark:border-[#22262E] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#0EA5E9] outline-none transition-all disabled:opacity-60 text-sm font-mono"
                                    />
                                </div>
                            </div>

                            {step === 'verifyCode' && (
                                <div className="animate-in slide-in-from-bottom-2 duration-300">
                                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-[#8A93A4] mb-1.5 px-1">
                                        Verification Code
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter 6-digit code"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        required
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-[#121418] border border-slate-200 dark:border-[#22262E] rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-[#0EA5E9] outline-none transition-all text-center text-xl font-bold tracking-[0.4em] font-mono shadow-inner"
                                    />
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading || !email}
                                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-mono text-xs font-bold uppercase tracking-wider hover:shadow-md active:translate-y-0 transition-all duration-200 group disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <Loader size={18} className="animate-spin" />
                                ) : (
                                    <>
                                        {step === 'verifyCode' ? 'Verify Code' : (mode === 'signin' || inviteDetails ? 'Send Login Code' : 'Create Account')}
                                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* OTP Back Button */}
                        {step === 'verifyCode' && (
                            <button
                                onClick={() => { setStep('signIn'); setMessage(null); }}
                                className="w-full mt-4 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 hover:text-[#0EA5E9] transition-colors"
                            >
                                ← Use a different email
                            </button>
                        )}

                        {/* Mode Toggle */}
                        {!inviteDetails && (
                            <p className="text-center text-xs text-slate-500 dark:text-[#8A93A4] mt-6">
                                {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
                                <button
                                    onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage(null); setStep('signIn'); }}
                                    className="text-[#0EA5E9] font-bold hover:underline"
                                >
                                    {mode === 'signin' ? 'Sign up' : 'Sign in'}
                                </button>
                            </p>
                        )}

                        {inviteDetails && (
                            <div className="mt-6 p-4 bg-slate-100 dark:bg-[#181B22] rounded-xl border border-slate-200 dark:border-[#22262E]">
                                <p className="text-xs text-slate-500 dark:text-[#8A93A4] font-medium text-center leading-relaxed">
                                    By continuing, you agree to join the workspace and participate in its production activities.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
