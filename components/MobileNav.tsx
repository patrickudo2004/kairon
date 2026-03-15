import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Edit3,
    Play,
    Monitor,
    MoreHorizontal,
    Calendar,
    ClipboardList,
    FileText,
    Settings,
    Crown,
    CheckCircle,
    User
} from 'lucide-react';
import { Organization, Profile } from '../types';

interface MobileNavProps {
    activeOrg: Organization | null;
    profile: Profile | null;
    user: { id: string, email?: string } | null;
    onSignOut: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
    activeOrg,
    profile,
    user,
    onSignOut
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const primaryItems = [
        { icon: LayoutDashboard, label: 'Home', path: '/' },
        { icon: Edit3, label: 'Edit', path: '/editor' },
        { icon: Play, label: 'Live', path: '/live' },
        { icon: Monitor, label: 'HUD', path: '/monitors' },
    ];

    const secondaryItems = [
        { icon: ClipboardList, label: 'List View', path: '/list' },
        { icon: Calendar, label: 'Calendar', path: '/calendar' },
        { icon: FileText, label: 'User Guide', path: '/guide' },
        { icon: Settings, label: 'Workspace', path: '/admin' },
    ];

    return (
        <>
            {/* Bottom Nav Bar */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 safe-area-pb no-print">
                <div className="flex items-center justify-around h-16 px-2">
                    {primaryItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `
                                flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors
                                ${isActive 
                                    ? 'text-indigo-600 dark:text-indigo-400' 
                                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}
                            `}
                        >
                            <item.icon size={20} />
                            <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
                        </NavLink>
                    ))}

                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors
                            ${isMenuOpen 
                                ? 'text-indigo-600 dark:text-indigo-400' 
                                : 'text-slate-400 dark:text-slate-500'}
                        `}
                    >
                        <MoreHorizontal size={20} />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">More</span>
                    </button>
                </div>
            </nav>

            {/* Slide-up Menu */}
            {isMenuOpen && (
                <div 
                    className="lg:hidden fixed inset-0 z-[60] animate-in fade-in duration-300"
                    onClick={() => setIsMenuOpen(false)}
                >
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                    <div 
                        className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-[2.5rem] p-6 shadow-2xl animate-in slide-in-from-bottom-full duration-500"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Drag Handle */}
                        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-8" />

                        <div className="space-y-6">
                            {/* Account Section */}
                            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg">
                                    {profile?.name?.charAt(0) || user?.email?.charAt(0) || <User size={24} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-slate-900 dark:text-white truncate">
                                        {profile?.name || 'Kairon User'}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                        {user?.email}
                                    </div>
                                </div>
                                {activeOrg?.subscriptionStatus === 'pro' && (
                                    <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg">
                                        <Crown size={16} />
                                    </div>
                                )}
                            </div>

                            {/* Secondary Links */}
                            <div className="grid grid-cols-2 gap-3">
                                {secondaryItems.map((item) => (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={({ isActive }) => `
                                            flex items-center gap-3 p-4 rounded-2xl border transition-all
                                            ${isActive 
                                                ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400' 
                                                : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300'}
                                        `}
                                    >
                                        <item.icon size={18} />
                                        <span className="text-xs font-bold uppercase tracking-tight">{item.label}</span>
                                    </NavLink>
                                ))}
                            </div>

                            {/* Logout Button */}
                            <button
                                onClick={() => {
                                    setIsMenuOpen(false);
                                    onSignOut();
                                }}
                                className="w-full p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl font-bold text-xs uppercase tracking-widest border border-rose-100 dark:border-rose-500/20 transition-all active:scale-95"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
