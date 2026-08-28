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
    User,
    Sun,
    Moon,
    Building2,
    ChevronRight,
    LogOut
} from 'lucide-react';
import { Organization, Profile } from '../types';

interface MobileNavProps {
    activeOrg: Organization | null;
    profile: Profile | null;
    user: { id: string, email?: string } | null;
    onSignOut: () => void;
    isDarkMode: boolean;
    onToggleTheme: () => void;
    organizations: Organization[];
    onSelectOrg: (id: string | null) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
    activeOrg,
    profile,
    user,
    onSignOut,
    isDarkMode,
    onToggleTheme,
    organizations,
    onSelectOrg
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const displayName = (profile as any)?.fullName?.trim() || (profile as any)?.name?.trim() || (user?.email ? user.email.split('@')[0] : 'Kairon User');
    const initial = displayName.charAt(0).toUpperCase();

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
            {/* Bottom Nav Bar - High Z-index! */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[150] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 safe-area-pb no-print">
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

            {/* Slide-up Menu Drawer */}
            {isMenuOpen && (
                <div 
                    className="lg:hidden fixed inset-0 z-[160] animate-in fade-in duration-300"
                    onClick={() => setIsMenuOpen(false)}
                >
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                    <div 
                        className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-[2.5rem] p-6 pb-12 shadow-2xl animate-in slide-in-from-bottom-full duration-500 max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Drag Handle */}
                        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-8" />

                        <div className="space-y-8">
                            {/* Profile & Theme Settings */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xl">
                                        {initial}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-bold text-slate-900 dark:text-white truncate">
                                            {displayName}
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                            {user?.email}
                                        </div>
                                    </div>
                                </div>
                                
                                <button 
                                    onClick={onToggleTheme}
                                    className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-500 dark:text-slate-400 active:scale-95 transition-all"
                                >
                                    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                                </button>
                            </div>

                            {/* Organization Switcher */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between px-2">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Organizations</h4>
                                    {activeOrg?.subscriptionStatus === 'pro' && (
                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/10">
                                            <Crown size={12} />
                                            <span className="text-[10px] font-black uppercase">PRO</span>
                                        </div>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    {organizations.map((org) => (
                                        <button
                                            key={org.id}
                                            onClick={() => {
                                                onSelectOrg(org.id);
                                                setIsMenuOpen(false);
                                            }}
                                            className={`flex items-center justify-between p-4 rounded-[2rem] border transition-all active:scale-[0.98] ${
                                                org.id === activeOrg?.id
                                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                                    : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shrink-0 ${org.id === activeOrg?.id ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-900 text-slate-400'}`}>
                                                    {org.logoUrl ? (
                                                        <img src={org.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                                                    ) : (
                                                        <Building2 size={18} />
                                                    )}
                                                </div>
                                                <span className="font-bold text-sm truncate">{org.name}</span>
                                            </div>
                                            {org.id === activeOrg?.id ? <div className="w-2 h-2 rounded-full bg-white animate-pulse" /> : <ChevronRight size={16} className="opacity-30" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Secondary Navigation Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                {secondaryItems.map((item) => (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={({ isActive }) => `
                                            flex items-center gap-3 p-4 rounded-[2rem] border transition-all
                                            ${isActive 
                                                ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400' 
                                                : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 active:scale-95'}
                                        `}
                                    >
                                        <item.icon size={18} />
                                        <span className="text-xs font-bold uppercase tracking-tight">{item.label}</span>
                                    </NavLink>
                                ))}
                            </div>

                            {/* Footer Utility */}
                            <button
                                onClick={() => {
                                    setIsMenuOpen(false);
                                    onSignOut();
                                }}
                                className="w-full p-5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-[2.5rem] font-bold text-xs uppercase tracking-widest border border-rose-100 dark:border-rose-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <LogOut size={18} />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
