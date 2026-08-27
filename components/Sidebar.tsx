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
            className={`w-full p-2 rounded-md transition-all cursor-pointer group flex items-center justify-between gap-2 mb-1 font-mono
                ${isSelected 
                    ? 'bg-[#181B22] text-white border border-[#2D333F]' 
                    : 'hover:bg-[#121418] text-[#8A93A4] border border-transparent'}
            `}
        >
            <div className="flex items-center gap-2 min-w-0">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${session.isTimerActive ? 'bg-[#10B981] animate-tally' : 'bg-[#6A7382]'}`} />
                <span className="text-xs font-semibold truncate tracking-tight">{session.title}</span>
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
            <div className="px-2 py-3 border-b border-[#22262E] flex justify-center">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative p-2 bg-[#121418] hover:bg-[#181B22] border border-[#22262E] rounded-md transition-all group"
                    title={`Live Channels: ${activeSessions.length}`}
                >
                    <div className="w-2 h-2 rounded-full bg-[#10B981] animate-tally absolute top-1 right-1" />
                    <Radio size={16} className="text-white" />
                </button>
            </div>
        );
    }

    return (
        <div className="px-3 py-3 border-b border-[#22262E] relative font-sans" ref={dropdownRef}>
            <div className="flex items-center justify-between mb-1.5 px-1">
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#8A93A4] flex items-center gap-1.5">
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
                className="w-full flex items-center justify-between p-2 bg-[#121418] hover:bg-[#181B22] border border-[#22262E] rounded-md text-xs font-semibold text-white transition-all"
            >
                <div className="flex items-center gap-2 truncate">
                    <div className={`w-1.5 h-1.5 rounded-full ${selectedSession?.isTimerActive ? 'bg-[#10B981] animate-tally' : 'bg-[#6A7382]'}`} />
                    <span className="truncate">{selectedSession?.title || 'Select Channel'}</span>
                </div>
                <ChevronDown size={13} className={`text-[#8A93A4] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute left-3 right-3 top-full mt-1 bg-[#121418] border border-[#2D333F] rounded-md p-1 shadow-2xl z-50 animate-in fade-in duration-150">
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
    programId
}) => {
    const location = useLocation();

    const getLinkPath = (base: string) => {
        const idToUse = selectedLiveId || programId;
        if (!idToUse || idToUse.startsWith('local-')) return base;
        return `${base}?id=${idToUse}`;
    };

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: Edit3, label: 'Editor', path: getLinkPath('/editor') },
        { icon: Play, label: 'Live Control', path: getLinkPath('/live') },
        { icon: ClipboardList, label: 'Rundown List', path: getLinkPath('/list') },
        { icon: Monitor, label: 'Monitors & Displays', path: getLinkPath('/monitors') },
        { icon: Radio, label: 'Command Center', path: getLinkPath('/command') },
        { icon: Calendar, label: 'Calendar', path: '/calendar' },
        { icon: FileText, label: 'User Guide', path: '/guide' },
        { icon: Settings, label: 'Workspace', path: '/admin' },
    ];

    return (
        <aside
            className={`fixed left-0 top-0 h-full bg-[#090A0C] border-r border-[#22262E] transition-all duration-200 z-50 flex flex-col no-print hidden lg:flex font-sans ${isCollapsed ? 'w-16' : 'w-60'}`}
        >
            {/* Brand / Logo Header */}
            <div className="p-3.5 flex items-center justify-between border-b border-[#22262E]">
                {!isCollapsed && (
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded bg-[#181B22] border border-[#2D333F] flex items-center justify-center shrink-0">
                            {activeOrg?.logoUrl ? (
                                <img src={activeOrg.logoUrl} alt="Logo" className="w-full h-full object-contain p-0.5" />
                            ) : (
                                <Mic className="text-[#0EA5E9]" size={15} />
                            )}
                        </div>
                        <span className="font-mono font-bold text-sm tracking-wider text-white truncate uppercase">
                            {activeOrg?.name ? activeOrg.name : 'KAIRON'}
                        </span>
                    </div>
                )}
                {isCollapsed && (
                    <div className="w-7 h-7 mx-auto rounded bg-[#181B22] border border-[#2D333F] flex items-center justify-center">
                        {activeOrg?.logoUrl ? (
                            <img src={activeOrg.logoUrl} alt="Logo" className="w-full h-full object-contain p-0.5" />
                        ) : (
                            <Mic className="text-[#0EA5E9]" size={15} />
                        )}
                    </div>
                )}
                <button
                    onClick={() => onToggle(!isCollapsed)}
                    className="p-1 rounded hover:bg-[#181B22] text-[#6A7382] hover:text-white transition-colors hidden md:block"
                >
                    {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
                </button>
            </div>

            {/* Workspace Switcher */}
            <div className="p-3">
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

            {/* Navigation Items */}
            <nav className="flex-1 px-2 space-y-1 py-3 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.label}
                        to={item.path}
                        className={({ isActive }) => `
                            flex items-center gap-2.5 px-3 py-2 rounded-md transition-all group font-mono text-xs font-semibold
                            ${isActive
                                ? 'bg-[#181B22] text-white border border-[#2D333F]'
                                : 'text-[#8A93A4] hover:bg-[#121418] hover:text-white border border-transparent'
                            }
                        `}
                        title={isCollapsed ? item.label : undefined}
                    >
                        <item.icon
                            size={16}
                            className={`shrink-0 transition-colors ${
                                location.pathname === item.path.split('?')[0]
                                    ? 'text-[#0EA5E9]'
                                    : 'text-[#6A7382] group-hover:text-white'
                            }`}
                        />
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </NavLink>
                ))}
            </nav>

            {/* Footer Profile & Network Status */}
            <div className="p-3 border-t border-[#22262E] flex flex-col gap-2">
                <ProfileDropdown
                    profile={profile}
                    user={user}
                    onUpdate={onProfileUpdate}
                    onSignOut={handleSignOut}
                    isCollapsed={isCollapsed}
                />

                {!isCollapsed && (
                    <div className="flex items-center justify-between px-2 pt-1 text-[10px] font-mono text-[#6A7382]">
                        <span className="flex items-center gap-1.5">
                            {isOnline ? (
                                <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                                    <span>LIVE SYNC</span>
                                </>
                            ) : (
                                <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                                    <span>OFFLINE</span>
                                </>
                            )}
                        </span>
                        <span>v2.4</span>
                    </div>
                )}
            </div>
        </aside>
    );
};
