import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
// import { User as SupabaseUser } from '@supabase/supabase-js';
import {
    LayoutDashboard,
    Settings,
    Users,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Building,
    LogOut,
    Mic,
    Palette,
    Wifi,
    WifiOff,
    Crown,
    Play,
    ClipboardList,
    FileText,
    Edit3,
    Monitor
} from 'lucide-react';
import { Organization, Profile, Slot } from '../types';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { ProfileDropdown } from './ProfileDropdown';

interface SidebarProps {
    activeOrg: Organization | null;
    userOrganizations: Organization[];
    activeOrgId?: string | null;
    setActiveOrgId: (id: string) => void;
    profile: Profile | null;
    user: { id: string, email?: string } | null;
    onProfileUpdate: (p: Profile) => void;
    handleSignOut: () => void;
    isOnline: boolean;
    programTitle: string;
    programId: string | null;
    activeSessions: Program[];
    selectedLiveId: string | null;
    onSelectLive: (id: string) => void;
    isCollapsed: boolean;
    onToggle: (collapsed: boolean) => void;
    onCreateOrg: () => void;
    onStopAllSessions?: () => void;
}

const LiveSessionItem: React.FC<{ 
    session: Program; 
    isSelected: boolean; 
    onSelect: (id: string) => void; 
    isCollapsed: boolean;
}> = ({ session, isSelected, onSelect, isCollapsed }) => {
    // Mini-timer for sidebar glanceability
    const elapsed = useTimerSync(session.timerStartTimestamp, session.isTimerActive || false, session.secondsElapsed || 0);
    const currentSlot = session.slots[session.currentSlotIndex || 0];
    const timeLeft = currentSlot ? (currentSlot.durationMinutes * 60 - elapsed) : 0;

    return (
        <button
            onClick={() => onSelect(session.id)}
            className={`w-full p-3 rounded-xl transition-all group relative animate-in fade-in slide-in-from-left-2 mb-2 border ${
                isSelected 
                    ? 'bg-emerald-500/10 border-emerald-500/30 shadow-lg shadow-emerald-500/5' 
                    : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 hover:border-emerald-500/20'
            }`}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${session.isTimerActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                    {!isCollapsed && (
                        <div className="flex flex-col items-start min-w-0">
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${isSelected ? 'text-emerald-600' : 'text-slate-500'}`}>
                                {session.title}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-slate-400">
                                {formatDuration(timeLeft)}
                            </span>
                        </div>
                    )}
                </div>
            </div>
            {isCollapsed && (
                <div className="absolute left-full ml-3 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[100] shadow-xl border border-slate-800">
                    {session.title} • {formatDuration(timeLeft)}
                </div>
            )}
        </button>
    );
};

export const Sidebar: React.FC<SidebarProps> = ({
    activeOrg,
    userOrganizations,
    setActiveOrgId,
    profile,
    user,
    onProfileUpdate,
    handleSignOut,
    isOnline,
    programTitle,
    programId,
    activeSessions,
    selectedLiveId,
    onSelectLive,
    isCollapsed,
    onToggle,
    onCreateOrg,
    onStopAllSessions
}) => {
    const location = useLocation();

    // Helper to build links that preserve the current ID
    const getLinkPath = (base: string) => {
        const idToUse = selectedLiveId || programId;
        if (!idToUse || idToUse.startsWith('local-')) return base;
        return `${base}?id=${idToUse}`;
    };

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Edit3, label: 'Editor', path: getLinkPath('/editor') },
        { icon: Play, label: 'Live', path: getLinkPath('/live') },
        { icon: ClipboardList, label: 'List', path: getLinkPath('/list') },
        { icon: Monitor, label: 'Monitors', path: getLinkPath('/monitors') },
        { icon: Calendar, label: 'Calendar', path: '/calendar' }, // Opens the month view Wrapper
        { icon: FileText, label: 'User Guide', path: '/guide' },
        { icon: Settings, label: 'Workspace', path: '/admin' },
    ];

    return (
        <aside
            className={`fixed left-0 top-0 h-full bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 z-50 flex flex-col no-print hidden lg:flex ${isCollapsed ? 'w-20' : 'w-64'
                }`}
        >
            {/* Brand / Logo Section */}
            <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                {!isCollapsed && (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md bg-gradient-to-tr from-indigo-500 to-violet-500">
                            <Mic className="text-white" size={18} />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">KAIRON</span>
                    </div>
                )}
                {isCollapsed && (
                    <div className="w-10 h-10 mx-auto rounded-lg flex items-center justify-center shadow-md bg-gradient-to-tr from-indigo-500 to-violet-500">
                        <Mic className="text-white" size={18} />
                    </div>
                )}
                <button
                    onClick={() => onToggle(!isCollapsed)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors hidden md:block"
                >
                    {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>

            {/* Workspace Switcher Section */}
            <div className="p-4">
                <WorkspaceSwitcher
                    activeOrg={activeOrg}
                    organizations={userOrganizations}
                    onSelect={setActiveOrgId}
                    onCreateNew={onCreateOrg}
                    isCollapsed={isCollapsed}
                />
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 px-3 space-y-1 py-4 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.label}
                        to={item.path}
                        className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group
              ${isActive
                                ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100'
                            }
            `}
                        title={isCollapsed ? item.label : ''}
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon
                                    size={20}
                                    className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'}
                                />
                                {!isCollapsed && <span className="text-sm font-semibold">{item.label}</span>}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Bottom Section: Status & Profile */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                {/* Sync Status */}
                <div className={`flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 ${isCollapsed ? 'justify-center' : ''}`}>
                    {isOnline ? (
                        <Wifi size={14} className="text-emerald-500" />
                    ) : (
                        <WifiOff size={14} className="text-rose-500" />
                    )}
                    {!isCollapsed && (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            {isOnline ? 'Live Sync' : 'Offline'}
                        </span>
                    )}
                </div>

                {/* Venue Dock: Active Sessions */}
                {activeSessions.length > 0 && (
                    <div className="space-y-1">
                        {!isCollapsed && (
                            <div className="flex items-center justify-between gap-2 px-3 mb-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Venues</span>
                                {onStopAllSessions && (
                                    <button
                                        onClick={onStopAllSessions}
                                        className="text-[10px] text-rose-500 hover:text-rose-600 font-bold uppercase tracking-tight"
                                        title="Stop all live sessions"
                                    >
                                        End All
                                    </button>
                                )}
                            </div>
                        )}
                        {activeSessions.map(session => (
                            <LiveSessionItem 
                                key={session.id}
                                session={session}
                                isSelected={selectedLiveId === session.id}
                                onSelect={onSelectLive}
                                isCollapsed={isCollapsed}
                            />
                        ))}
                    </div>
                )}

                {/* Pro Teaser */}
                {!isCollapsed && activeOrg?.subscriptionStatus !== 'pro' && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
                        <div className="flex items-center gap-2 mb-1">
                            <Crown size={14} className="text-amber-500 fill-amber-500" />
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">Kairon Pro</span>
                        </div>
                        <p className="text-[10px] text-amber-700/70 dark:text-amber-400/50 leading-tight">Unlock AI rebalancing & branding.</p>
                    </div>
                )}

                {/* Profile */}
                <ProfileDropdown
                    user={user!}
                    profile={profile}
                    onProfileUpdate={onProfileUpdate}
                    isCollapsed={isCollapsed}
                />
            </div>
        </aside>
    );
};
