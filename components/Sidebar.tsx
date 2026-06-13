import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Settings,
    Calendar,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Check,
    Building,
    Mic,
    Wifi,
    WifiOff,
    Play,
    ClipboardList,
    FileText,
    Edit3,
    Monitor,
    Radio
} from 'lucide-react';
import { Organization, Profile, Program } from '../types';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { ProfileDropdown } from './ProfileDropdown';
import { useTimerSync } from '../hooks/useTimerSync';
import { formatDuration } from '../utils/time';

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
    const elapsed = useTimerSync(session.timerStartTimestamp, session.isTimerActive || false, session.secondsElapsed || 0);
    const currentSlot = session.slots[session.currentSlotIndex || 0];
    const timeLeft = currentSlot ? (currentSlot.durationMinutes * 60 - elapsed) : 0;

    return (
        <button
            onClick={() => onSelect(session.id)}
            className={`w-full p-2.5 rounded-lg transition-all cursor-pointer group flex items-center justify-between gap-3 mb-1
                ${isSelected 
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' 
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}
            `}
        >
            <div className="flex items-center gap-2 min-w-0">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${session.isTimerActive ? (isSelected ? 'bg-indigo-500' : 'bg-emerald-500') : 'bg-slate-400'}`} />
                <span className="text-xs font-bold truncate tracking-tight">{session.title}</span>
            </div>
            <span className="text-[10px] font-mono font-bold opacity-60">
                {formatDuration(timeLeft)}
            </span>
            {isSelected && <Check size={14} />}
        </button>
    );
};

const VenueSwitcher: React.FC<{
    activeSessions: Program[];
    selectedLiveId: string | null;
    onSelect: (id: string) => void;
    isCollapsed: boolean;
    onStopAllSessions?: () => void;
}> = ({ activeSessions, selectedLiveId, onSelect, isCollapsed, onStopAllSessions }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const selectedSession = activeSessions.find(s => s.id === selectedLiveId) || activeSessions[0];

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (activeSessions.length === 0) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            {!isCollapsed && (
                <div className="flex items-center justify-between gap-2 px-3 mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live Venues</span>
                    {onStopAllSessions && (
                        <button
                            onClick={onStopAllSessions}
                            className="text-[10px] text-rose-500 hover:text-rose-600 font-bold tracking-tight transition-colors"
                        >
                            End All
                        </button>
                    )}
                </div>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 rounded-xl transition-all border group
                    ${selectedLiveId === selectedSession?.id ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/30' : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-indigo-500/30'}
                    ${isCollapsed ? 'w-10 h-10 justify-center p-0' : 'w-full px-3 py-2'}
                `}
                title={isCollapsed ? (selectedSession?.title || 'Switch Venue') : ''}
            >
                <div className={`w-2 h-2 rounded-full shrink-0 ${selectedSession?.isTimerActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                {!isCollapsed && (
                    <>
                        <span className="text-xs font-bold truncate flex-1 text-left text-slate-700 dark:text-slate-200">
                            {selectedSession?.title || 'Switch Venue'}
                        </span>
                        <ChevronDown size={14} className={`text-slate-400 group-hover:text-indigo-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </>
                )}
            </button>

            {isOpen && (
                <div className={`absolute bottom-full left-0 mb-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200
                    ${isCollapsed ? 'w-48 ml-1' : 'w-full'}
                `}>
                    <div className="p-1 max-h-[300px] overflow-y-auto no-scrollbar">
                        {activeSessions.map((session) => (
                            <LiveSessionItem 
                                key={session.id}
                                session={session}
                                isSelected={selectedLiveId === session.id}
                                onSelect={(id) => {
                                    onSelect(id);
                                    setIsOpen(false);
                                }}
                                isCollapsed={isCollapsed}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
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
    activeSessions,
    selectedLiveId,
    onSelectLive,
    isCollapsed,
    onToggle,
    onCreateOrg,
    onStopAllSessions,
    programId
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
        { icon: Radio, label: 'Command Center', path: getLinkPath('/command') },
        { icon: Calendar, label: 'Calendar', path: '/calendar' },
        { icon: FileText, label: 'User Guide', path: '/guide' },
        { icon: Settings, label: 'Workspace', path: '/admin' },
    ];

    return (
        <aside
            className={`fixed left-0 top-0 h-full bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 z-50 flex flex-col no-print hidden lg:flex ${isCollapsed ? 'w-20' : 'w-64'}`}
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
            <nav className="flex-1 px-3 space-y-1 py-4 overflow-y-auto custom-scrollbar">
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

                {/* Profile */}
                <ProfileDropdown
                    user={user!}
                    profile={profile}
                    onProfileUpdate={onProfileUpdate}
                    isCollapsed={isCollapsed}
                />

                {/* Venue Switcher (Bottom Left Dropdown) */}
                {activeSessions.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <VenueSwitcher 
                            activeSessions={activeSessions}
                            selectedLiveId={selectedLiveId}
                            onSelect={onSelectLive}
                            isCollapsed={isCollapsed}
                            onStopAllSessions={onStopAllSessions}
                        />
                    </div>
                )}
            </div>
        </aside>
    );
};
