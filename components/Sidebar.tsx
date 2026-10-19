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
    Radio,
    Sparkles
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
    editorProgramId?: string | null;
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
            className={`w-full p-2 rounded-md transition-all cursor-pointer group flex items-center justify-between gap-2 mb-1 font-mono text-xs
                ${isSelected 
                    ? 'bg-slate-100 dark:bg-[#181B22] text-slate-900 dark:text-white border border-slate-300 dark:border-[#2D333F] font-bold' 
                    : 'hover:bg-slate-100 dark:hover:bg-[#121418] text-slate-600 dark:text-[#8A93A4] hover:text-slate-900 dark:hover:text-white border border-transparent'}
            `}
        >
            <div className="flex items-center gap-2 min-w-0">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${session.isTimerActive ? 'bg-[#10B981] animate-tally' : 'bg-[#6A7382]'}`} />
                <span className="truncate tracking-tight">{session.title}</span>
            </div>
            <span className="text-[10px] font-bold text-[#0EA5E9]">
                {formatDuration(timeLeft)}
            </span>
            {isSelected && <Check size={12} className="text-[#0EA5E9]" />}
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

    if (isCollapsed) {
        return (
            <div className="px-2 py-3 border-b border-slate-200 dark:border-[#22262E] flex justify-center">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative p-2 bg-slate-50 dark:bg-[#121418] hover:bg-slate-100 dark:hover:bg-[#181B22] border border-slate-200 dark:border-[#22262E] rounded-md transition-all group"
                    title={`Live Channels: ${activeSessions.length}`}
                >
                    <div className="w-2 h-2 rounded-full bg-[#10B981] animate-tally absolute top-1 right-1" />
                    <Radio size={16} className="text-slate-700 dark:text-white" />
                </button>
            </div>
        );
    }

    return (
        <div className="px-3 py-3 border-b border-slate-200 dark:border-[#22262E] relative font-sans" ref={dropdownRef}>
            <div className="flex items-center justify-between mb-1.5 px-1">
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500 dark:text-[#8A93A4] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-tally"></span>
                    Live Channels ({activeSessions.length})
                </span>
                {onStopAllSessions && (
                    <button
                        onClick={onStopAllSessions}
                        className="text-[9px] font-mono text-[#EF4444] hover:underline uppercase"
                    >
                        Stop All
                    </button>
                )}
            </div>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-2 bg-slate-50 dark:bg-[#121418] hover:bg-slate-100 dark:hover:bg-[#181B22] border border-slate-200 dark:border-[#22262E] rounded-md text-xs font-semibold text-slate-900 dark:text-white transition-all"
            >
                <div className="flex items-center gap-2 truncate">
                    <div className={`w-1.5 h-1.5 rounded-full ${selectedSession?.isTimerActive ? 'bg-[#10B981] animate-tally' : 'bg-[#6A7382]'}`} />
                    <span className="truncate">{selectedSession?.title || 'Select Channel'}</span>
                </div>
                <ChevronDown size={13} className={`text-slate-400 dark:text-[#8A93A4] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute left-3 right-3 top-full mt-1 bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#2D333F] rounded-md p-1 shadow-2xl z-50 animate-in fade-in duration-150">
                    {activeSessions.map((session) => (
                        <LiveSessionItem
                            key={session.id}
                            session={session}
                            isSelected={session.id === selectedLiveId}
                            onSelect={(id) => {
                                onSelect(id);
                                setIsOpen(false);
                            }}
                            isCollapsed={false}
                        />
                    ))}
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
    programId,
    editorProgramId
}) => {
    const location = useLocation();

    const getLinkPath = (base: string) => {
        const idToUse = base === '/editor' ? (editorProgramId || programId) : (selectedLiveId || programId);
        if (!idToUse || idToUse.startsWith('local-')) return base;
        return `${base}?id=${idToUse}`;
    };

    const navGroups = [
        {
            title: 'PLAN & PREPARE',
            items: [
                { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
                { icon: Edit3, label: 'Editor', path: getLinkPath('/editor') },
                { icon: Calendar, label: 'Calendar', path: '/calendar' },
            ],
        },
        {
            title: 'LIVE PRODUCTION',
            items: [
                { icon: Play, label: 'Live Control', path: getLinkPath('/live') },
                { icon: Monitor, label: 'Monitors & Displays', path: getLinkPath('/monitors') },
                { icon: Radio, label: 'Command Center', path: getLinkPath('/command') },
                { icon: ClipboardList, label: 'Rundown List', path: getLinkPath('/list') },
            ],
        },
        {
            title: 'SYSTEM',
            items: [
                { icon: FileText, label: 'User Guide', path: '/guide' },
                { icon: Settings, label: 'Workspace', path: '/admin' },
            ],
        },
    ];

    return (
        <aside
            className={`shrink-0 h-full bg-white dark:bg-[#0D0E12] border-r border-slate-200 dark:border-[#22262E] text-slate-900 dark:text-white transition-all duration-200 z-40 flex flex-col no-print hidden lg:flex font-sans ${isCollapsed ? 'w-14' : 'w-56'}`}
        >
            {/* Brand / Logo Header */}
            <div className={`border-b border-slate-200 dark:border-[#22262E] transition-all ${isCollapsed ? 'p-2 flex flex-col items-center gap-1' : 'px-3 py-2.5 flex items-center justify-between'}`}>
                {!isCollapsed ? (
                    <>
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#181B22] border border-slate-200 dark:border-[#2D333F] flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                                {activeOrg?.logoUrl ? (
                                    <img src={activeOrg.logoUrl} alt="Logo" className="w-full h-full object-contain p-1 shrink-0" />
                                ) : (
                                    <Mic className="text-[#0EA5E9] shrink-0" size={16} />
                                )}
                            </div>
                            <span className="font-mono font-bold text-xs tracking-wider text-slate-900 dark:text-white truncate uppercase">
                                {activeOrg?.name ? activeOrg.name : 'KAIRON'}
                            </span>
                        </div>
                        <button
                            onClick={() => onToggle(true)}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[#181B22] text-slate-400 dark:text-[#6A7382] hover:text-slate-800 dark:hover:text-white transition-colors hidden md:block"
                            title="Collapse Sidebar (Ctrl+B)"
                        >
                            <ChevronLeft size={14} />
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={() => onToggle(false)}
                            className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-[#181B22] border border-slate-200 dark:border-[#2D333F] flex items-center justify-center shrink-0 overflow-hidden shadow-xs hover:border-[#0EA5E9] transition-all group"
                            title="Expand Sidebar (Ctrl+B)"
                        >
                            {activeOrg?.logoUrl ? (
                                <img src={activeOrg.logoUrl} alt="Logo" className="w-full h-full object-contain p-1 shrink-0" />
                            ) : (
                                <Mic className="text-[#0EA5E9] shrink-0" size={16} />
                            )}
                        </button>
                        <button
                            onClick={() => onToggle(false)}
                            className="w-6 h-4 flex items-center justify-center rounded text-slate-400 dark:text-[#6A7382] hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#181B22] transition-colors"
                            title="Expand Sidebar (Ctrl+B)"
                        >
                            <ChevronRight size={12} />
                        </button>
                    </>
                )}
            </div>

            {/* Workspace Switcher */}
            <div className="p-2.5 border-b border-slate-200 dark:border-[#22262E]">
                <WorkspaceSwitcher
                    activeOrg={activeOrg}
                    organizations={userOrganizations}
                    onSelect={setActiveOrgId}
                    onCreateNew={onCreateOrg}
                    isCollapsed={isCollapsed}
                />
            </div>

            {/* Multi-Track Live Channels (if active) */}
            <VenueSwitcher
                activeSessions={activeSessions}
                selectedLiveId={selectedLiveId}
                onSelect={onSelectLive}
                isCollapsed={isCollapsed}
                onStopAllSessions={onStopAllSessions}
            />

            {/* Grouped Studio Navigation Items */}
            <nav className="flex-1 px-2 py-2.5 space-y-3 overflow-y-auto custom-scrollbar">
                {navGroups.map((group) => (
                    <div key={group.title} className="space-y-0.5">
                        {!isCollapsed && (
                            <div className="px-2.5 pb-1 text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400 dark:text-[#6A7382]">
                                {group.title}
                            </div>
                        )}
                        {group.items.map((item) => (
                            <NavLink
                                key={item.label}
                                to={item.path}
                                className={({ isActive }) => `
                                    flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-2.5 px-2.5'} py-1.5 rounded-md transition-all group font-mono text-xs font-semibold
                                    ${isActive
                                        ? 'bg-slate-100 dark:bg-[#181B22] text-slate-900 dark:text-white border border-slate-300 dark:border-[#2D333F] shadow-xs'
                                        : 'text-slate-600 dark:text-[#8A93A4] hover:bg-slate-100 dark:hover:bg-[#121418] hover:text-slate-900 dark:hover:text-white border border-transparent'
                                    }
                                `}
                                title={isCollapsed ? item.label : undefined}
                            >
                                <item.icon
                                    size={15}
                                    className={`shrink-0 transition-colors ${
                                        location.pathname === item.path.split('?')[0]
                                            ? 'text-[#0EA5E9]'
                                            : 'text-slate-400 dark:text-[#6A7382] group-hover:text-slate-800 dark:group-hover:text-white'
                                    }`}
                                />
                                {!isCollapsed && <span className="truncate">{item.label}</span>}
                            </NavLink>
                        ))}
                    </div>
                ))}
            </nav>

            {/* Footer Profile */}
            <div className="p-2.5 border-t border-slate-200 dark:border-[#22262E] flex flex-col gap-1.5">
                <ProfileDropdown
                    profile={profile}
                    user={user}
                    onUpdate={onProfileUpdate}
                    onSignOut={handleSignOut}
                    handleSignOut={handleSignOut}
                    isCollapsed={isCollapsed}
                />
            </div>
        </aside>
    );
};
