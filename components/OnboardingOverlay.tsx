import React, { useState } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';
import { Building, Rocket, ArrowRight, Star, ShieldCheck, Zap, X } from 'lucide-react';
import { createOrganization } from '../services/orgService';
import { Organization } from '../types';

interface OnboardingOverlayProps {
    userId: string;
    onOrgCreated: (org: Organization) => void;
    userEmail: string;
    onClose?: () => void;
}

export const OnboardingOverlay: React.FC<OnboardingOverlayProps> = ({ userId, onOrgCreated, userEmail, onClose }) => {
    const { signOut } = useAuthActions();
    const [orgName, setOrgName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orgName.trim()) return;

        setIsCreating(true);
        setError(null);
        try {
            const slug = orgName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            const newOrg = await createOrganization(orgName, slug, userId);
            onOrgCreated(newOrg);
        } catch (err: any) {
            setError(err.message || 'Failed to create workspace. Try a different name.');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => onClose?.()}
        >
            <div
                className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-500 relative"
                onClick={(e) => e.stopPropagation()}
            >
                {onClose && (
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 z-20 p-2 rounded-full bg-slate-100/10 hover:bg-slate-100/20 text-white/50 hover:text-white transition-all backdrop-blur-md"
                        title="Close"
                    >
                        <X size={20} />
                    </button>
                )}

                {/* Left Side: Illustration & Value Prop */}
                <div className="md:w-5/12 bg-indigo-600 p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl" />

                    <div className="relative z-10">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-sm">
                            <Rocket size={32} className="text-white" />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4 leading-tight">
                            Welcome to the <span className="text-indigo-200">Kairon</span> Era.
                        </h2>
                        <p className="text-indigo-100 text-lg mb-8 leading-relaxed opacity-90">
                            Professional events start here. Let's build your first secure workspace in seconds.
                        </p>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg">
                                    <ShieldCheck size={14} />
                                </div>
                                <span className="text-sm font-medium">Enterprise-grade security</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg">
                                    <Zap size={14} />
                                </div>
                                <span className="text-sm font-medium">Real-time sync enabled</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg">
                                    <Star size={14} />
                                </div>
                                <span className="text-sm font-medium">Custom branding controls</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 pt-12 md:pt-0">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400" />
                            <p className="text-xs font-bold uppercase tracking-widest text-indigo-300">Identity Verified</p>
                        </div>
                        <p className="text-sm font-medium text-white/50">{userEmail}</p>
                        <button
                            onClick={() => signOut()}
                            className="mt-4 text-xs font-bold text-white/40 hover:text-white underline"
                        >
                            Not you? Sign out
                        </button>
                    </div>
                </div>

                {/* Right Side: Action */}
                <div className="md:w-7/12 p-8 md:p-12 flex flex-col justify-center bg-white dark:bg-slate-900">
                    <div className="max-w-md w-full mx-auto">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                                <Building size={20} />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Workspace Setup</span>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">What's your team name?</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">This will be the home for all your events, schedules, and team members.</p>

                        <form onSubmit={handleCreate} className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Organization Name</label>
                                <input
                                    autoFocus
                                    required
                                    type="text"
                                    placeholder="e.g. Acme Production Hub"
                                    value={orgName}
                                    onChange={(e) => setOrgName(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 text-lg text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-inner"
                                />
                                {error && <p className="mt-2 text-sm text-rose-500 font-medium px-1">{error}</p>}
                            </div>

                            <button
                                disabled={isCreating || !orgName.trim()}
                                type="submit"
                                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:translate-y-[-2px] hover:shadow-xl active:translate-y-[0px] transition-all disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none group"
                            >
                                {isCreating ? (
                                    <div className="w-6 h-6 border-4 border-white/30 border-t-white dark:border-slate-950/30 dark:border-t-slate-950 rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Create Workspace
                                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        <p className="mt-8 text-center text-xs text-slate-400 leading-relaxed">
                            By creating a workspace, you agree to our Terms of Service.<br />
                            You can change this name and add branding later in Settings.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
