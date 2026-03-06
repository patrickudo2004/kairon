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
            await signIn("google");
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
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 md:p-8 relative">
            <button
                onClick={toggleTheme}
                className="absolute top-4 right-4 md:top-8 md:right-8 p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-xl backdrop-blur-md z-50"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className={`w-full max-w-6xl mx-auto flex flex-col ${inviteDetails ? 'lg:flex-row' : 'items-center'} gap-8 lg:gap-16`}>

                {/* Invitation Card (Only shown if inviteDetails exists) */}
                {inviteDetails && (
                    <div className="flex-1 max-w-xl order-2 lg:order-1 animate-in slide-in-from-left-8 duration-700">
                        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[3rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden group border border-white/10">
                            {/* Decorative background elements */}
                            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors duration-1000" />
                            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl" />

                            <div className="relative z-10 h-full flex flex-col justify-between">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[11px] font-black uppercase tracking-widest mb-8 border border-white/10">
                                        <Sparkles size={14} className="animate-pulse" /> Team Invitation
                                    </div>

                                    <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-3xl flex items-center justify-center mb-8 shadow-2xl transform -rotate-3 group-hover:rotate-0 transition-transform duration-500 overflow-hidden border-4 border-white/20">
                                        <Building size={40} className="text-indigo-600" />
                                    </div>

                                    <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6 leading-[1.1]">
                                        You're <span className="text-indigo-200">Invited</span> to Join.
                                    </h2>

                                    <p className="text-indigo-100 text-lg md:text-xl font-medium leading-relaxed mb-8 opacity-90">
                                        Join <span className="text-white font-bold decoration-indigo-300/50 underline underline-offset-8 px-2 py-1 bg-white/10 rounded-xl">{inviteDetails.organizationName}</span> on Kairon and help manage professional event productions.
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
                                        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-500/30 flex items-center justify-center text-indigo-200">
                                                <ShieldCheck size={18} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">Your Role</span>
                                                <span className="font-bold text-sm capitalize">{inviteDetails.role}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-500/30 flex items-center justify-center text-indigo-200">
                                                <Zap size={18} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">Access</span>
                                                <span className="font-bold text-sm">Full Collaboration</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-white/10 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full border-2 border-white/20 bg-white/10 flex items-center justify-center">
                                            <UserPlus size={20} />
                                        </div>
                                        <p className="text-xs font-bold text-indigo-200 tracking-wide uppercase">Join 1,000+ top producers</p>
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
                        <div className={`mb-10 ${inviteDetails ? 'lg:mb-12' : ''}`}>
                            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-500 to-violet-600 shadow-2xl shadow-indigo-500/40 mb-6 ${inviteDetails ? 'lg:hidden' : ''}`}>
                                <Mic size={36} className="text-white" />
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Kairon</h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium">
                                {inviteDetails
                                    ? `Step inside to accept your invitation`
                                    : (mode === 'signin' ? 'Sign in to your workspace' : 'Create your free account')}
                            </p>
                        </div>

                        {/* Message Banner */}
                        {message && (
                            <div className={`mb-6 p-4 rounded-2xl text-sm font-medium border ${message.type === 'success'
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400'
                                : 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800/50 text-rose-700 dark:text-rose-400'
                                }`}>
                                {message.text}
                            </div>
                        )}

                        {/* Google Sign-In Button */}
                        <button
                            onClick={handleGoogleSignIn}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-bold hover:border-indigo-400 hover:shadow-lg transition-all duration-200 mb-4 group disabled:opacity-60"
                        >
                            {isLoading ? (
                                <Loader size={20} className="animate-spin" />
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
                        <div className="relative flex items-center gap-4 my-6">
                            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">or</span>
                            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                        </div>

                        {/* Email OTP Form */}
                        <form onSubmit={handleEmailSignIn} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                                    Email address
                                </label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={step === 'verifyCode'}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all disabled:opacity-60 font-medium"
                                    />
                                </div>
                            </div>

                            {step === 'verifyCode' && (
                                <div className="animate-in slide-in-from-bottom-2 duration-300">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                                        Verification Code
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter 6-digit code"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        required
                                        className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-center text-2xl font-black tracking-[0.5em] font-mono shadow-inner"
                                    />
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading || !email}
                                className="w-full flex items-center justify-center gap-3 py-5 px-6 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-widest hover:translate-y-[-2px] hover:shadow-2xl active:translate-y-0 transition-all duration-200 group disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <Loader size={20} className="animate-spin" />
                                ) : (
                                    <>
                                        {step === 'verifyCode' ? 'Verify Code' : (mode === 'signin' || inviteDetails ? 'Send Login Code' : 'Create Account')}
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* OTP Back Button */}
                        {step === 'verifyCode' && (
                            <button
                                onClick={() => { setStep('signIn'); setMessage(null); }}
                                className="w-full mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors"
                            >
                                ← Use a different email
                            </button>
                        )}

                        {/* Mode Toggle */}
                        {!inviteDetails && (
                            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8">
                                {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
                                <button
                                    onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage(null); setStep('signIn'); }}
                                    className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                                >
                                    {mode === 'signin' ? 'Sign up' : 'Sign in'}
                                </button>
                            </p>
                        )}

                        {inviteDetails && (
                            <div className="mt-8 p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
                                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium text-center leading-relaxed">
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
