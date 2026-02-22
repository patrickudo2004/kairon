import React, { useState } from 'react';
import { signInWithGoogle, signInWithMagicLink } from '../services/authService';
import { Mic, Mail, ArrowRight, Loader, Sun, Moon } from 'lucide-react';
import { useUIStore } from '../store/uiStore';

export const Auth: React.FC = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const { isDarkMode, toggleTheme } = useUIStore();

    const handleGoogleSignIn = async () => {
        try {
            setIsLoading(true);
            await signInWithGoogle();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
            setIsLoading(false);
        }
    };

    const handleMagicLinkSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        try {
            setIsLoading(true);
            await signInWithMagicLink(email);
            setMessage({
                type: 'success',
                text: mode === 'signin'
                    ? 'Check your email for the login link!'
                    : 'Success! Use the link sent to your email to verify your new account.'
            });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 relative">
            <button
                onClick={toggleTheme}
                className="absolute top-8 right-8 p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-xl backdrop-blur-md"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className="w-full max-w-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-2xl flex items-center justify-center shadow-lg mb-4">
                        <Mic className="text-white" size={32} />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                        {mode === 'signin' ? 'Welcome back' : 'Create Account'}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-center text-sm">
                        {mode === 'signin'
                            ? 'Sign in to manage your organizations, events and sync live timers across devices.'
                            : 'Sign up to start organizing professional events and workspaces today.'
                        }
                    </p>
                </div>

                {message && (
                    <div className={`p-4 rounded-xl mb-6 text-sm flex items-center gap-3 ${message.type === 'success'
                        ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                        : 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
                        }`}>
                        <span>{message.text}</span>
                    </div>
                )}

                <button
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-semibold text-slate-700 dark:text-slate-200 shadow-sm mb-6"
                >
                    {isLoading ? <Loader className="animate-spin" size={20} /> : (
                        <>
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            {mode === 'signin' ? 'Sign in with Google' : 'Sign up with Google'}
                        </>
                    )}
                </button>

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white dark:bg-slate-900 px-4 text-slate-500 uppercase tracking-widest font-bold">Or with email</span>
                    </div>
                </div>

                <form onSubmit={handleMagicLinkSignIn} className="space-y-4">
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-11 pr-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/30"
                    >
                        {mode === 'signin' ? 'Get Login Link' : 'Create Account'} <ArrowRight size={18} />
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
                    <p className="text-sm text-slate-500">
                        {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}
                        <button
                            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage(null); }}
                            className="ml-2 text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                        >
                            {mode === 'signin' ? "Sign up for free" : "Sign in instead"}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};
