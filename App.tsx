import React, { Component, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { BrowserRouter, Routes, Route, NavLink, useNavigate, useLocation, useSearchParams, Navigate, useParams } from 'react-router-dom';
import { Mic, Edit3, Play, ClipboardList, Calendar as CalendarIcon, Home, Sun, Moon, Share2, Copy, Check, X, AlertTriangle, FileText, Download, User, User as UserIcon, AlignLeft, QrCode, Clipboard, Wifi, WifiOff, Sparkles, Zap, CheckCircle, MousePointerClick, UserPlus, ExternalLink, Tv, AppWindow, SkipBack, SkipForward, Pause, Clock, Monitor, Building, MessageSquare, Bell, Crown, Volume2, Lightbulb, Video, Plus, Minus, BarChart3, Power, Keyboard, PanelRight, Layers, GripHorizontal } from 'lucide-react';
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Services
import { ConvexAuthProvider, useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery as useConvexQuery, useMutation as useConvexMutation, getLocalPrograms } from "./hooks/useConvexMock";
import { api } from "./convex/_generated/api";
import { convex } from "./services/convexClient";
import { getPrograms, getProgramById, createProgram as createProgramService, updateProgram as updateProgramService, deleteProgram as deleteProgramService, updateTimerState as updateTimerStateService, transformProgram } from './services/programService';
import { getProfile } from './services/authService';
import { getMyOrganizations, checkPendingInvites, getInviteDetails } from './services/orgService';
import { rebalanceSchedule } from './services/geminiService';
import { getOfflineLedger, enqueueOfflineChange, clearOfflineLedger, cacheWorkspaceEntitlement, getCachedWorkspaceEntitlement } from './services/offlineSyncLedger';

// Store & Hooks
import { useUIStore } from './store/uiStore';
import { useStageMessages } from './hooks/useStageMessages';
import { useWakeLock } from './hooks/useWakeLock';
import { useFlightBridge } from './hooks/useFlightBridge';
import { useTimerSync } from './hooks/useTimerSync';
import { useScreenManagement } from './hooks/useScreenManagement';

// Components
import { FlightBridge } from './components/FlightBridge';
import { HoldToConfirmButton } from './components/HoldToConfirmButton';

// Components
import LiveTimer from './components/LiveTimer';
import ScheduleList from './components/ScheduleList';
import ProgramEditor from './components/ProgramEditor';
import CalendarView from './components/CalendarView';
import HomeDashboard from './components/HomeDashboard';
import PrintableSchedule from './components/PrintableSchedule';
const AnalyticsDashboard = React.lazy(() => import('./components/AnalyticsDashboard'));


import TVView from './components/TVView';
import { Auth } from './components/Auth';
import { OrganizationManager } from './components/OrganizationManager';
import StageDisplay from './components/StageDisplay';
import { ProfileDropdown } from './components/ProfileDropdown';
import { WorkspaceSwitcher } from './components/WorkspaceSwitcher';
import { AdminPanel } from './components/AdminPanel';
import { ExportDialog, ExportOptions } from './components/ExportDialog';
import { PublicPortal } from './components/PublicPortal';
import HomeWrapper from './components/wrappers/HomeWrapper';
import CalendarWrapper from './components/wrappers/CalendarWrapper';
import { Sidebar } from './components/Sidebar';
import { OnboardingOverlay } from './components/OnboardingOverlay';
import { UserGuide } from './components/UserGuide';
import { ProductionHUD } from './components/ProductionHUD';
import { InterlockModal } from './components/InterlockModal';
import TVWrapper from './components/wrappers/TVWrapper';
import StageWrapper from './components/wrappers/StageWrapper';
import PrompterWrapper from './components/wrappers/PrompterWrapper';
import { MonitorDashboard } from './components/MonitorDashboard';
import { CommandCenter } from './components/CommandCenter';
import { ConfirmationModal } from './components/ConfirmationModal';
import { CrewHUD } from './components/CrewHUD';
import FlightBridgeStandaloneView from './components/FlightBridgeStandaloneView';
import { MobileFlightBridge } from './components/MobileFlightBridge';
import { BroadcastHotkeysModal } from './components/BroadcastHotkeysModal';
import { StudioMenuBar } from './components/StudioMenuBar';
import { StudioRightDock } from './components/StudioRightDock';
import { StudioStatusBar } from './components/StudioStatusBar';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { BroadcastIntegrationsModal } from './components/BroadcastIntegrationsModal';
import { BroadcastOverlayView } from './components/BroadcastOverlayView';
import { DesktopAuthApproval } from './components/DesktopAuthApproval';

import { MobileNav } from './components/MobileNav';

// Utils & Types
import { Program, Slot, SlotType, Profile, Organization, TimerState } from './types';
import { timeToMinutes, minutesToTime, formatDuration } from './utils/time';
import { encodeProgramData, decodeProgramData } from './utils/encoding';
import { getInitialProgram } from './utils/constants';
import { saveKaironFileToDisk, parseKaironFile, autoArchiveToLocalWorkspace, downloadProgramCsv, parseCsvToSlots } from './utils/kaironFileFormat';
import { PRODUCTION_TEMPLATES } from './utils/rundownParser';

// --- Analytics Wrapper (Dedicated Component to avoid render loops) ---
const AnalyticsWrapper: React.FC<{ onUpdateSlot?: (slotId: string, updates: Partial<Slot>) => void }> = ({ onUpdateSlot }) => {
  const { id } = useParams<{ id: string }>();
  
  const rawData = useConvexQuery(
    api.programs.getProgramById,
    id ? { id } : "skip"
  );

  const reportProgram = useMemo(() => {
    if (!rawData) return null;
    return transformProgram(rawData);
  }, [rawData]);

  if (rawData === undefined) return <div className="flex h-screen items-center justify-center dark:bg-slate-950"><div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!reportProgram) return <div className="p-12 text-center text-slate-500">Report not found.</div>;

  return (
    <React.Suspense fallback={<div className="flex h-screen items-center justify-center dark:bg-slate-950"><div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>}>
      <AnalyticsDashboard program={reportProgram} onUpdateSlot={onUpdateSlot} />
    </React.Suspense>
  );
};

// --- Mobile Venue Dock (Pill Switcher) ---
// --- Venue Dock (Pill Switcher) ---
const VenueDock: React.FC<{
  activeSessions: Program[];
  selectedLiveId: string | null;
  onSelect: (id: string) => void;
}> = ({ activeSessions, selectedLiveId, onSelect }) => {
  if (activeSessions.length <= 1) return null;

  return (
    <div className="lg:hidden sticky top-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-3 py-0 min-h-[40px] flex items-center gap-2 transition-all">
      <div className="flex-1 overflow-x-auto no-scrollbar py-1">
        <div className="flex items-center gap-2 min-w-max px-1">
        {activeSessions.map((session) => (
          <button
            key={session.id}
            onClick={() => onSelect(session.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm border ${
              selectedLiveId === session.id
                ? 'bg-indigo-600 text-white border-indigo-500 ring-2 ring-indigo-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${session.isTimerActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
            {session.title}
          </button>
        ))}
        </div>
      </div>
    </div>
  );
};


const isProgramContentEqual = (p1: Program, p2: Program): boolean => {
  if (p1.title !== p2.title) return false;
  if ((p1.subtitle || "") !== (p2.subtitle || "")) return false;
  if (p1.date !== p2.date) return false;
  if (p1.startTime !== p2.startTime) return false;
  if ((p1.endTime || "") !== (p2.endTime || "")) return false;
  if (!!p1.isManualMode !== !!p2.isManualMode) return false;
  if (!!p1.isOnHold !== !!p2.isOnHold) return false;
  if ((p1.holdMessage || "") !== (p2.holdMessage || "")) return false;
  if ((p1.slug || "") !== (p2.slug || "")) return false;
  if (!!p1.isPublic !== !!p2.isPublic) return false;
  if ((p1.status || "draft") !== (p2.status || "draft")) return false;
  if ((p1.estimatedAttendees || 0) !== (p2.estimatedAttendees || 0)) return false;
  if ((p1.averageHourlyRate || 0) !== (p2.averageHourlyRate || 0)) return false;
  if (p1.slots.length !== p2.slots.length) return false;

  for (let i = 0; i < p1.slots.length; i++) {
    const s1 = p1.slots[i];
    const s2 = p2.slots[i];
    if (s1.id !== s2.id) return false;
    if (s1.title !== s2.title) return false;
    if ((s1.speaker || "") !== (s2.speaker || "")) return false;
    if (s1.durationMinutes !== s2.durationMinutes) return false;
    if ((s1.type || "") !== (s2.type || "")) return false;
    if ((s1.actualDuration || 0) !== (s2.actualDuration || 0)) return false;
    if ((s1.details || "") !== (s2.details || "")) return false;
    if ((s1.productionNotes || "") !== (s2.productionNotes || "")) return false;
    if ((s1.prompterText || "") !== (s2.prompterText || "")) return false;
  }
  return true;
};


const getProtectedMinimumDuration = (slot: Slot): number => {
  const type = (slot.type || '').toLowerCase();
  const title = (slot.title || '').toLowerCase();
  
  // Protect core Sermons, Word, Keynotes from excessive compression
  if (type === 'sermon' || type === 'keynote' || /sermon|the word|message|keynote/.test(title)) {
    return Math.max(15, Math.floor(slot.durationMinutes * 0.6));
  }
  // Protect worship from dropping below 5 min or 50%
  if (type === 'worship' || /worship|praise/.test(title)) {
    return Math.max(5, Math.floor(slot.durationMinutes * 0.5));
  }
  // Short items, announcements, offerings, breaks can shave down to 1 min minimum
  return 1;
};

const healScheduleOverruns = (program: Program, currentSlotIndex: number, overrunSeconds: number): any[] => {
  const remainingSlots = program.slots.slice(currentSlotIndex + 1);
  if (remainingSlots.length === 0) return program.slots;

  let secondsToAbsorb = overrunSeconds;
  const minutesToAbsorb = Math.ceil(secondsToAbsorb / 60);
  if (minutesToAbsorb <= 0) return program.slots;

  // Clone all slots
  const newSlots = program.slots.map(s => ({ ...s }));
  let absorbed = 0;

  // Step 1: Try to absorb from "flex/buffer" slots first
  const flexTypes = ['break', 'transition', 'announcements', 'buffer', 'offering'];
  const remainingFlexSlots = newSlots.slice(currentSlotIndex + 1).filter(s => 
    flexTypes.includes((s.type || '').toLowerCase()) ||
    /announcement|notice|offering|giving|break|transition|buffer/i.test(s.title || '')
  );

  for (let s of remainingFlexSlots) {
    if (absorbed >= minutesToAbsorb) break;
    const minFloor = getProtectedMinimumDuration(s);
    const maxShave = Math.max(0, s.durationMinutes - minFloor);
    const shave = Math.min(minutesToAbsorb - absorbed, maxShave);
    if (shave > 0) {
      s.durationMinutes = Math.max(minFloor, s.durationMinutes - shave);
      absorbed += shave;
    }
  }

  // Step 2: If we still need to absorb time, shave from other slots respecting protected floors
  if (absorbed < minutesToAbsorb) {
    const remainingOtherSlots = newSlots.slice(currentSlotIndex + 1).filter(s => 
      !flexTypes.includes((s.type || '').toLowerCase())
    );
    
    for (let s of remainingOtherSlots) {
      if (absorbed >= minutesToAbsorb) break;
      const minFloor = getProtectedMinimumDuration(s);
      const maxShave = Math.max(0, s.durationMinutes - minFloor);
      const shave = Math.min(minutesToAbsorb - absorbed, maxShave);
      if (shave > 0) {
        s.durationMinutes = Math.max(minFloor, s.durationMinutes - shave);
        absorbed += shave;
      }
    }
  }

  return newSlots;
};


export const DEFAULT_OFFLINE_ORG: Organization = {
  id: 'local-workspace',
  name: 'Winners Chapel Manchester',
  slug: 'winners-chapel-manchester',
  subscriptionStatus: 'enterprise',
  createdBy: 'local-booth-operator',
  createdAt: '2026-01-01T00:00:00.000Z',
};

// --- App Content Component ---
const AppContent: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState(searchParams.get('mode') || 'editor');
  const importData = searchParams.get('import');

  // URL Sanitization: Strip trailing slashes to prevent routing mismatch
  useEffect(() => {
    if (location.pathname.length > 1 && location.pathname.endsWith('/')) {
      const cleanPath = location.pathname.slice(0, -1);
      navigate(cleanPath + location.search + location.hash, { replace: true });
    }
  }, [location.pathname, location.search, location.hash, navigate]);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1280;
    }
    return false;
  });
  const [isRightDockCollapsed, setIsRightDockCollapsed] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isIntegrationsOpen, setIsIntegrationsOpen] = useState<boolean>(false);
  const [lastDiskArchiveAt, setLastDiskArchiveAt] = useState<string | null>(null);
  const [pendingOfflineCount, setPendingOfflineCount] = useState<number>(() => getOfflineLedger().length);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { screens, openOnTargetScreen } = useScreenManagement();
  const queryClient = useQueryClient();
  const recentlyToggledRef = React.useRef<boolean>(false);
  const lastAdvancedIndexRef = React.useRef<number>(-1);
  const lastProcessedIndexRef = React.useRef<number>(-1);
  const [displayStatuses, setDisplayStatuses] = useState<Record<string, { isFullscreen: boolean; isOnSecondary: boolean; timestamp: number; isDarkMode?: boolean }>>({});

  useEffect(() => {
    const channel = new BroadcastChannel('kairon_displays');
    
    const handleMessage = (event: MessageEvent) => {
      const { type, tabId, isFullscreen, isOnSecondary, isDarkMode } = event.data;
      if (type === 'heartbeat' && tabId) {
        setDisplayStatuses(prev => ({
          ...prev,
          [tabId]: { isFullscreen, isOnSecondary: !!isOnSecondary, timestamp: Date.now(), isDarkMode }
        }));
      }
    };
    
    channel.addEventListener('message', handleMessage);
    
    const interval = setInterval(() => {
      const now = Date.now();
      setDisplayStatuses(prev => {
        let changed = false;
        const next = { ...prev };
        for (const [key, value] of Object.entries(next)) {
          if (now - (value as any).timestamp > 3000) {
            delete next[key];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);
    
    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
      clearInterval(interval);
    };
  }, []);


  // Main State
  const [program, setProgram] = useState<Program>(() => {
    try {
      const isBooth = typeof window !== 'undefined' && (
        localStorage.getItem('kairon_booth_mode') === 'true' ||
        window.location.search.includes('testBypass=true') ||
        localStorage.getItem('testBypass') === 'true' ||
        Boolean((window as any).electron?.isElectron || (window as any).electronAPI?.isElectron)
      );
      if (isBooth) {
        const localList = getLocalPrograms();
        if (localList.length > 0) return localList[0];
      }
    } catch {}
    return getInitialProgram();
  });
  const [currentSlotIndex, setCurrentSlotIndex] = useState<number>(0);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [timerStartTimestamp, setTimerStartTimestamp] = useState<number | null>(null);

  // Stable Refs for Realtime Handlers
  const programRef = React.useRef(program);
  const timerStateRef = React.useRef({
    programId: program.id,
    isTimerActive,
    currentSlotIndex,
    secondsElapsed,
    timerStartTimestamp
  });

  useEffect(() => {
    programRef.current = program;
  }, [program]);

  useEffect(() => {
    timerStateRef.current = {
      programId: program.id,
      isTimerActive,
      currentSlotIndex,
      secondsElapsed,
      timerStartTimestamp
    };
  }, [program.id, isTimerActive, currentSlotIndex, secondsElapsed, timerStartTimestamp]);


  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  const updateLocalProgram = React.useCallback((newProg: Program | ((prev: Program) => Program)) => {
    setProgram(newProg);
    setSaveStatus('unsaved');
  }, []);

  // --- Auth & Org State ---
  // Use real Convex Auth hooks
  const { isAuthenticated, isLoading: isConvexAuthLoading } = useConvexAuth();
  const { pipWindow, isFloatingBridgeOpen, isSupported: isFlightBridgeSupported, openFlightBridge, closeFlightBridge } = useFlightBridge();

  // --- Draggable In-App Flight Bridge HUD Position ---
  const [hudPos, setHudPos] = useState<{ x: number; y: number } | null>(() => {
    try {
      if (typeof window === 'undefined') return null;
      const saved = localStorage.getItem('kairon_flight_bridge_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          const clampedX = Math.max(8, Math.min(window.innerWidth - 390, parsed.x));
          const clampedY = Math.max(8, Math.min(window.innerHeight - 80, parsed.y));
          return { x: clampedX, y: clampedY };
        }
      }
    } catch {}
    return null;
  });

  const [isDraggingHud, setIsDraggingHud] = useState(false);
  const hudDragRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number } | null>(null);

  // Resize listener to prevent HUD getting lost off-screen on window shrink
  useEffect(() => {
    const handleResize = () => {
      setHudPos(prev => {
        if (!prev) return null;
        const clampedX = Math.max(8, Math.min(window.innerWidth - 390, prev.x));
        const clampedY = Math.max(8, Math.min(window.innerHeight - 80, prev.y));
        if (clampedX === prev.x && clampedY === prev.y) return prev;
        return { x: clampedX, y: clampedY };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleHudPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;

    const currentX = hudPos?.x ?? Math.max(8, window.innerWidth - 410);
    const currentY = hudPos?.y ?? Math.max(8, window.innerHeight - 340);

    hudDragRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: currentX,
      startY: currentY,
    };
    setIsDraggingHud(true);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  }, [hudPos]);

  const handleHudPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingHud || !hudDragRef.current) return;
    const dx = e.clientX - hudDragRef.current.mouseX;
    const dy = e.clientY - hudDragRef.current.mouseY;
    const newX = Math.max(8, Math.min(window.innerWidth - 390, hudDragRef.current.startX + dx));
    const newY = Math.max(8, Math.min(window.innerHeight - 80, hudDragRef.current.startY + dy));
    setHudPos({ x: newX, y: newY });
  }, [isDraggingHud]);

  const handleHudPointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDraggingHud) return;
    setIsDraggingHud(false);
    hudDragRef.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    setHudPos(latest => {
      if (latest) {
        try {
          localStorage.setItem('kairon_flight_bridge_pos', JSON.stringify(latest));
        } catch {}
      }
      return latest;
    });
  }, [isDraggingHud]);

  const { signOut } = useAuthActions();
  const convexUser = useConvexQuery(
    api.authQueries.getCurrentUser,
    isAuthenticated ? {} : "skip"
  );

  const isElectronRuntime = typeof window !== 'undefined' && Boolean((window as any).electron?.isElectron || (window as any).electronAPI?.isElectron);

  // Check if running in offline Booth Mode or Test Bypass
  const [isBoothMode, setIsBoothMode] = useState<boolean>(() => {
    try {
      if (typeof window === 'undefined') return false;
      const isBooth = localStorage.getItem('kairon_booth_mode') === 'true';
      const isTestBypass = window.location.search.includes('testBypass=true') || localStorage.getItem('testBypass') === 'true';
      return isBooth || isTestBypass;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleBoothModeSync = () => {
      try {
        const isBooth = localStorage.getItem('kairon_booth_mode') === 'true';
        const isTestBypass = window.location.search.includes('testBypass=true') || localStorage.getItem('testBypass') === 'true';
        setIsBoothMode(isBooth || isTestBypass);
      } catch {}
    };
    window.addEventListener('kairon_booth_mode_changed', handleBoothModeSync);
    return () => window.removeEventListener('kairon_booth_mode_changed', handleBoothModeSync);
  }, []);

  // Derive a simple user object compatible with existing code
  const user = (isAuthenticated && convexUser)
    ? { id: convexUser.id as string, email: convexUser.email as string | undefined }
    : isBoothMode
    ? { id: 'local-booth-operator', email: 'booth@kairon.local' }
    : null;

  const [profile, setProfile] = useState<Profile | null>(() => {
    if (typeof window !== 'undefined' && (localStorage.getItem('kairon_booth_mode') === 'true' || window.location.search.includes('testBypass=true') || localStorage.getItem('testBypass') === 'true')) {
      return {
        id: 'local-booth-profile',
        userId: 'local-booth-operator',
        fullName: 'Booth Operator (Offline)',
        subscriptionStatus: 'enterprise',
      };
    }
    return null;
  });
  const [activeOrgId, setActiveOrgId] = useState<string | null>(() => {
    if (typeof window !== 'undefined' && (localStorage.getItem('kairon_booth_mode') === 'true' || window.location.search.includes('testBypass=true') || localStorage.getItem('testBypass') === 'true')) {
      return DEFAULT_OFFLINE_ORG.id;
    }
    return null;
  });
  const [activeOrg, setActiveOrg] = useState<Organization | null>(() => {
    if (typeof window !== 'undefined' && (localStorage.getItem('kairon_booth_mode') === 'true' || window.location.search.includes('testBypass=true') || localStorage.getItem('testBypass') === 'true')) {
      return DEFAULT_OFFLINE_ORG;
    }
    return null;
  });

  // Workspace Switch Isolation: Reset active program and timer state when switching workspaces
  const prevOrgIdRef = React.useRef<string | null>(activeOrgId);
  useEffect(() => {
    if (prevOrgIdRef.current !== null && prevOrgIdRef.current !== activeOrgId) {
      setProgram(getInitialProgram());
      setIsTimerActive(false);
      setTimerStartTimestamp(null);
      setSecondsElapsed(0);
      setCurrentSlotIndex(0);
      setSelectedLiveId(null);
      if (searchParams.has('id')) {
        const next = new URLSearchParams(searchParams);
        next.delete('id');
        setSearchParams(next, { replace: true });
      }
    }
    prevOrgIdRef.current = activeOrgId;
  }, [activeOrgId, searchParams, setSearchParams]);

  // --- Permissions & Membership ---
  // Fetch membership for current user in active org
  const myMembership = useConvexQuery(
    api.members.getMyMembershipInOrg,
    activeOrgId && isAuthenticated && !isBoothMode && !String(activeOrgId).startsWith('local-')
      ? { organizationId: activeOrgId as any }
      : "skip"
  );

  const userRole = myMembership?.role; // 'admin', 'manager', 'operator'

  // Permissions Logic (Auto-grant admin to org creator/owner, local test bypass, booth mode, or electron desktop runtime)
  const isOwner = !!(user?.id && (activeOrg?.createdBy === user?.id || String(activeOrg?.createdBy) === String(user?.id)));
  const isTestBypassMode = typeof window !== 'undefined' && (window.location.search.includes('testBypass=true') || localStorage.getItem('testBypass') === 'true');
  const isAdmin = userRole === 'admin' || isOwner || isTestBypassMode || isBoothMode;
  const isManager = userRole === 'manager';
  const isOperator = userRole === 'operator';
  const canManagePrograms = isAdmin || isManager || isBoothMode;

  // 1. URL-based overrides (purely aesthetic for Admins/Managers)
  const isUrlReadOnly = mode === 'viewer' || mode === 'ReadOnly';

  // 2. Auth Resolution (Wait for Convex to settle)
  const isAuthResolved = isBoothMode || (!isConvexAuthLoading && (!isAuthenticated || (isAuthenticated && myMembership !== undefined)));

  // 3. Permission Evaluation (POWER-BASED)
  // Admins and Managers are NEVER restricted by mode, unless they choose to be viewers.
  useEffect(() => {
    const rawHash = (location.hash || '').replace(/^#\/?/, '').split('?')[0].toLowerCase();
    const rawPath = (location.pathname || '').replace(/^\//, '').split('?')[0].toLowerCase();
    const token = rawHash || rawPath;
    if (!['stage', 'tv', 'prompter', 'overlay', 'crew'].includes(token)) {
      document.title = "Kairon - Production Timer";
    }
  }, [location.pathname, location.hash]);

  const isReadOnly = !isAuthResolved ? false : (
    program.status === 'archived' || (
      (isAdmin || isManager)
        ? (mode === 'viewer') 
        : true // Operators and Guests are read-only for structural edits
    )
  );

  const canControlLive = isAdmin || isManager || isOperator || isBoothMode;
  const isCoEditor = isAdmin || isManager || (mode === 'coeditor') || isBoothMode;

  const isReadOnlyRef = React.useRef(isReadOnly);
  useEffect(() => {
    isReadOnlyRef.current = isReadOnly;
  }, [isReadOnly]);

  const [isOnline, setIsOnline] = useState(window.navigator.onLine);

  // Cache Pro Workspace Entitlement for 14-day silent offline grace period
  useEffect(() => {
    if (activeOrg?.id && activeOrg.subscriptionStatus) {
      cacheWorkspaceEntitlement({
        orgId: activeOrg.id,
        orgName: activeOrg.name,
        subscriptionStatus: (activeOrg.subscriptionStatus === 'pro' || activeOrg.subscriptionStatus === 'enterprise') ? activeOrg.subscriptionStatus : 'free',
        role: userRole || 'admin',
      });
    }
  }, [activeOrg?.id, activeOrg?.name, activeOrg?.subscriptionStatus, userRole]);

  const cachedEntitlement = activeOrgId ? getCachedWorkspaceEntitlement(activeOrgId) : null;
  const isPro = activeOrg?.subscriptionStatus === 'pro' || activeOrg?.subscriptionStatus === 'enterprise' || (!isOnline && cachedEntitlement?.subscriptionStatus === 'pro') || isTestBypassMode || isBoothMode;
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [isDataHydrated, setIsDataHydrated] = useState(false);
  const [authRetryCount, setAuthRetryCount] = useState(0);

  const retryAuth = () => {
    setIsAuthLoading(true);
    setNetworkError(null);
    setAuthRetryCount(prev => prev + 1);
  };

  const defaultOfflineOrg: Organization = DEFAULT_OFFLINE_ORG;

  // Fetch all organizations for the user
  const { data: rawUserOrganizations = [], isLoading: loadingOrgs } = useQuery<Organization[]>({
    queryKey: ['myOrganizations', user?.id],
    queryFn: () => getMyOrganizations(user?.id || ''),
    enabled: !!user && !isBoothMode
  });

  const userOrganizations = useMemo(() => {
    if (isBoothMode) return [DEFAULT_OFFLINE_ORG];
    if (rawUserOrganizations.length > 0) return rawUserOrganizations;
    return [DEFAULT_OFFLINE_ORG];
  }, [isBoothMode, rawUserOrganizations]);

  // Auto-initialize profile and active org for offline booth mode
  useEffect(() => {
    if (isBoothMode) {
      if (!profile) {
        setProfile({
          id: 'local-booth-profile',
          userId: 'local-booth-operator',
          fullName: 'Booth Operator (Offline)',
          subscriptionStatus: 'enterprise',
        });
      }
      if (!activeOrg) {
        setActiveOrg(DEFAULT_OFFLINE_ORG);
        setActiveOrgId(DEFAULT_OFFLINE_ORG.id);
      }
    }
  }, [isBoothMode, profile, activeOrg]);

  // Invite ID handling for personalized banner
  const urlInviteId = searchParams.get('inviteId');
  const urlOrgId = searchParams.get('orgId'); // For generic links

  // Persist inviteId in sessionStorage to survive OAuth redirects
  useEffect(() => {
    if (urlInviteId) {
      sessionStorage.setItem('pendingInviteId', urlInviteId);
      if (urlOrgId) sessionStorage.setItem('pendingOrgId', urlOrgId);
    }
  }, [urlInviteId, urlOrgId]);

  const persistedInviteId = sessionStorage.getItem('pendingInviteId');
  const persistedOrgId = sessionStorage.getItem('pendingOrgId');
  const inviteId = urlInviteId || persistedInviteId;

  // Fetch invite details (if not generic)
  const { data: inviteDetails } = useQuery({
    queryKey: ['inviteDetails', inviteId],
    queryFn: () => getInviteDetails(inviteId!),
    enabled: !!inviteId && inviteId !== 'generic' && !user
  });

  // Handle generic invite details manually or via a separate query if needed
  // For now, if it's 'generic', we might just show a "Join Workspace" message
  // Or fetch org details if orgId is present
  const { data: genericOrgDetails } = useQuery({
    queryKey: ['orgDetails', urlOrgId || persistedOrgId],
    queryFn: () => import('./services/orgService').then(s => s.getOrganizationById((urlOrgId || persistedOrgId)!)),
    enabled: inviteId === 'generic' && !!(urlOrgId || persistedOrgId) && !user
  });

  const effectiveInviteDetails = inviteId === 'generic' ? {
    organizationName: genericOrgDetails?.name || "Kairon Workspace",
    role: 'member',
    isGeneric: true
  } : inviteDetails;

  // Keep activeOrg in sync with activeOrgId
  useEffect(() => {
    if (activeOrgId) {
      const found = userOrganizations.find(o => o.id === activeOrgId);
      if (found) setActiveOrg(found);
    } else if (userOrganizations.length > 0) {
      // Default to first org if none selected
      setActiveOrgId(userOrganizations[0].id);
      setActiveOrg(userOrganizations[0]);
    }
  }, [activeOrgId, userOrganizations]);

  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const authLoadingRef = React.useRef(true);

  // Keep ref in sync for timeout closure
  useEffect(() => {
    authLoadingRef.current = isAuthLoading;
  }, [isAuthLoading]);

  // Auth is considered loading while Convex Auth is loading
  const effectiveAuthLoading = isConvexAuthLoading;

  const [isOnboardingManual, setIsOnboardingManual] = useState(false);
  const [isAutopilotEnabled, setIsAutopilotEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('kairon_autopilot_enabled') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleAutopilot = (enabled?: boolean | unknown) => {
    setIsAutopilotEnabled(prev => {
      const next = typeof enabled === 'boolean' ? enabled : !prev;
      try {
        localStorage.setItem('kairon_autopilot_enabled', String(next));
      } catch (err) {
        console.error(err);
      }
      return next;
    });
  };

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      setNetworkError(null);
      // Flush Offline Sync Ledger using Last-Write-Wins
      const ledger = getOfflineLedger();
      if (ledger.length > 0) {
        try {
          for (const entry of ledger) {
            if (entry.program.id?.startsWith('local-')) {
              await createProgramService(entry.program);
            } else {
              await updateProgramService(entry.program);
            }
          }
          clearOfflineLedger();
          setPendingOfflineCount(0);
          queryClient.invalidateQueries({ queryKey: ['programs'] });
        } catch (err) {
          console.warn('Partial offline ledger flush:', err);
        }
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
      // Local-First Relay Mode: NEVER block the operator with a modal when internet drops mid-service
      setNetworkError(null);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (!window.navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [queryClient]);

  // Handle Auth Session - now driven by Convex Auth state
  useEffect(() => {
    const setupAuth = async () => {
      // Only run setup if we have a user and authentication is fully resolved
      if (user?.id && isAuthenticated && !isConvexAuthLoading) {
        try {
          const p = await getProfile(user.id);
          setProfile(p);

          // Check for shadow invites and handle auto-join
          try {
            console.log("Checking for pending invites for user:", user.email);
            const joinedOrgs = await checkPendingInvites({
              inviteId: inviteId || undefined,
              orgId: (urlOrgId || persistedOrgId) || undefined,
            });
            if (joinedOrgs && joinedOrgs.length > 0) {
              console.log("Successfully joined organizations via shadow invites:", joinedOrgs);
              // Invalidate organizations query to show new orgs
              queryClient.invalidateQueries({ queryKey: ['myOrganizations', user.id] });
              // Clear pending invite from session
              sessionStorage.removeItem('pendingInviteId');
              sessionStorage.removeItem('pendingOrgId');
            }
          } catch (err) {
            console.error("Shadow invite check failed:", err);
          }
        } catch (err) {
          console.error("Profile fetch failed:", err);
        }
      } else if (!user?.id && !isConvexAuthLoading) {
        setProfile(null);
      }
    };
    setupAuth();
  }, [user?.id, isAuthenticated, isConvexAuthLoading, checkPendingInvites, queryClient, inviteId, urlOrgId, persistedOrgId]);


  const loadProfile = async (userId: string) => {
    const p = await getProfile(userId);
    setProfile(p);
  };

  useWakeLock(isTimerActive);

  const { clearStageMessage } = useStageMessages(program.id);

  const handleSignOut = async () => {
    try {
      localStorage.removeItem('kairon_booth_mode');
      setIsBoothMode(false);
      window.dispatchEvent(new Event('kairon_booth_mode_changed'));
    } catch {}
    await signOut();
    setProfile(null);
    setActiveOrgId(null);
    setActiveOrg(null);
  };

  const [isAdminOnline, setIsAdminOnline] = useState(true);
  const [isInterlockOpen, setIsInterlockOpen] = useState(false);
  const [interlockTargetProgram, setInterlockTargetProgram] = useState<Program | null>(null);
  const lastAdvanceTimeRef = React.useRef<number>(0);
  const lastCorrectedIdRef = React.useRef<string | null>(null);
  const currentTickingSecondsRef = React.useRef<number>(0);
  const lastSavedProgramRef = React.useRef<Program | null>(null);

  // --- Reactive Global Live Channels (Multi-Track) ---
  const [selectedLiveId, setSelectedLiveId] = useState<string | null>(null);
  
  const isTestMode = typeof window !== 'undefined' && (
    window.location.search.includes('testBypass=true') ||
    localStorage.getItem('testBypass') === 'true'
  );

  const isConvexOrgId = Boolean(
    activeOrgId &&
    !isBoothMode &&
    !String(activeOrgId).startsWith('local-') &&
    !String(activeOrgId).startsWith('test-') &&
    String(activeOrgId).length >= 19
  );

  const activeSessionsRaw = useConvexQuery(
    api.programs.getActiveSessions, 
    (isConvexOrgId || isTestMode) ? { organizationId: (activeOrgId || 'test-org-id') as any } : "skip"
  );

  const activeSessions = useMemo(() => {
    if (isBoothMode) {
      const localList = getLocalPrograms();
      const currentLive = program.status === 'live' ? [program] : [];
      const cleanProgramId = (program.id || '').replace(/^local-/, '');
      const otherLive = localList.filter((p: any) => 
        p.status === 'live' && 
        p.id !== program.id && 
        p.id?.replace(/^local-/, '') !== cleanProgramId
      );
      return [...currentLive, ...otherLive];
    }
    if (!activeSessionsRaw) return [];
    return activeSessionsRaw.map(s => ({
      ...s,
      // CRITICAL: Force string normalization for ID comparisons (prevents object-vs-string mismatch)
      id: String(s._id || s.id),
      slug: String((s as any).slug || (s as any).uuid || s._id || s.id).replace(/^local-/, ''),
      isPublic: (s as any).isPublic ?? true,
    })) as Program[];
  }, [activeSessionsRaw, isBoothMode, program]);

  const allProgramsRaw = useConvexQuery(
    api.programs.getPrograms,
    (isConvexOrgId || isTestMode) ? { organizationId: (activeOrgId || 'test-org-id') as any } : "skip"
  );

  const programs = useMemo(() => {
    if (isBoothMode) {
      const localList = getLocalPrograms();
      const cleanProgramId = (program.id || '').replace(/^local-/, '');
      const existingIdx = localList.findIndex((p: any) => 
        p.id === program.id || 
        p.id?.replace(/^local-/, '') === cleanProgramId
      );
      if (existingIdx >= 0) {
        localList[existingIdx] = program;
        return localList;
      }
      return [program, ...localList.filter((p: any) => 
        p.id !== program.id && 
        p.id?.replace(/^local-/, '') !== cleanProgramId
      )];
    }
    if (!allProgramsRaw) return [];
    return allProgramsRaw.map(s => ({
      ...s,
      id: String(s._id || s.id),
      slug: String((s as any).slug || (s as any).uuid || s._id || s.id).replace(/^local-/, ''),
      isPublic: (s as any).isPublic ?? true,
    })) as Program[];
  }, [allProgramsRaw, isBoothMode, program]);

  // Auto-selection & Cleanup logic
  useEffect(() => {
    if (activeSessions.length === 1) {
      // Auto-select if only one is live
      setSelectedLiveId(activeSessions[0].id);
    } else if (activeSessions.length === 0) {
      // Clear if none are live
      setSelectedLiveId(null);
    } else if (selectedLiveId && !activeSessions.some(s => String(s.id) === String(selectedLiveId))) {
      // Clear if our selected session ended - using ID-safe comparison
      setSelectedLiveId(activeSessions[0]?.id || null);
    }
  }, [activeSessions, selectedLiveId]);

  const globalLiveProgram = useMemo(() => {
    if (!selectedLiveId) return null;
    return activeSessions.find(s => s.id === selectedLiveId) || null;
  }, [activeSessions, selectedLiveId]);

  // Alert/Confirm Modal State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
    type: 'warning'
  });



  // useStageMessages Hook (Consolidated logic)
  const { promptMessage, sendStageMessage } = useStageMessages(program.id);
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const handleSendMessage = (text: string) => {
    sendStageMessage(text);
    setIsPromptOpen(false);
    setMessageInput('');
  };

  // Export State
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({ 
    includeDetails: true, 
    includeSpeakers: true,
    includePrompter: false 
  });


  // ---------------------------------------------------------
  // THE BRAIN: Centralized Synchronization Logic
  // Decides if we show the "Global Live" event or the "Local Draft" event.
  // ---------------------------------------------------------
  const isLiveEventActive = !!globalLiveProgram;
  const isTargetSameAsLocal = isLiveEventActive && (
    String(globalLiveProgram?.id) === String(program.id) ||
    String(globalLiveProgram?.id).replace(/^local-/, '') === String(program.id).replace(/^local-/, '')
  );
  const isUntouchedPlaceholder = program.id?.startsWith('local-') && program.slots.length === 0 && program.title === 'New Event' && !program.subtitle;
  const fallbackWorkspaceProgram = (!isLiveEventActive && isUntouchedPlaceholder && programs.length > 0) ? programs[0] : null;

  const displayIsManualMode = isLiveEventActive
    ? (isTargetSameAsLocal ? Boolean(program.isManualMode ?? globalLiveProgram?.isManualMode) : Boolean(globalLiveProgram?.isManualMode))
    : Boolean(program.isManualMode);

  const displayProgram = useMemo(() => {
    const base = isLiveEventActive 
      ? (isTargetSameAsLocal ? { ...globalLiveProgram!, ...program, slots: program.slots } : globalLiveProgram!) 
      : (fallbackWorkspaceProgram || program);
    return {
      ...base,
      isManualMode: isTargetSameAsLocal ? (program.isManualMode ?? base.isManualMode ?? false) : (base.isManualMode ?? false),
    };
  }, [isLiveEventActive, isTargetSameAsLocal, globalLiveProgram, program, fallbackWorkspaceProgram]);
  const displayCurrentSlotIndex = isLiveEventActive 
    ? (isTargetSameAsLocal ? currentSlotIndex : (globalLiveProgram?.currentSlotIndex ?? 0)) 
    : currentSlotIndex;
  
  const displayIsTimerActive = isLiveEventActive 
    ? (isTargetSameAsLocal ? isTimerActive : (globalLiveProgram?.isTimerActive ?? false)) 
    : isTimerActive;

  const displayTimerStartTimestamp = isLiveEventActive 
    ? (isTargetSameAsLocal ? timerStartTimestamp : (globalLiveProgram?.timerStartTimestamp ?? null)) 
    : timerStartTimestamp;

  const displaySecondsElapsed = isLiveEventActive 
    ? (displayIsTimerActive 
        ? Math.floor((Date.now() - (displayTimerStartTimestamp ?? Date.now())) / 1000) 
        // OPTIMISTIC FIX: Prioritize local 'secondsElapsed' if it's the same program to avoid "Pause Resets"
        : (isTargetSameAsLocal ? secondsElapsed : (globalLiveProgram?.secondsElapsed ?? 0)))
    : (isTimerActive && timerStartTimestamp 
        ? Math.floor((Date.now() - timerStartTimestamp) / 1000) 
        : secondsElapsed);

  // Keep localStorage caches synchronized for instant preview, iframe thumbnails, and offline fallback
  useEffect(() => {
    try {
      if (program) {
        const serializedProg = JSON.stringify(program);
        localStorage.setItem('kairon_program', serializedProg);
        if (program.id) {
          localStorage.setItem(`kairon_offline_cache_${program.id}`, serializedProg);
          localStorage.setItem(`kairon_offline_cache_${program.id.replace(/^local-/, '')}`, serializedProg);
        }
        if (program.slug) {
          localStorage.setItem(`kairon_offline_cache_${program.slug.replace(/^local-/, '')}`, serializedProg);
        }
      }
      if (displayProgram) {
        const liveDisplay = {
          ...displayProgram,
          currentSlotIndex: displayCurrentSlotIndex,
          isTimerActive: displayIsTimerActive,
          timerStartTimestamp: displayTimerStartTimestamp,
          secondsElapsed: displaySecondsElapsed,
          status: (displayIsTimerActive || displayProgram.status === 'live') ? 'live' : displayProgram.status,
        };
        const serializedDisplay = JSON.stringify(liveDisplay);
        localStorage.setItem('kairon_offline_cache_live', serializedDisplay);
        if (displayProgram.id) {
          localStorage.setItem(`kairon_offline_cache_${displayProgram.id}`, serializedDisplay);
          localStorage.setItem(`kairon_offline_cache_${displayProgram.id.replace(/^local-/, '')}`, serializedDisplay);
          localStorage.setItem(`kairon_offline_cache_${displayProgram.id}_prompter`, serializedDisplay);
        }
        if (displayProgram.slug) {
          localStorage.setItem(`kairon_offline_cache_${displayProgram.slug.replace(/^local-/, '')}`, serializedDisplay);
        }
      }
    } catch (err) {
      console.warn('Could not sync offline cache in localStorage:', err);
    }
  }, [program, displayProgram, displayCurrentSlotIndex, displayIsTimerActive, displayTimerStartTimestamp, displaySecondsElapsed]);


  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleAiRebalance = async (currentProgram: Program) => {
    if (!isPro) {
      setConfirmDialog({
        isOpen: true,
        title: '👑 Pro Feature',
        message: 'AI Rebalancing is a premium feature. Upgrade your workspace to unlock intelligent schedule optimization.',
        type: 'info',
        onConfirm: () => {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      });
      return;
    }
    setIsAiLoading(true);
    try {
      // Calculate how far off we are
      const totalPlanned = currentProgram.slots.reduce((acc, s) => acc + s.durationMinutes, 0);
      const suggestion = await rebalanceSchedule(currentProgram, totalPlanned);
      setAiSuggestion(suggestion);
    } catch (err) {
      console.error("AI Rebalance failed:", err);
    } finally {
      setIsAiLoading(false);
    }
  };


  // Theme State
  // Theme State (Zustand)
  const isDarkMode = useUIStore((state) => state.isDarkMode);
  const toggleTheme = useUIStore((state) => state.toggleTheme);
  // We use the effect inside the store or just here just to apply classes if store doesn't handle side effects 
  // (Our store handles side effects, so we just read value)

  // Actually, I put the side-effect logic in the setter actions in the store.
  // But initial load side effect needs to happen somewhere if not in store init.
  // My store init used localStorage, but didn't apply class.
  // Let's keep a simple effect to sync class on mount/change to be safe, or trust store.
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [isDarkMode]);

  // Hydrate from URL Import or ID
  const urlId = searchParams.get('id');

  // Fetch program if ID is present (Reactive Convex Query)
  const fetchedProgramRaw = useConvexQuery(
    api.programs.getProgramById,
    urlId ? { id: urlId as any } : "skip"
  );
  const fetchedProgram = useMemo(() => {
    if (!fetchedProgramRaw) return undefined;
    return {
      ...(fetchedProgramRaw as any),
      id: String((fetchedProgramRaw as any)._id || (fetchedProgramRaw as any).id),
      slug: String((fetchedProgramRaw as any).slug || (fetchedProgramRaw as any).uuid || (fetchedProgramRaw as any)._id || (fetchedProgramRaw as any).id).replace(/^local-/, ''),
      isPublic: (fetchedProgramRaw as any).isPublic ?? true,
    } as Program;
  }, [fetchedProgramRaw]);

  // 1. Initial Program Loading & URL Sync
  useEffect(() => {
    // If we have an ID in the URL, fetch that specific program
    // Fallback: Check if urlId is actually the string "undefined" which can happen on bad redirects
    if (urlId && urlId !== 'undefined') {
      // The fetchedProgram is reactive, so this useEffect will trigger when it's available
      // The actual fetching is handled by useConvexQuery above.
    }

    // Load state from URL if present (e.g., for sharing encoded data)
    const data = searchParams.get('data');
    if (data) {
      const decoded = decodeProgramData(data);
      if (decoded) {
        setProgram(decoded);
        setMode('ReadOnly');
      }
    }
  }, [searchParams]);

  // Persistence: Save to URL when in ReadOnly mode (Optional, for easy sharing)
  useEffect(() => {
    if (mode === 'ReadOnly' && program.id) {
      const encoded = encodeProgramData(program);
      setSearchParams({ data: encoded, id: program.id, mode: 'ReadOnly' }, { replace: true });
    }
  }, [program, mode]);

  // If program has an orgId but activeOrgId is null, sync them
  useEffect(() => {
    if (program.organizationId && !activeOrgId) {
      setActiveOrgId(program.organizationId);
    }
  }, [program.organizationId]);

  useEffect(() => {
    const hydrate = async () => {
      // 1. Try DB Hydration (Reactive)
      if (fetchedProgram) {
        // Guard: Ensure we only hydrate if the fetched program matches the currently requested URL ID
        const urlIdClean = urlId?.replace('local-', '');
        const fetchedIdClean = fetchedProgram.id?.replace('local-', '');
        const fetchedUuidClean = (fetchedProgram as any).uuid?.replace('local-', '');
        const fetchedSlugClean = fetchedProgram.slug?.replace('local-', '');
        
        if (urlId) {
          const matchesUrl = fetchedProgram.id === urlId || 
            fetchedProgram.slug === urlId ||
            (urlIdClean && (fetchedUuidClean === urlIdClean || fetchedSlugClean === urlIdClean || fetchedProgram.slug === urlIdClean));
          if (!matchesUrl) {
            return;
          }
        }

        const currentProg = programRef.current;
        const isSameProgram = fetchedProgram.id === currentProg.id || 
          (currentProg.id?.startsWith('local-') && 
            ((fetchedProgram as any).uuid === currentProg.id.replace('local-', '') || 
             fetchedProgram.slug === currentProg.id.replace('local-', '')));

        const isNewProgram = !isSameProgram;
        const isTransitioning = Date.now() - lastAdvanceTimeRef.current < 10000;

        if (isNewProgram) {
          console.log("Hydrating program from ID:", fetchedProgram.title);
          lastSavedProgramRef.current = fetchedProgram;
          setProgram(fetchedProgram);
        } else if (currentProg.id?.startsWith('local-') && fetchedProgram.id !== currentProg.id && !fetchedProgram.id.startsWith('local-')) {
          console.log("Syncing local ID to Convex ID from fetched program:", fetchedProgram.id);
          if (lastSavedProgramRef.current) {
            lastSavedProgramRef.current = {
              ...lastSavedProgramRef.current,
              id: fetchedProgram.id,
              slug: fetchedProgram.slug || lastSavedProgramRef.current.slug,
              isPublic: fetchedProgram.isPublic ?? lastSavedProgramRef.current.isPublic ?? true,
            };
          }
          setProgram(prev => ({
            ...prev,
            id: fetchedProgram.id,
            slug: fetchedProgram.slug || prev.slug,
            isPublic: fetchedProgram.isPublic ?? prev.isPublic ?? true,
          }));
          setSearchParams(prev => {
            prev.set('id', fetchedProgram.id);
            return prev;
          }, { replace: true });
        } else if (saveStatus === 'saved' && !isProgramContentEqual(currentProg, fetchedProgram)) {
          console.log("Syncing program content updates from database:", fetchedProgram.title);
          lastSavedProgramRef.current = fetchedProgram;
          setProgram(fetchedProgram);
        }

        // Always sync timer state from DB unless we just performed a local action (Optimistic Consistency)
        if (fetchedProgram.isTimerActive !== undefined && !isTransitioning) {
          const isLive = fetchedProgram.status === 'live';

          const isTestBypassMode = typeof window !== 'undefined' && (window.location.search.includes('testBypass=true') || localStorage.getItem('testBypass') === 'true');
          const isStale = !isTestBypassMode && isLive && fetchedProgram.timerStartTimestamp && (Date.now() - fetchedProgram.timerStartTimestamp > 4 * 60 * 60 * 1000);

          const targetIsActive = (isLive && !isStale) ? (fetchedProgram.isTimerActive ?? false) : false;
          const targetStartTs = (isLive && !isStale) ? (fetchedProgram.timerStartTimestamp ?? null) : null;
          const targetSlotIndex = fetchedProgram.currentSlotIndex ?? 0;

          // AUTO-CORRECTION: If DB has "dirty" or "stale" timer data, fix it permanently on the server
          const needsCorrection = (!isLive && (fetchedProgram.isTimerActive || (fetchedProgram.timerStartTimestamp !== null && fetchedProgram.timerStartTimestamp !== undefined))) || isStale;

          if (needsCorrection) {
            // Guard: Only correct this specific ID once per session to prevent infinite render loops (React Error #185)
            if (lastCorrectedIdRef.current !== fetchedProgram.id) {
              console.warn("Dirty/Stale Data Detected: Auto-correcting timer state in DB for:", fetchedProgram.title, isStale ? "(Stale Live Timer)" : "(Non-Live Timer)");
              lastCorrectedIdRef.current = fetchedProgram.id;
              timerSaveMutation.mutate({
                id: fetchedProgram.id,
                currentSlotIndex: 0, // Reset to beginning if stale
                isTimerActive: false,
                secondsElapsed: 0,
                timerStartTimestamp: null,
                status: isStale ? 'draft' : fetchedProgram.status // Demote stale live to draft
              });
            }
          }

          // Apply to local state
          // Option C: Only restore slot index from DB when the program is actively live.
          // For draft/concluded programs, always start at slot 0 so opening a previously-run
          // program in the editor doesn't jump to a stale mid-service slot.
          const shouldRestoreSlotIndex = fetchedProgram.status === 'live';
          if (shouldRestoreSlotIndex && targetSlotIndex !== currentSlotIndex) {
            setCurrentSlotIndex(targetSlotIndex);
          } else if (!shouldRestoreSlotIndex) {
            setCurrentSlotIndex(0);
          }
          if (targetIsActive !== isTimerActive) {
            setIsTimerActive(targetIsActive);
          }
          if (targetStartTs !== timerStartTimestamp) {
            setTimerStartTimestamp(targetStartTs);
          }

          const targetElapsed = targetIsActive && targetStartTs
            ? Math.floor((Date.now() - targetStartTs) / 1000)
            : (fetchedProgram.secondsElapsed ?? 0);

          if (Math.abs(targetElapsed - secondsElapsed) > 2) {
            setSecondsElapsed(targetElapsed);
          }
        }
        if (isNewProgram) return;
      }

      // 2. Try URL Import Hydration
      if (importData) {
        const importedProgram = decodeProgramData(importData);
        if (importedProgram && importedProgram.id !== programRef.current.id) {
          console.log("Hydrating program from URL Data:", importedProgram.title);
          setProgram(importedProgram);
        }
        return;
      }

      // 3. Offline Deep Recovery Fallback
      if (!fetchedProgram && !importData) {
        try {
          const currentUrlId = searchParams.get('id');
          let offlineProgram: Program | null = null;

          if (currentUrlId) {
            const cleanUrlId = currentUrlId.replace('local-', '');
            const candidateKeys = [
              `kairon_offline_cache_${currentUrlId}`,
              `kairon_offline_cache_${cleanUrlId}`,
              `kairon_offline_cache_local-${cleanUrlId}`,
            ];
            for (const key of candidateKeys) {
              const raw = localStorage.getItem(key);
              if (raw) {
                try {
                  const parsed = JSON.parse(raw);
                  if (parsed && (parsed.id === currentUrlId || parsed.id === cleanUrlId || parsed.id === `local-${cleanUrlId}` || parsed.slug === currentUrlId || parsed.slug === cleanUrlId)) {
                    offlineProgram = parsed;
                    break;
                  }
                } catch {}
              }
            }

            if (!offlineProgram) {
              const rawPrograms = localStorage.getItem('kairon_offline_programs') || localStorage.getItem('test_programs');
              if (rawPrograms) {
                try {
                  const list = JSON.parse(rawPrograms);
                  if (Array.isArray(list)) {
                    offlineProgram = list.find((p: any) => p.id === currentUrlId || p.id === cleanUrlId || p.id === `local-${cleanUrlId}` || p.slug === currentUrlId || p.slug === cleanUrlId) || null;
                  }
                } catch {}
              }
            }
          } else if (typeof window !== 'undefined' && !window.navigator.onLine) {
            // Only fall back to generic live cache when WAN is genuinely offline and no specific ID was requested
            const rawLive = localStorage.getItem('kairon_offline_cache_live');
            if (rawLive) {
              try { offlineProgram = JSON.parse(rawLive); } catch {}
            }
          }

          if (offlineProgram && offlineProgram.id && offlineProgram.id !== programRef.current.id) {
            console.log("Restoring program from Offline Deep Recovery:", offlineProgram.title);
            lastSavedProgramRef.current = offlineProgram;
            setProgram(offlineProgram);

            const isLive = offlineProgram.status === 'live';
            if (isLive) {
              if (offlineProgram.currentSlotIndex !== undefined) {
                setCurrentSlotIndex(offlineProgram.currentSlotIndex);
              }
              if (offlineProgram.isTimerActive !== undefined) {
                setIsTimerActive(Boolean(offlineProgram.isTimerActive));
              }
              if (offlineProgram.timerStartTimestamp) {
                setTimerStartTimestamp(offlineProgram.timerStartTimestamp);
                const elapsed = Math.floor((Date.now() - offlineProgram.timerStartTimestamp) / 1000);
                if (elapsed >= 0) setSecondsElapsed(elapsed);
              }
            }
          }
        } catch (err) {
          console.warn("Offline deep recovery fallback error:", err);
        }
      }
    };

    hydrate();
  }, [importData, fetchedProgram, searchParams, saveStatus]);

  // Persistence (Convex + Local-First Offline Ledger + Electron Auto-Archive)
  const mutation = useMutation({
    mutationFn: async (p: Program): Promise<Program | void> => {
      // Broadcast local offline state sync across tabs immediately
      try {
        const channel = new BroadcastChannel('kairon_offline_sync');
        const isLiveNow = (p.id === displayProgram.id && displayIsTimerActive) || (p.id === program.id && isTimerActive) || p.status === 'live';
        const liveSnapshot: Program = {
          ...p,
          isTimerActive: isLiveNow ? (p.id === displayProgram.id ? displayIsTimerActive : isTimerActive) : p.isTimerActive,
          timerStartTimestamp: isLiveNow ? (p.id === displayProgram.id ? displayTimerStartTimestamp : timerStartTimestamp) : p.timerStartTimestamp,
          currentSlotIndex: p.id === displayProgram.id ? displayCurrentSlotIndex : (p.currentSlotIndex ?? currentSlotIndex),
          status: isLiveNow ? 'live' : p.status,
        };
        channel.postMessage({
          id: p.id,
          program: liveSnapshot
        });
        channel.close();

        // Also relay to Electron BrowserWindow instances across process boundaries
        const electronApi = (window as any).electron || (window as any).electronAPI;
        if (electronApi?.sendTimerState) {
          electronApi.sendTimerState({
            id: p.id,
            program: liveSnapshot,
            isTimerActive: liveSnapshot.isTimerActive,
            timerStartTimestamp: liveSnapshot.timerStartTimestamp,
            currentSlotIndex: liveSnapshot.currentSlotIndex,
            status: liveSnapshot.status,
          });
        }

        // Persist local offline recovery snapshot
        try {
          localStorage.setItem(`kairon_offline_cache_${p.id}`, JSON.stringify(liveSnapshot));
          if (p.id?.startsWith('local-')) {
            localStorage.setItem(`kairon_offline_cache_${p.id.replace('local-', '')}`, JSON.stringify(liveSnapshot));
          }
          if (isLiveNow) {
            localStorage.setItem('kairon_offline_cache_live', JSON.stringify(liveSnapshot));
          }
        } catch (storageErr) {
          console.warn("Failed to update local offline cache snapshot:", storageErr);
        }
      } catch (err) {
        console.error("Local BroadcastChannel / IPC sync failed:", err);
      }

      // Silently auto-archive to local Electron disk workspace if available
      void autoArchiveToLocalWorkspace(p, activeOrg?.name).then((savedPath) => {
        if (savedPath) {
          setLastDiskArchiveAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
      });

      if (typeof window !== 'undefined' && !window.navigator.onLine) {
        enqueueOfflineChange({
          programId: p.id,
          lastEdited: Date.now(),
          action: 'save_program',
          program: p,
        });
        setPendingOfflineCount(getOfflineLedger().length);
        return p;
      }

      try {
        // Only attempt creation if it's a local-prefixed ID
        if (p.id?.startsWith('local-')) {
          return await createProgramService(p);
        }

        // Otherwise, it's already a Convex program, just update it
        return await updateProgramService(p);
      } catch (err) {
        enqueueOfflineChange({
          programId: p.id,
          lastEdited: Date.now(),
          action: 'save_program',
          program: p,
        });
        setPendingOfflineCount(getOfflineLedger().length);
        throw err;
      }
    }
  });

  const timerSaveMutation = useMutation({
    mutationFn: (state: {
      id: string; // EXPLICIT ID REQUIRED
      currentSlotIndex: number;
      isTimerActive: boolean;
      secondsElapsed: number;
      timerStartTimestamp: number | null;
      isOnHold?: boolean;
      holdMessage?: string;
      isManualMode?: boolean;
      status?: 'draft' | 'live' | 'concluded' | 'archived';
    }) => {
      const { id, ...timerState } = state;

      // Broadcast local offline state sync across tabs immediately
      try {
        const channel = new BroadcastChannel('kairon_offline_sync');
        channel.postMessage({
          id,
          ...timerState
        });
        channel.close();
      } catch (err) {
        console.error("Local BroadcastChannel sync failed:", err);
      }

      // Electron IPC relay: fan out to ALL open BrowserWindows (Stage, TV, Prompter etc.)
      // BroadcastChannel does NOT cross Electron process boundaries — this IPC call does.
      try {
        const electronApi = (window as any).electron || (window as any).electronAPI;
        if (electronApi?.sendTimerState) {
          electronApi.sendTimerState({ id, ...timerState });
        }
      } catch (err) {
        console.error("Electron timer-state relay failed:", err);
      }

      // Keep offline cache synchronized with timer mutations
      try {
        const cleanId = id.replace(/^local-/, '');
        const cachedRaw = localStorage.getItem(`kairon_offline_cache_${id}`) ||
                          localStorage.getItem(`kairon_offline_cache_${cleanId}`) ||
                          localStorage.getItem('kairon_offline_cache_live') ||
                          localStorage.getItem('kairon_program');
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          const updated = { ...cached, ...timerState, id };
          const serialized = JSON.stringify(updated);
          localStorage.setItem(`kairon_offline_cache_${id}`, serialized);
          localStorage.setItem(`kairon_offline_cache_${cleanId}`, serialized);
          localStorage.setItem('kairon_offline_cache_live', serialized);

          // Broadcast full updated program payload across renderer and Electron secondary displays
          try {
            const chan = new BroadcastChannel('kairon_offline_sync');
            chan.postMessage({ id, program: updated, ...timerState });
            chan.close();
            const electronApi = (window as any).electron || (window as any).electronAPI;
            if (electronApi?.sendTimerState) {
              electronApi.sendTimerState({ id, program: updated, ...timerState });
            }
          } catch {}
        }
      } catch (err) {
        // silent
      }


      return updateTimerStateService(id, timerState);
    }
  });

  const stopAllConvexSessions = useConvexMutation(api.programs.stopAllActiveSessions);

  const handleStopAllSessions = async () => {
    if (!activeOrgId) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Stop All Sessions?',
      message: 'This will instantly stop all active programs in this workspace and reset all monitors to standby.',
      type: 'danger',
      onConfirm: async () => {
        try {
          await stopAllConvexSessions({ organizationId: activeOrgId as any });
          queryClient.invalidateQueries({ queryKey: ['programs', activeOrgId] });
        } catch (err) {
          console.error("Failed to stop sessions:", err);
        }
      }
    });
  };

  const handleNudge = (minutes: number, targetProgramId?: string) => {
    if (!canControlLive) return;
    
    const targetId = targetProgramId || displayProgram.id;
    const targetProg = targetProgramId ? (activeSessions.find(s => String(s.id) === String(targetProgramId)) || displayProgram) : displayProgram;
    const targetIdx = targetId === displayProgram.id ? displayCurrentSlotIndex : (targetProg.currentSlotIndex || 0);

    const currentSlot = targetProg.slots[targetIdx];
    console.log('handleNudge called with:', minutes, 'currentSlot duration minutes before nudge:', currentSlot?.durationMinutes);

    if (currentSlot) {
      const nextDuration = Math.max(0, currentSlot.durationMinutes + minutes);
      const newSlots = targetProg.slots.map((s, idx) => 
        idx === targetIdx ? { ...s, durationMinutes: nextDuration } : s
      );
      const activeManualMode = targetProg.isManualMode ?? displayIsManualMode ?? programRef.current?.isManualMode ?? false;
      const updated = { 
        ...targetProg, 
        ...programRef.current, 
        slots: newSlots,
        isManualMode: activeManualMode
      };
      console.log('updated slot durationMinutes:', nextDuration, 'isManualMode:', activeManualMode);

      // Immediately synchronize refs so debounces and background listeners never revert to stale slot durations
      programRef.current = updated;
      lastSavedProgramRef.current = updated;

      if (targetId === program.id || targetId === displayProgram.id) {
        updateLocalProgram(updated);
      }
      
      // Persist the slot change
      updateProgramService(updated);
    }
  };

  const handleEndEvent = (targetProgramId?: string) => {
    if (!canControlLive) return;
    const targetId = targetProgramId || displayProgram.id;
    const targetProg = targetProgramId ? (activeSessions.find(s => String(s.id) === String(targetProgramId)) || displayProgram) : displayProgram;
    const targetIdx = targetId === displayProgram.id ? displayCurrentSlotIndex : (targetProg.currentSlotIndex || 0);
    
    // Capture final slot duration
    const finalSlot = targetProg.slots[targetIdx];
    let slotsWithFinalDuration = targetProg.slots;
    
    if (finalSlot) {
      const elapsedMinutes = targetId === displayProgram.id ? Math.round(currentTickingSecondsRef.current / 60) : Math.round((targetProg.secondsElapsed || 0) / 60);
      slotsWithFinalDuration = targetProg.slots.map((s, idx) => 
        idx === targetIdx ? { ...s, actualDuration: elapsedMinutes } : s
      );
    }

    const updatedProgram: Program = { 
      ...targetProg, 
      slots: slotsWithFinalDuration,
      status: 'concluded' as const, 
      isTimerActive: false,
      timerStartTimestamp: null
    };

    // Update offline cache immediately so all display screens cleanly transition to concluded state
    try {
      const serialized = JSON.stringify(updatedProgram);
      const cleanId = targetId.replace(/^local-/, '');
      localStorage.setItem(`kairon_offline_cache_${targetId}`, serialized);
      localStorage.setItem(`kairon_offline_cache_${cleanId}`, serialized);
      localStorage.setItem('kairon_offline_cache_live', serialized);
      localStorage.setItem('kairon_program', serialized);
    } catch (e) {
      console.warn("Failed to update offline cache on end event:", e);
    }

    // PUSH TO CLOUD
    timerSaveMutation.mutate({
      id: targetId,
      currentSlotIndex: targetIdx,
      isTimerActive: false,
      secondsElapsed: 0,
      timerStartTimestamp: null,
      status: 'concluded'
    });

    if (targetId === program.id || targetId === displayProgram.id) {
      updateLocalProgram(updatedProgram);
      setIsTimerActive(false);
      setTimerStartTimestamp(null);
      setSecondsElapsed(0);
    }

    // Reset selected live session
    setSelectedLiveId(null);

    // Broadcast concluded state across all local tabs and Electron secondary windows
    try {
      const channel = new BroadcastChannel('kairon_offline_sync');
      channel.postMessage({
        id: targetId,
        program: updatedProgram,
        isTimerActive: false,
        timerStartTimestamp: null,
        status: 'concluded'
      });
      channel.close();

      const electronApi = (window as any).electron || (window as any).electronAPI;
      if (electronApi?.sendTimerState) {
        electronApi.sendTimerState({
          id: targetId,
          program: updatedProgram,
          isTimerActive: false,
          timerStartTimestamp: null,
          status: 'concluded'
        });
      }
    } catch (e) {
      console.warn("Failed to broadcast end event:", e);
    }
    
    // Final save to DB - Explicitly clear timer state for this venue
    updateProgramService(updatedProgram);
  };

  const requestEndEventConfirmation = (targetProgramId?: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'End Live Session?',
      message: 'Are you sure you want to conclude this live event? This will stop the live countdown and finalize records.',
      type: 'danger',
      onConfirm: () => {
        handleEndEvent(targetProgramId);
      }
    });
  };


  // Debounced Auto-Save with Visual Feedback
  useEffect(() => {
    if (isReadOnly) return;

    // Don't auto-save empty placeholder programs
    if (program.slots.length === 0 && program.title === 'New Event' && program.subtitle === '') {
      return;
    }

    // Skip saving if local state is already in sync with database
    if (fetchedProgram && isProgramContentEqual(program, fetchedProgram)) {
      setSaveStatus('saved');
      lastSavedProgramRef.current = fetchedProgram;
      return;
    }

    // Mark as unsaved when program changes
    setSaveStatus('unsaved');

    const timer = setTimeout(() => {
      const latestProgram = programRef.current;
      console.log(`Auto-saving program "${latestProgram.title}" to Convex...`);
      setSaveStatus('saving');
      lastSavedProgramRef.current = latestProgram;
      mutation.mutate(latestProgram);
    }, 2000); // 2s debounce

    return () => clearTimeout(timer);
  }, [program, isReadOnly, fetchedProgram]);

  // No-op: Removed 10-second background sync to prevent overwriting server with stale local ticks.
  // The system now relies on "Derived Time" on all displays, so the server only needs to know the StartTimestamp.

  // Update save status when mutation completes
  useEffect(() => {
    if (mutation.isSuccess) {
      // Invalidate programs cache to refresh home view
      queryClient.invalidateQueries({ queryKey: ['programs'] });

      // CRITICAL: If we just created a new program (transitioning from local- ID), 
      // we must update our local state with the actual Convex ID returned.
      const savedProgram = mutation.data as Program | void;
      const currentProg = programRef.current;
      if (savedProgram && savedProgram.id && currentProg.id !== savedProgram.id && currentProg.id?.startsWith('local-')) {
        console.log("Syncing local ID to Convex ID:", savedProgram.id);
        const syncedSlug = (savedProgram as Program).slug || currentProg.slug || currentProg.id.replace(/^local-/, '');
        if (lastSavedProgramRef.current) {
          lastSavedProgramRef.current = {
            ...lastSavedProgramRef.current,
            id: savedProgram.id,
            slug: syncedSlug,
            isPublic: (savedProgram as Program).isPublic ?? lastSavedProgramRef.current.isPublic ?? true,
          };
        }
        setProgram(prev => ({
          ...prev,
          id: (savedProgram as Program).id,
          slug: syncedSlug,
          isPublic: (savedProgram as Program).isPublic ?? prev.isPublic ?? true,
        }));
        // Also update URL to prevent "stale local" state on refresh
        setSearchParams(prev => {
          prev.set('id', (savedProgram as Program).id);
          return prev;
        }, { replace: true });
      }
    }
    if (mutation.isError) {
      setSaveStatus('unsaved');
    }
  }, [mutation.isSuccess, mutation.isError, mutation.data, queryClient]);

  // Set saveStatus to 'saved' when fetchedProgram catches up to our last saved state
  useEffect(() => {
    if (fetchedProgram && lastSavedProgramRef.current) {
      if (isProgramContentEqual(lastSavedProgramRef.current, fetchedProgram)) {
        // Only mark as saved if the user hasn't made new local edits in the meantime
        if (isProgramContentEqual(program, lastSavedProgramRef.current)) {
          setSaveStatus('saved');
        }
      }
    }
  }, [fetchedProgram, program]);

  const loadProgram = (newProgram: Program) => {
    const normalizedSlug = String(newProgram.slug || (newProgram as any).uuid || newProgram.id || '').replace(/^local-/, '');
    const normalizedProgram: Program = {
      ...newProgram,
      slug: normalizedSlug,
      isPublic: newProgram.isPublic ?? true,
    };
    lastAdvancedIndexRef.current = -1;
    lastProcessedIndexRef.current = -1;
    lastSavedProgramRef.current = normalizedProgram;
    setProgram(normalizedProgram);
    setSaveStatus('saved');

    // Safety: Only reset local viewer state if we are NOT loading the live program.
    // If loading the live program, we want to keep the current running pointers.
    if (globalLiveProgram?.id !== normalizedProgram.id) {
      setCurrentSlotIndex(0);
      setSecondsElapsed(0);
      setIsTimerActive(false);
      setTimerStartTimestamp(null);
    } else {
      // Even if loading the same program, ensure it's synced to the global state
      setCurrentSlotIndex(globalLiveProgram.currentSlotIndex || 0);
      setSecondsElapsed(globalLiveProgram.secondsElapsed || 0);
      setIsTimerActive(globalLiveProgram.isTimerActive || false);
      setTimerStartTimestamp(globalLiveProgram.timerStartTimestamp || null);
    }

    // Clear persisted state for safety when explicitly switching/loading
    localStorage.removeItem('kairon_elapsed_seconds');

    // Navigate to editor screen with the ID in the URL for better hydration
    navigate(`/editor?id=${normalizedProgram.id}`);
  };

  const handleSelectProgramFromCommand = (targetProgram: Program) => {
    loadProgram(targetProgram);
    navigate(`/live?id=${targetProgram.id}`);
  };

  const handlePlayProgram = (newProgram: Program, seconds?: number) => {
    lastAdvancedIndexRef.current = -1;
    lastProcessedIndexRef.current = -1;
    // 1. Set the interlock target specifically to this new program
    setInterlockTargetProgram(newProgram);
    
    // 2. Load it but DO NOT navigate yet
    setProgram(newProgram);
    
    // RESET Viewer State to prevent index leakage from previously viewed programs
    setCurrentSlotIndex(0);
    setSecondsElapsed(0);
    setTimerStartTimestamp(null);
    
    // 3. Trigger the timer toggle for this specific target, passing any local duration
    setTimeout(() => {
      handleToggleTimer(newProgram, false, seconds);
    }, 50);
  };

  const createProgram = (date: string) => {
    if (!canManagePrograms) {
      alert("Only workspace administrators and managers can create events.");
      return;
    }
    const baseProgram = getInitialProgram(activeOrgId || undefined);
    const newProgram: Program = {
      ...baseProgram,
      date: date,
    };
    loadProgram(newProgram);
  };

  const deleteProgram = async (id: string) => {
    if (!id) return;
    if (!canManagePrograms) {
      alert("Only workspace administrators and managers can delete events.");
      return;
    }

    try {
      await deleteProgramService(id);

      // Invalidate cache to refresh home and calendar views
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['programs', activeOrgId] });
      queryClient.invalidateQueries({ queryKey: ['activeSessions'] });

      // Dispatch event to immediately notify all local reactive queries
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('program_update'));
      }

      // If we deleted the current program, load another one
      const cleanDeletedId = id.replace('local-', '');
      const isCurrentDeleted = program.id === id || program.id.replace('local-', '') === cleanDeletedId;
      if (isCurrentDeleted) {
        // Fetch programs with activeOrgId so we don't get an empty list
        const allPrograms = await getPrograms(activeOrgId ?? undefined);
        const remaining = allPrograms.filter(p => p.id !== id && p.id.replace('local-', '') !== cleanDeletedId);
        if (remaining.length > 0) {
          loadProgram(remaining[0]);
        } else {
          // Reset to initial if all deleted
          const reset = getInitialProgram(activeOrgId ?? undefined);
          loadProgram(reset);
        }
      }
    } catch (error) {
      console.error('Failed to delete program:', error);
      alert('Failed to delete program. Please try again.');
    }
  };

  const duplicateProgram = (id: string) => {
    if (!canManagePrograms) {
      alert("Only workspace administrators and managers can duplicate events.");
      return;
    }
    void (async () => {
      try {
        const original = await getProgramById(id);
        if (!original) return;

        const newUuid = crypto.randomUUID();
        const newProgram: Program = {
          ...original,
          id: `local-${newUuid}`,
          slug: newUuid,
          isPublic: true,
          title: `${original.title} (Copy)`,
          status: 'draft',
          isTimerActive: false,
          timerStartTimestamp: null,
          secondsElapsed: 0,
          currentSlotIndex: 0,
          isOnHold: false,
          holdMessage: '',
          slots: original.slots.map(s => ({
            ...s,
            id: crypto.randomUUID()
          }))
        };

        const saved = await createProgramService(newProgram);

        queryClient.invalidateQueries({ queryKey: ['programs'] });
        queryClient.invalidateQueries({ queryKey: ['programs', activeOrgId] });
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('program_update'));
        }
        loadProgram(saved);
      } catch (error) {
        console.error('Failed to duplicate program:', error);
        alert('Failed to duplicate program. Please try again.');
      }
    })();
  };

  const handleTurnaroundProgram = (id: string) => {
    if (!canManagePrograms) {
      alert("Only workspace administrators and managers can create turnaround services.");
      return;
    }
    void (async () => {
      try {
        const original = await getProgramById(id);
        if (!original) return;

        // Calculate next title
        const getNextServiceTitle = (title: string): string => {
          if (/1st\s+Service/i.test(title)) return title.replace(/1st\s+Service/gi, '2nd Service');
          if (/First\s+Service/i.test(title)) return title.replace(/First\s+Service/gi, 'Second Service');
          if (/2nd\s+Service/i.test(title)) return title.replace(/2nd\s+Service/gi, '3rd Service');
          if (/Second\s+Service/i.test(title)) return title.replace(/Second\s+Service/gi, 'Third Service');
          if (/3rd\s+Service/i.test(title)) return title.replace(/3rd\s+Service/gi, '4th Service');
          if (/Third\s+Service/i.test(title)) return title.replace(/Third\s+Service/gi, 'Fourth Service');
          if (/Service\s+1/i.test(title)) return title.replace(/Service\s+1/gi, 'Service 2');
          if (/Service\s+2/i.test(title)) return title.replace(/Service\s+2/gi, 'Service 3');
          return `${title} (Next Service)`;
        };

        // Shift start time by +120m (2 hours)
        const shiftTime = (timeStr?: string, minutes = 120): string => {
          if (!timeStr) return "11:00";
          const [h, m] = timeStr.split(':').map(Number);
          if (isNaN(h) || isNaN(m)) return timeStr;
          const total = (h * 60 + m + minutes) % (24 * 60);
          const newH = Math.floor(total / 60);
          const newM = total % 60;
          return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
        };

        const newUuid = crypto.randomUUID();
        const newProgram: Program = {
          ...original,
          id: `local-${newUuid}`,
          slug: newUuid,
          isPublic: true,
          title: getNextServiceTitle(original.title),
          startTime: shiftTime(original.startTime, 120),
          status: 'draft',
          isTimerActive: false,
          timerStartTimestamp: null,
          secondsElapsed: 0,
          currentSlotIndex: 0,
          isOnHold: false,
          holdMessage: '',
          slots: original.slots.map(s => ({
            ...s,
            id: crypto.randomUUID(),
            actualDuration: undefined
          }))
        };

        const saved = await createProgramService(newProgram);
        queryClient.invalidateQueries({ queryKey: ['programs'] });
        loadProgram(saved);
        navigate('/editor');
      } catch (error) {
        console.error('Failed to turnaround service:', error);
        alert('Failed to turnaround service. Please try again.');
      }
    })();
  };

  // THE PRODUCTION ENGINE: Background Ticking for Logic & Snapshots
  // While UI components (LiveTimer, HUD) tick autonomously for smoothness,
  // App.tsx needs derived values to trigger Auto-Advance and Analytics.
  useEffect(() => {
    let interval: number | undefined;

    const tick = () => {
      const now = Date.now();
      
      // Update the correctly viewed program snapshot (Live OR Draft)
      if (displayIsTimerActive && displayTimerStartTimestamp) {
        const elapsed = Math.floor((now - displayTimerStartTimestamp) / 1000);
        
        // Update local secondsElapsed to trigger re-renders for auto-advance (once per second)
        setSecondsElapsed(prev => prev !== elapsed ? elapsed : prev);
        
        // ALWAYS update the high-precision ref for pause capturing
        currentTickingSecondsRef.current = elapsed;
      }
    };

    // Low-frequency tick (500ms) for background logic to save CPU
    if (displayIsTimerActive && displayTimerStartTimestamp) {
      tick(); // Initial sync
      interval = window.setInterval(tick, 500);
    }

    return () => clearInterval(interval);
  }, [isTimerActive, timerStartTimestamp]);


  const handleSlotComplete = (slotId: string, actualDuration: number) => {
    updateLocalProgram(prev => ({
      ...prev,
      slots: prev.slots.map(s => s.id === slotId ? { ...s, actualDuration } : s)
    }));
  };

  const handleUpdateSlot = async (slotId: string, updates: Partial<Slot>) => {
    // We always act on the VIEWED program (Draft or Live)
    // If viewing the live show, displayProgram is globalLiveProgram
    const newSlots = displayProgram.slots.map(s => 
      s.id === slotId ? { ...s, ...updates } : s
    );
    const updatedProgram = { ...displayProgram, slots: newSlots };

    if (isLiveEventActive && displayProgram.id === globalLiveProgram?.id) {
      // It's the live show - Convex will broadcast this automatically if we mutation save it
    } else {
      updateLocalProgram(updatedProgram);
    }

    try {
      await updateProgramService(updatedProgram);
    } catch (err) {
      console.error("Failed to update slot:", err);
    }
  };

  // Universal Auto-Advance Watcher (Corrected)
  useEffect(() => {
    if (!displayProgram || !displayProgram.id) return;
    if (displayIsManualMode || displayProgram.isManualMode) return;
    if (!displayIsTimerActive) return; // FIX: Never auto-advance or unpause if timer is paused!

    const currentIdx = displayCurrentSlotIndex;
    const elapsed = displaySecondsElapsed;

    // State-Based Settle Lock: Reset settle state when index changes
    if (lastProcessedIndexRef.current !== currentIdx) {
      lastProcessedIndexRef.current = currentIdx;
      return; // Skip evaluation on the first render run of a new slot index to let state settle
    }

    const currentSlot = displayProgram.slots[currentIdx];
    
    if (!currentSlot) return;

    const durationSeconds = currentSlot.durationMinutes * 60;

    if (elapsed >= durationSeconds && lastAdvancedIndexRef.current !== currentIdx) {
      // Throttle Auto-Advance (Mutation Lock): Check throttle BEFORE assigning lock
      if (Date.now() - lastAdvanceTimeRef.current < 2000) return;
      lastAdvanceTimeRef.current = Date.now();
      lastAdvancedIndexRef.current = currentIdx; // Lock it once we pass throttle!

      console.log('AUTO-ADVANCE TRIGGERED FOR:', displayProgram.title);
      handleSlotComplete(currentSlot.id, currentSlot.durationMinutes);

      if (currentIdx < displayProgram.slots.length - 1) {
        const nextIndex = currentIdx + 1;
        const nextStartTs = Date.now();

        // Persist the new slot index to Convex immediately for auto-advance sync
        timerSaveMutation.mutate({
          id: displayProgram.id, // Explicitly target the program being viewed
          currentSlotIndex: nextIndex,
          isTimerActive: true,
          secondsElapsed: 0,
          timerStartTimestamp: nextStartTs
        });

        // Also update local state for smoothness if viewing draft
        if (!isLiveEventActive || displayProgram.id === program.id) {
          setCurrentSlotIndex(nextIndex);
          setSecondsElapsed(0);
          setTimerStartTimestamp(nextStartTs);
        }
      } else {
        // End of event
        handleEndEvent();
      }
    }
  }, [displaySecondsElapsed, displayIsTimerActive, displayProgram.id, displayCurrentSlotIndex, displayProgram.slots, displayIsManualMode, displayProgram.isManualMode]);

  // Auto-Start Watcher (New Feature)
  useEffect(() => {
    // Only run if timer is NOT active, program is in draft status, and we are NOT in read-only mode
    if (isTimerActive || isReadOnly || program.status !== 'draft') return;

    const interval = setInterval(() => {
      const now = new Date();
      // 1. Check Date (Compare YYYY-MM-DD)
      const todayStr = now.toISOString().split('T')[0];
      if (program.date !== todayStr) return;

      // 2. Check Time (Compare HH:MM:00)
      const [schedH, schedM] = program.startTime.split(':').map(Number);

      const currentH = now.getHours();
      const currentM = now.getMinutes();
      const currentS = now.getSeconds();

      // Trigger strictly at the 0th second of the scheduled minute
      if (currentH === schedH && currentM === schedM && currentS === 0) {
        console.log("Auto-starting event at:", program.startTime);

        // Start Timer Logic (Inline version of handleToggleTimer for precision)
        // We force-start it.
        const startTs = Date.now();

        setIsTimerActive(true);
        setTimerStartTimestamp(startTs);
        setSecondsElapsed(0); // Ensure fresh start

        updateLocalProgram(prev => ({ ...prev, status: 'live' }));

        // PUSH TO CLOUD 
        timerSaveMutation.mutate({
          id: program.id,
          currentSlotIndex,
          isTimerActive: true,
          secondsElapsed: 0, // Required by schema
          timerStartTimestamp: startTs,
          status: 'live'
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerActive, isReadOnly, program.date, program.startTime, program.id]);

  // Fix: Toggle Timer with Unified Controls (Simplified for Multi-Track)
  const handleToggleTimer = (targetProgramOverride?: Program, force: boolean = false, localSecondsOverride?: number) => {
    // Determine the ACTUAL target program for this toggle action (Unified for Header + Bridge + List)
    const displayTarget = targetProgramOverride || displayProgram;
    const targetIdStr = String(displayTarget.id);
    
    // Safety Lookup: Always get the absolute latest state from activeSessions if it exists
    const latestTarget = activeSessions.find(s => String(s.id) === targetIdStr) || displayTarget;
    const target = latestTarget;

    // CRITICAL (ID NORMALIZATION FIX): Use string-safe comparisons for active state
    // We check target.isTimerActive, activeSessions (Cloud), and local state
    const targetIsActive = (target.isTimerActive !== undefined ? target.isTimerActive : false) ||
                          activeSessions.some(as => String(as.id) === targetIdStr && as.isTimerActive) || 
                          (targetIdStr === String(displayProgram.id) ? displayIsTimerActive : false) ||
                          (targetIdStr === String(program.id) ? isTimerActive : false);

    // Safety Interlock Check: If we are starting a NEW event while others are already LIVE
    const isTargetAuthorized = target.status === 'live';
    const hasOtherLiveSessions = activeSessions.some(s => String(s.id) !== targetIdStr && s.isTimerActive);

    // SUPPRESSION: Ignore concurrent warnings if we just toggled something (database sync window)
    if (!force && !isTargetAuthorized && !targetIsActive && hasOtherLiveSessions && !recentlyToggledRef.current) {
      setInterlockTargetProgram(target);
      setIsInterlockOpen(true);
      return;
    }

    const newState = !targetIsActive;
    lastAdvanceTimeRef.current = Date.now();
    
    // Set suppression window
    recentlyToggledRef.current = true;
    setTimeout(() => { recentlyToggledRef.current = false; }, 2000);

    // INDEX PRESERVATION FIX:
    // We prioritize using the display state for existing sessions to prevent 'Jump to Slot 0' resets.
    const indexToUse = (targetIdStr === String(displayProgram.id)) 
      ? displayCurrentSlotIndex 
      : (target.currentSlotIndex || 0);

    const isConcluded = target.status === 'concluded' || displayProgram.status === 'concluded';
    const totalSlots = target.slots?.length || displayProgram.slots?.length || 1;
    const isPastEnd = indexToUse >= totalSlots - 1 && (displaySecondsElapsed >= (displayProgram.slots?.[indexToUse]?.durationMinutes || 0) * 60 || isConcluded);

    let effectiveIndex = indexToUse;
    let secondsToUse = localSecondsOverride !== undefined 
      ? localSecondsOverride 
      : (targetIdStr === String(displayProgram.id) ? displaySecondsElapsed : (target.secondsElapsed || 0));

    // REPLAY / RESTART FIX:
    // If starting a service that has already concluded, or restarting at the end of the rundown,
    // cleanly rewind to Slot 0 and reset elapsed seconds to 0!
    if (newState && (isConcluded || isPastEnd)) {
      effectiveIndex = 0;
      secondsToUse = 0;
    }

    if (newState) {
      const now = Date.now();
      if (targetIdStr === String(displayProgram.id)) {
        lastAdvancedIndexRef.current = -1;
        lastProcessedIndexRef.current = -1;
      }
      
      const shiftedStart = now - (secondsToUse * 1000);

      timerSaveMutation.mutate({
        id: target.id,
        currentSlotIndex: effectiveIndex,
        isTimerActive: true,
        secondsElapsed: secondsToUse, 
        timerStartTimestamp: shiftedStart,
        status: 'live'
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [api.programs.getActiveSessions] });
        }
      });

      if (targetIdStr === String(program.id) || targetIdStr === String(displayProgram.id)) {
        setCurrentSlotIndex(effectiveIndex);
        setSecondsElapsed(secondsToUse);
        setIsTimerActive(true);
        setTimerStartTimestamp(shiftedStart);
        updateLocalProgram(prev => ({
          ...prev,
          status: 'live',
          isTimerActive: true,
          timerStartTimestamp: shiftedStart,
          currentSlotIndex: effectiveIndex,
          secondsElapsed: secondsToUse
        }));
        
        // REDIRECT FIX: Only navigate to Editor if starting from a non-production view
        const currentPath = window.location.pathname;
        const isProductionView = currentPath.includes('/live') || currentPath.includes('/editor') || currentPath.includes('/monitors');
        if (!isProductionView) {
          navigate(`/editor?id=${target.id}&mode=live`);
        }
      }
    } else {
      // Pause - ABSOLUTE WALL-CLOCK AUTHORITY
      const now = Date.now();
      const effectiveStartTs = target.timerStartTimestamp ?? (targetIdStr === String(displayProgram.id) ? displayTimerStartTimestamp : null);
      const wallDelta = effectiveStartTs ? Math.floor((now - effectiveStartTs) / 1000) : (target.secondsElapsed || 0);
      
      const secondsToSave = (localSecondsOverride !== undefined)
        ? localSecondsOverride
        : ((target.status === 'live' || targetIdStr === String(displayProgram.id))
            ? Math.max(wallDelta, currentTickingSecondsRef.current || 0)
            : wallDelta);

      timerSaveMutation.mutate({
        id: target.id,
        currentSlotIndex: indexToUse,
        isTimerActive: false,
        secondsElapsed: secondsToSave, 
        timerStartTimestamp: null,
        status: 'live' 
      });

      if (targetIdStr === String(program.id) || targetIdStr === String(displayProgram.id)) {
        setIsTimerActive(false);
        setTimerStartTimestamp(null);
        setSecondsElapsed(secondsToSave); 
        updateLocalProgram(prev => ({
          ...prev,
          isTimerActive: false,
          timerStartTimestamp: null,
          secondsElapsed: secondsToSave,
          currentSlotIndex: indexToUse
        }));
      }
    }
  };

  const handleConfirmStart = (mode: 'concurrent' | 'replace' | 'cancel') => {
    setIsInterlockOpen(false);

    if (mode === 'cancel') {
      setInterlockTargetProgram(null);
      return;
    }

    if (mode === 'replace') {
      handleEndEvent();
    }
 
    // Wait for end event to settle, then start the new one
    setTimeout(() => {
      // Use the specific target that triggered this interlock
      const target = interlockTargetProgram || displayProgram;
      handleToggleTimer(target, true); // PASS FORCE FLAG to skip loop
      setInterlockTargetProgram(null);
    }, 150);
  };

  const handleToggleHold = (nextHoldState?: boolean, targetProgramId?: string) => {
    if (isReadOnly) return;
    const targetId = targetProgramId || displayProgram.id;
    const targetProg = targetProgramId ? (activeSessions.find(s => String(s.id) === String(targetProgramId)) || displayProgram) : displayProgram;
    
    const holdState = nextHoldState !== undefined ? nextHoldState : !targetProg.isOnHold;
    const msg = targetProg.holdMessage || "";

    const currentElapsed = targetId === displayProgram.id ? currentTickingSecondsRef.current : (targetProg.secondsElapsed || 0);

    // If entering HOLD: pause timer & freeze elapsed
    // If exiting HOLD: resume timer if it was running or should run
    let nextTimerActive = false;
    let nextTimestamp: number | null = null;

    if (holdState) {
      // Entering HOLD -> freeze countdown clock
      nextTimerActive = false;
      nextTimestamp = null;
    } else {
      // Exiting HOLD -> resume countdown clock cleanly
      nextTimerActive = true;
      nextTimestamp = Date.now() - (currentElapsed * 1000);
    }

    // PUSH TO CLOUD - Ensure HUDs update instantly
    timerSaveMutation.mutate({
      id: targetId,
      currentSlotIndex: targetId === displayProgram.id ? displayCurrentSlotIndex : (targetProg.currentSlotIndex || 0),
      isTimerActive: nextTimerActive,
      secondsElapsed: currentElapsed,
      timerStartTimestamp: nextTimestamp,
      isOnHold: holdState,
      holdMessage: msg
    });

    // Local update for smoothness on draft
    if (targetId === program.id) {
      updateLocalProgram(prev => ({
        ...prev,
        isOnHold: holdState,
        holdMessage: msg,
        isTimerActive: nextTimerActive,
        secondsElapsed: currentElapsed,
        timerStartTimestamp: nextTimestamp
      }));
      setIsTimerActive(nextTimerActive);
      setTimerStartTimestamp(nextTimestamp);
    }
  };

  const handleToggleManualMode = (targetProgramId?: string) => {
    if (!canControlLive) return;
    const targetId = targetProgramId || displayProgram.id;
    const targetProg = targetProgramId ? (activeSessions.find(s => String(s.id) === String(targetProgramId)) || displayProgram) : displayProgram;
    
    const nextManualState = !(targetProg.isManualMode ?? displayIsManualMode);

    if (programRef.current) {
      programRef.current = { ...programRef.current, isManualMode: nextManualState };
    }
    if (lastSavedProgramRef.current) {
      lastSavedProgramRef.current = { ...lastSavedProgramRef.current, isManualMode: nextManualState };
    }

    // PUSH TO CLOUD - Ensure HUDs update instantly
    timerSaveMutation.mutate({
      id: targetId,
      currentSlotIndex: targetId === displayProgram.id ? displayCurrentSlotIndex : (targetProg.currentSlotIndex || 0),
      isTimerActive: targetId === displayProgram.id ? displayIsTimerActive : (targetProg.isTimerActive || false),
      secondsElapsed: targetId === displayProgram.id ? currentTickingSecondsRef.current : (targetProg.secondsElapsed || 0),
      timerStartTimestamp: targetId === displayProgram.id ? displayTimerStartTimestamp : (targetProg.timerStartTimestamp || null),
      isManualMode: nextManualState
    });

    if (targetId === program.id || targetId === displayProgram.id) {
      updateLocalProgram(prev => ({ ...prev, isManualMode: nextManualState }));
    }
  };


  const handleNext = (targetProgramId?: string) => {
    if (!canControlLive) return;
    const targetId = targetProgramId || displayProgram.id;
    const targetProg = targetProgramId ? (activeSessions.find(s => String(s.id) === String(targetProgramId)) || displayProgram) : displayProgram;
    const targetIdx = targetId === displayProgram.id ? displayCurrentSlotIndex : (targetProg.currentSlotIndex || 0);

    if (targetIdx < targetProg.slots.length) {
      const currentSlot = targetProg.slots[targetIdx];
      const actualDur = targetId === displayProgram.id 
        ? Math.round(currentTickingSecondsRef.current / 60) 
        : Math.round((targetProg.secondsElapsed || 0) / 60);
      
      handleSlotComplete(currentSlot.id, actualDur);

      const plannedDur = currentSlot.durationMinutes;
      const overrunMinutes = actualDur - plannedDur;
      let healedSlots = targetProg.slots;
      if (isAutopilotEnabled && overrunMinutes > 0 && targetIdx < targetProg.slots.length - 1) {
        console.log(`Autopilot: Slot "${currentSlot.title}" ran over by ${overrunMinutes}m. Recalculating remaining slots...`);
        healedSlots = healScheduleOverruns(targetProg, targetIdx, overrunMinutes * 60);
      }

      // Persist the slot's performance data immediately
      void (async () => {
        try {
          const updatedSlots = healedSlots.map(s =>
            s.id === currentSlot.id ? { ...s, actualDuration: actualDur } : s
          );
          await updateProgramService({ ...targetProg, slots: updatedSlots });
        } catch (err) {
          console.error("Failed to persist slot actual duration:", err);
        }
      })();

      if (targetIdx < targetProg.slots.length - 1) {
        // Continuous Playback Logic: Keep timer running if NOT in manual mode
        const nextIndex = targetIdx + 1;
        const nextIsActive = !targetProg.isManualMode;
        const now = Date.now();
        const nextStartTs = nextIsActive ? now : null;

        lastAdvanceTimeRef.current = now;

        // PUSH TO CLOUD 
        timerSaveMutation.mutate({
          id: targetId,
          currentSlotIndex: nextIndex,
          isTimerActive: nextIsActive,
          secondsElapsed: 0,
          timerStartTimestamp: nextStartTs
        });

        // Local update for smoothness on draft
        if (targetId === program.id || targetId === displayProgram.id) {
          setCurrentSlotIndex(nextIndex);
          setSecondsElapsed(0);
          setIsTimerActive(nextIsActive);
          setTimerStartTimestamp(nextStartTs);
        }
      } else {
        // End of event
        handleEndEvent(targetId);
      }
    }
  };

  const handlePrev = (targetProgramId?: string) => {
    if (!canControlLive) return;
    const targetId = targetProgramId || displayProgram.id;
    const targetProg = targetProgramId ? (activeSessions.find(s => String(s.id) === String(targetProgramId)) || displayProgram) : displayProgram;
    const targetIdx = targetId === displayProgram.id ? displayCurrentSlotIndex : (targetProg.currentSlotIndex || 0);

    if (targetIdx > 0) {
      const nextIndex = targetIdx - 1;
      const nextIsActive = !targetProg.isManualMode;
      const now = Date.now();
      const nextStartTs = nextIsActive ? now : null;

      lastAdvanceTimeRef.current = now;

      // PUSH TO CLOUD
      timerSaveMutation.mutate({
        id: targetId,
        currentSlotIndex: nextIndex,
        isTimerActive: nextIsActive,
        secondsElapsed: 0,
        timerStartTimestamp: nextStartTs
      });

      // Local update for smoothness on draft
      if (targetId === program.id || targetId === displayProgram.id) {
        setCurrentSlotIndex(nextIndex);
        setSecondsElapsed(0);
        setIsTimerActive(nextIsActive);
        setTimerStartTimestamp(nextStartTs);
      }
    }
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center w-14 md:w-20 h-16 rounded-xl transition-all ${isActive
      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 translate-y-[-4px]'
      : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200'
    }`;

  const [isHotkeysOpen, setIsHotkeysOpen] = useState(false);

  const exportTargetProgram = location.pathname.startsWith('/editor') ? program : displayProgram;

  // --- Portable .kairon & .csv File I/O Handlers ---
  const handleSaveKaironFile = React.useCallback(async (targetProg: Program = exportTargetProgram) => {
    const res = await saveKaironFileToDisk(targetProg, activeOrg?.name);
    if (res.saved) {
      setLastDiskArchiveAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
  }, [exportTargetProgram, activeOrg?.name]);

  const handleOpenKaironFile = React.useCallback(async () => {
    const anyWin = window as any;
    if (anyWin?.electronAPI?.openKaironFile) {
      try {
        const res = await anyWin.electronAPI.openKaironFile();
        if (res?.opened && res?.content) {
          const parsed = parseKaironFile(res.content);
          if (parsed?.program) {
            const imported = parsed.program;
            updateLocalProgram(imported);
            if (imported.slots.length > 0) setSelectedSlotId(imported.slots[0].id);
            navigate('/editor');
          } else {
            alert('Invalid .kairon file format.');
          }
        }
        return;
      } catch (err) {
        console.warn('Electron open dialog fallback to browser input:', err);
      }
    }
    fileInputRef.current?.click();
  }, [updateLocalProgram, navigate]);

  const handleBrowserFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result || '');
      if (file.name.toLowerCase().endsWith('.csv')) {
        const slots = parseCsvToSlots(content);
        if (slots.length > 0) {
          updateLocalProgram(prev => ({
            ...prev,
            slots,
          }));
          setSelectedSlotId(slots[0].id);
          navigate('/editor');
        } else {
          alert('No valid schedule rows found in CSV file.');
        }
      } else {
        const parsed = parseKaironFile(content);
        if (parsed?.program) {
          const imported = parsed.program;
          updateLocalProgram(imported);
          if (imported.slots.length > 0) setSelectedSlotId(imported.slots[0].id);
          navigate('/editor');
        } else {
          alert('Could not parse .kairon file.');
        }
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  // Global Tactical Broadcast & Studio Hotkeys
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;

      // Studio-wide Ctrl/Cmd shortcuts work even if focus is in an input (except Ctrl+B)
      if (isMod && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
        return;
      }
      if (isMod && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        void handleSaveKaironFile();
        return;
      }
      if (isMod && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault();
        void handleOpenKaironFile();
        return;
      }
      if (isMod && e.key === '\\') {
        e.preventDefault();
        setIsRightDockCollapsed(prev => !prev);
        return;
      }

      // Ignore single-key broadcast hotkeys when typing inside text inputs, textareas, or contentEditable
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (isMod && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        setIsSidebarCollapsed(prev => !prev);
        return;
      }

      // '?' toggles Hotkeys Modal
      if (e.key === '?') {
        e.preventDefault();
        setIsHotkeysOpen(prev => !prev);
        return;
      }

      // 'Escape' closes modals if open
      if (e.key === 'Escape') {
        if (isCommandPaletteOpen) {
          e.preventDefault();
          setIsCommandPaletteOpen(false);
          return;
        }
        if (isIntegrationsOpen) {
          e.preventDefault();
          setIsIntegrationsOpen(false);
          return;
        }
        if (isHotkeysOpen) {
          e.preventDefault();
          setIsHotkeysOpen(false);
          return;
        }
      }

      if (isHotkeysOpen || isCommandPaletteOpen || isIntegrationsOpen) return;

      // Broadcast hotkeys
      if (e.code === 'Space') {
        e.preventDefault();
        handleToggleTimer(displayProgram, false, headerElapsed);
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleNudge(1);
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleNudge(-1);
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        handleToggleHold();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        handleToggleManualMode();
      } else if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        handleToggleAutopilot();
      } else if (e.key === '1') {
        e.preventDefault();
        navigate('/editor');
      } else if (e.key === '2') {
        e.preventDefault();
        navigate('/live');
      } else if (e.key === '3') {
        e.preventDefault();
        navigate('/monitors');
      } else if (e.key === '4') {
        e.preventDefault();
        navigate(displayProgram?.id ? `/analytics/${displayProgram.id}` : '/list');
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [
    isHotkeysOpen,
    isCommandPaletteOpen,
    isIntegrationsOpen,
    handleSaveKaironFile,
    handleOpenKaironFile,
    handleToggleTimer,
    handleNext,
    handlePrev,
    handleNudge,
    handleToggleHold,
    handleToggleManualMode,
    handleToggleAutopilot,
    displayProgram?.id,
    navigate
  ]);

  // --- Public Path Logic ---
  const isPublicPath =
    location.pathname.includes('/p/') ||
    location.hash.includes('/p/') ||
    location.hash.includes('mode=viewer');

  const legacyRedirectDetected = React.useRef(false);
  useEffect(() => {
    if (legacyRedirectDetected.current) return;

    // Handle legacy links: http://domain/#/live?mode=viewer&id=xxx
    const fullUrl = window.location.href;
    if (fullUrl.includes('mode=viewer') && fullUrl.includes('id=')) {
      const match = fullUrl.match(/[?&]id=([a-z0-9-]+)/i);
      if (match && match[1]) {
        console.log("Legacy Viewer Link Detected. Redirecting to clean Public Portal...");
        legacyRedirectDetected.current = true;
        navigate(`/p/${match[1]}`, { replace: true });
      }
    }
  }, [navigate]);

  // Header UI Sync (for the mini-timer) - Must execute before any early returns to satisfy Rules of Hooks
  const headerElapsed = useTimerSync(displayTimerStartTimestamp, displayIsTimerActive, displaySecondsElapsed);
  const currentHeaderSlot = displayProgram.slots?.[displayCurrentSlotIndex];
  const headerTimeLeft = currentHeaderSlot ? (currentHeaderSlot.durationMinutes * 60 - headerElapsed) : 0;

  // Sync the Ref for background mutations (handlers)
  useEffect(() => {
    currentTickingSecondsRef.current = headerElapsed;
  }, [headerElapsed]);

  const isConvexId = displayProgram.id && displayProgram.id.length >= 19 && !displayProgram.id.includes('-');
  const crewAcks = useConvexQuery(
    api.programs.getAcknowledgements,
    isConvexId ? { programId: displayProgram.id as any } : "skip"
  ) || [];

  const [headerLocalAcks, setHeaderLocalAcks] = useState<Set<string>>(new Set());

  useEffect(() => {
    const channel = new BroadcastChannel('kairon_acks');
    const handleAckMsg = (e: MessageEvent) => {
      if (e.data && e.data.type === 'crew_ack' && e.data.slotId && e.data.role) {
        setHeaderLocalAcks(prev => new Set(prev).add(`${e.data.slotId}-${e.data.role}`));
      }
    };
    channel.addEventListener('message', handleAckMsg);
    return () => {
      channel.removeEventListener('message', handleAckMsg);
      channel.close();
    };
  }, []);

  const isSoundAcked = !!(currentHeaderSlot && headerLocalAcks.has(`${currentHeaderSlot.id}-sound`)) || crewAcks.some((a: any) => a.slotId === currentHeaderSlot?.id && a.role === 'sound');
  const isLightsAcked = !!(currentHeaderSlot && headerLocalAcks.has(`${currentHeaderSlot.id}-lighting`)) || crewAcks.some((a: any) => a.slotId === currentHeaderSlot?.id && a.role === 'lighting');
  const isVideoAcked = !!(currentHeaderSlot && headerLocalAcks.has(`${currentHeaderSlot.id}-video`)) || crewAcks.some((a: any) => a.slotId === currentHeaderSlot?.id && a.role === 'video');

  // Listen for timer control actions sent from detached secondary windows (e.g. Flight Bridge)
  useEffect(() => {
    const handleControlAction = (msg: any) => {
      if (!msg || !msg.action) return;
      const targetProg = displayProgram;
      switch (msg.action) {
        case 'TOGGLE_TIMER':
          handleToggleTimer(targetProg, msg.force, msg.seconds);
          break;
        case 'NEXT':
          handleNext(msg.targetId);
          break;
        case 'PREV':
          handlePrev(msg.targetId);
          break;
        case 'NUDGE':
          handleNudge(msg.minutes || (msg.seconds ? msg.seconds / 60 : 1), msg.targetId);
          break;
        case 'HOLD':
          handleToggleHold(msg.nextState, msg.targetId);
          break;
        case 'END_EVENT':
          handleEndEvent(msg.targetId);
          break;
        case 'REQUEST_END_EVENT':
          requestEndEventConfirmation(msg.targetId || targetProg.id);
          break;
        case 'TOGGLE_MANUAL':
          handleToggleManualMode(msg.targetId);
          break;
      }
    };

    // 1. Electron IPC control listener
    const electron = typeof window !== 'undefined' ? ((window as any).electron || (window as any).electronAPI) : null;
    let unsubIpc: (() => void) | undefined;
    if (electron && typeof electron.onTimerControl === 'function') {
      unsubIpc = electron.onTimerControl(handleControlAction);
    }

    // 2. BroadcastChannel control listener (for multi-window / backup)
    const controlChannel = new BroadcastChannel('kairon_control_sync');
    const handleChannelMsg = (e: MessageEvent) => {
      if (e.data && e.data.type === 'TIMER_CONTROL') {
        handleControlAction(e.data);
      }
    };
    controlChannel.addEventListener('message', handleChannelMsg);

    return () => {
      if (unsubIpc) unsubIpc();
      controlChannel.removeEventListener('message', handleChannelMsg);
      controlChannel.close();
    };
  }, [displayProgram, handleToggleTimer, handleNext, handlePrev, handleNudge, handleToggleHold, handleEndEvent, requestEndEventConfirmation, handleToggleManualMode]);

  // --- Public View Bypass (TOP LEVEL) ---
  // We check this before ANY auth or shell rendering to ensure zero-friction guest access and no flicker.
  if (isPublicPath) {
    // Handle legacy hash links like /#/p/<slug>?embed=true
    if (location.hash.includes('/p/')) {
      const hashPath = location.hash.substring(location.hash.indexOf('/p/'));
      return <Navigate to={hashPath} replace />;
    }
    // Handle path contamination: /live/p/ or /calendar/p/
    if (location.pathname.includes('/p/') && !location.pathname.startsWith('/p/')) {
      const cleanPath = location.pathname.substring(location.pathname.indexOf('/p/'));
      return <Navigate to={cleanPath} replace />;
    }

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Routes>
          <Route path="/p/:slug/crew" element={<CrewHUD />} />
          <Route path="/p/:slug" element={<PublicPortal />} />
          <Route path="/p/:slug/*" element={<PublicPortal />} />
          {/* Fallback to home if they somehow land here or legacy link is processing */}
          <Route path="*" element={<div className="flex items-center justify-center min-h-screen"><div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>} />
        </Routes>
      </div>
    );
  }

  // Special Route Handling: TV Mode, Stage, Prompter, Crew HUD, Broadcast Overlay, Public
  // We render this exclusively, bypassing the main application shell (header, footer, etc.)
  // Support both standard BrowserRouter paths (/stage) and compiled Electron hash paths (#stage, #/stage)
  const rawHash = (location.hash || '').replace(/^#\/?/, '').split('?')[0].toLowerCase();
  const rawPath = (location.pathname || '').replace(/^\//, '').split('?')[0].toLowerCase();
  const currentRouteToken = rawHash || rawPath;

  if (currentRouteToken === 'tv' || location.pathname === '/tv') {
    return <TVWrapper />;
  }

  if (currentRouteToken === 'stage' || location.pathname === '/stage') {
    return <StageWrapper />;
  }

  if (currentRouteToken === 'prompter' || location.pathname === '/prompter') {
    return <PrompterWrapper />;
  }

  if (currentRouteToken === 'overlay' || location.pathname === '/overlay') {
    return <BroadcastOverlayView />;
  }

  if (currentRouteToken === 'crew' || location.pathname === '/crew') {
    return <CrewHUD />;
  }

  if (currentRouteToken === 'public' || currentRouteToken === 'portal' || location.pathname === '/public' || location.pathname === '/portal') {
    return <PublicPortal />;
  }

  if (currentRouteToken === 'bridge' || location.pathname === '/bridge') {
    return <FlightBridgeStandaloneView />;
  }

  // Desktop app browser-auth approval page
  // This must be accessible without authentication — the user authorises the desktop session here.
  if (location.pathname === '/desktop-auth' || currentRouteToken === 'desktop-auth' || searchParams.has('desktopCode')) {
    return <DesktopAuthApproval />;
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-[#0B0C0E] text-slate-900 dark:text-slate-100 transition-colors duration-300 overflow-hidden">
      {/* =========================================================
          ROW 1: DESKTOP STUDIO MENU BAR (28px, lg:flex)
         ========================================================= */}
      {user && (
        <StudioMenuBar
          program={exportTargetProgram}
          isTimerActive={displayIsTimerActive}
          isAutopilotEnabled={isAutopilotEnabled}
          isSidebarCollapsed={isSidebarCollapsed}
          isRightDockOpen={!isRightDockCollapsed}
          lastArchivedPath={lastDiskArchiveAt}
          onCreateNewEvent={() => createProgram(new Date().toISOString().split('T')[0])}
          onOpenKaironFile={() => void handleOpenKaironFile()}
          onSaveKaironFile={() => void handleSaveKaironFile()}
          onExportCsv={() => downloadProgramCsv(exportTargetProgram)}
          onOpenExportPdf={() => setIsExportOpen(true)}
          onDuplicateEvent={() => duplicateProgram(program.id)}
          onTurnaroundEvent={() => handleTurnaroundProgram(program.id)}
          onApplyTemplate={(tmplId) => {
            const tmpl = PRODUCTION_TEMPLATES.find(t => t.id === tmplId);
            if (!tmpl) return;
            const newSlots: Slot[] = tmpl.slots.map((s, idx) => ({
              id: `slot-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
              title: s.title,
              speaker: s.speaker,
              durationMinutes: s.durationMinutes,
              type: s.type as SlotType,
              details: s.details || '',
              productionNotes: s.productionNotes || '',
              prompterText: s.prompterText || '',
            }));
            updateLocalProgram(prev => ({
              ...prev,
              title: prev.title === 'New Event' ? tmpl.name : prev.title,
              startTime: tmpl.startTime,
              slots: newSlots,
            }));
            if (newSlots.length > 0) setSelectedSlotId(newSlots[0].id);
            navigate('/editor');
          }}
          onToggleAutopilot={() => handleToggleAutopilot()}
          onToggleManualMode={() => handleToggleManualMode()}
          onToggleTimer={() => handleToggleTimer(displayProgram, false, headerElapsed)}
          onNextSlot={() => handleNext()}
          onPrevSlot={() => handlePrev()}
          onNudge={(mins) => handleNudge(mins)}
          onToggleHold={() => handleToggleHold()}
          onClearStageMessage={() => clearStageMessage()}
          onProjectScreen={(path, screenIdx, winName) => openOnTargetScreen(path, screenIdx, winName)}
          onOpenIntegrations={() => setIsIntegrationsOpen(true)}
          onToggleSidebar={() => setIsSidebarCollapsed(prev => !prev)}
          onToggleRightDock={() => setIsRightDockCollapsed(prev => !prev)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenHotkeys={() => setIsHotkeysOpen(true)}
          onOpenPip={() => openFlightBridge()}
        />
      )}

      {/* =========================================================
          ROW 2: COMPACT STUDIO HEADER & TRANSPORT BAR (56px)
         ========================================================= */}
      <header className="h-14 shrink-0 border-b border-slate-200 dark:border-[#22262E] bg-white/95 dark:bg-[#090A0C]/95 backdrop-blur-md transition-colors z-40 flex items-center no-print font-sans">
        <div className="w-full px-4 md:px-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {!user ? (
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-slate-100 dark:bg-[#181B22] border border-slate-200 dark:border-[#2D333F] flex items-center justify-center">
                  <Mic className="text-[#0EA5E9]" size={15} />
                </div>
                <span className="font-mono font-bold text-sm tracking-wider text-slate-900 dark:text-white uppercase">KAIRON</span>
              </div>
            ) : (
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="flex items-center gap-2 min-w-0">
                  <h2 className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate max-w-[110px] sm:max-w-xs md:max-w-sm">
                    {displayProgram.title}
                  </h2>
                  {displayIsTimerActive ? (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#10B981]/10 border border-[#10B981]/30 text-[10px] font-mono font-bold text-[#10B981] shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-tally" />
                      LIVE
                    </span>
                  ) : (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[10px] font-mono font-bold text-[#F59E0B] shrink-0">
                      STANDBY
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Live Control Center & Header Timer */}
          {!isReadOnly && displayProgram.slots.length > 0 && (
            <div className="flex items-center gap-1 sm:gap-2 md:gap-3 bg-slate-50 dark:bg-[#121418] border border-slate-200 dark:border-[#22262E] px-1.5 sm:px-2.5 py-1 rounded-md shadow-sm shrink-0">
              <div className={`text-xs sm:text-sm md:text-base font-mono font-bold tabular-nums min-w-[45px] sm:min-w-[55px] md:min-w-[70px] text-center ${
                displayIsTimerActive 
                  ? (headerTimeLeft < 0 ? 'text-[#EF4444] animate-pulse' : 'text-[#10B981]') 
                  : 'text-slate-500 dark:text-[#8A93A4]'
              }`}>
                {currentHeaderSlot ? formatDuration(headerTimeLeft) : '00:00'}
              </div>

              <div className="w-[1px] h-3 sm:h-4 bg-slate-200 dark:bg-[#22262E]" />

              <div className="flex items-center gap-0.5 sm:gap-1">
                <button
                  onClick={() => handleToggleTimer(displayProgram, false, headerElapsed)}
                  className={`p-1 sm:p-1.5 rounded transition-all ${
                    displayIsTimerActive 
                      ? 'bg-slate-200 dark:bg-[#1C2028] text-slate-900 dark:text-white border border-slate-300 dark:border-[#2D333F]' 
                      : 'bg-[#10B981] text-white hover:bg-[#059669]'
                  }`}
                  title={displayIsTimerActive ? "Pause Timer" : "Start Event"}
                >
                  {displayIsTimerActive ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                </button>

                <button
                  onClick={() => handlePrev()}
                  disabled={displayCurrentSlotIndex === 0}
                  className={`hidden sm:inline-flex p-1 sm:p-1.5 rounded transition-all ${
                    displayCurrentSlotIndex === 0 
                      ? 'text-slate-300 dark:text-[#4B5563] cursor-not-allowed' 
                      : 'text-slate-600 dark:text-[#8A93A4] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#181B22]'
                  }`}
                  title="Previous Slot"
                >
                  <SkipBack size={12} />
                </button>

                <button
                  onClick={() => handleNext()}
                  disabled={displayCurrentSlotIndex === displayProgram.slots.length - 1}
                  className={`p-1 sm:p-1.5 rounded transition-all ${
                    displayCurrentSlotIndex === displayProgram.slots.length - 1 
                      ? 'text-slate-300 dark:text-[#4B5563] cursor-not-allowed' 
                      : 'text-slate-600 dark:text-[#8A93A4] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#181B22]'
                  }`}
                  title="Next Slot"
                >
                  <SkipForward size={12} />
                </button>

                {/* Nudge Controls */}
                <div className="hidden md:inline-flex items-center bg-slate-100 dark:bg-[#181B22] border border-slate-200 dark:border-[#22262E] rounded p-0.5 mx-0.5">
                  <button
                    onClick={() => handleNudge(-1)}
                    className="px-1.5 py-0.5 hover:bg-slate-200 dark:hover:bg-[#22262E] text-slate-600 dark:text-[#8A93A4] hover:text-slate-900 dark:hover:text-white rounded transition-all font-mono text-[10px] font-bold"
                    title="Nudge Down -1 min"
                  >
                    <Minus size={11} />
                  </button>
                  <button
                    onClick={() => handleNudge(1)}
                    className="px-1.5 py-0.5 hover:bg-slate-200 dark:hover:bg-[#22262E] text-slate-600 dark:text-[#8A93A4] hover:text-slate-900 dark:hover:text-white rounded transition-all font-mono text-[10px] font-bold"
                    title="Nudge Up +1 min"
                  >
                    <Plus size={11} />
                  </button>
                </div>

                <button
                  onClick={() => handleToggleHold()}
                  className={`p-1 sm:p-1.5 rounded transition-all ${
                    displayProgram.isOnHold 
                      ? 'bg-[#F59E0B] text-black' 
                      : 'text-slate-600 dark:text-[#8A93A4] hover:text-[#F59E0B] hover:bg-slate-100 dark:hover:bg-[#181B22]'
                  }`}
                  title="Toggle Hold"
                >
                  <Clock size={12} />
                </button>

                <div className="w-[1px] h-4 bg-slate-200 dark:bg-[#22262E] mx-0.5 hidden sm:block" />

                <button
                  onClick={() => handleToggleManualMode()}
                  className={`hidden sm:flex items-center gap-1.5 px-2 py-1 rounded transition-all ${
                    displayProgram.isManualMode
                      ? 'bg-slate-100 dark:bg-[#181B22] text-[#0EA5E9] border border-slate-300 dark:border-[#2D333F]'
                      : 'text-slate-600 dark:text-[#8A93A4] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#181B22]'
                  }`}
                  title={displayProgram.isManualMode ? "Manual Mode (Manual Advance)" : "Auto-Advance Mode (Continuous)"}
                >
                  {displayProgram.isManualMode ? <MousePointerClick size={12} /> : <Zap size={12} />}
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider hidden lg:block">
                    {displayProgram.isManualMode ? 'MAN' : 'AUTO'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Crew Tactical HUD Readiness Indicators */}
          {currentHeaderSlot && (
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-[#121418] border border-slate-200 dark:border-[#22262E] rounded-md font-mono text-[10px] shadow-sm shrink-0" title="Crew Tactical HUD Live Readiness">
              <span className="text-slate-400 dark:text-[#6A7382] uppercase mr-0.5 text-[9px]">CREW:</span>
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${isSoundAcked ? 'bg-[#10B981]/15 text-[#10B981] font-bold' : 'text-slate-400 dark:text-[#6A7382]'}`} title={isSoundAcked ? "Sound Team: Ready" : "Sound Team: Standby"}>
                <Volume2 size={11} />
                <span>S</span>
                {isSoundAcked && <span className="w-1 h-1 rounded-full bg-[#10B981]" />}
              </span>
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${isLightsAcked ? 'bg-[#10B981]/15 text-[#10B981] font-bold' : 'text-slate-400 dark:text-[#6A7382]'}`} title={isLightsAcked ? "Lighting Team: Ready" : "Lighting Team: Standby"}>
                <Lightbulb size={11} />
                <span>L</span>
                {isLightsAcked && <span className="w-1 h-1 rounded-full bg-[#10B981]" />}
              </span>
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${isVideoAcked ? 'bg-[#10B981]/15 text-[#10B981] font-bold' : 'text-slate-400 dark:text-[#6A7382]'}`} title={isVideoAcked ? "Video Team: Ready" : "Video Team: Standby"}>
                <Video size={11} />
                <span>V</span>
                {isVideoAcked && <span className="w-1 h-1 rounded-full bg-[#10B981]" />}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Post-Event Analytics Report Button */}
            {displayProgram?.id && (
              <button
                onClick={() => navigate(`/analytics/${displayProgram.id}`)}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-[#121418] hover:bg-slate-100 dark:hover:bg-[#181B22] border border-slate-200 dark:border-[#22262E] text-amber-600 dark:text-[#F59E0B] rounded text-xs font-mono font-semibold transition-all shadow-sm"
                title="View Event Report & Analytics"
              >
                <BarChart3 size={13} />
                <span>Report</span>
              </button>
            )}

            {/* End Event / Stop Button (Protected Hold Confirmation) */}
            {displayIsTimerActive && (
              <HoldToConfirmButton
                durationMs={2000}
                onConfirm={() => handleEndEvent(displayProgram.id)}
                onQuickClick={() => requestEndEventConfirmation(displayProgram.id)}
                label="End"
                holdingLabel="Hold"
                className="px-2 py-1 text-xs font-mono font-semibold"
                title="Click to confirm or hold 2s to end live session"
              />
            )}

            {/* Network Status Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-slate-50 dark:bg-[#121418] border border-slate-200 dark:border-[#22262E] rounded text-[10px] font-mono text-slate-600 dark:text-[#8A93A4]">
              {isOnline ? <Wifi size={11} className="text-[#10B981]" /> : <WifiOff size={11} className="text-[#F59E0B]" />}
              <span className="hidden md:inline">{isOnline ? 'ONLINE' : 'LOCAL RELAY'}</span>
            </div>

            {isBoothMode && (
              <button
                onClick={handleSignOut}
                className="hidden sm:flex items-center gap-1 px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer"
                title="Currently in Offline Guest Booth Mode. Click to sign in to your account for cloud sync."
              >
                <span>GUEST BOOTH</span>
              </button>
            )}

            {!isReadOnly && (
              <button
                onClick={toggleTheme}
                className="hidden sm:inline-flex p-1.5 bg-slate-50 dark:bg-[#121418] hover:bg-slate-100 dark:hover:bg-[#181B22] border border-slate-200 dark:border-[#22262E] text-slate-600 dark:text-[#8A93A4] hover:text-slate-900 dark:hover:text-white rounded transition-colors"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
              </button>
            )}

            <button
              onClick={() => setIsHotkeysOpen(true)}
              className="hidden sm:inline-flex p-1.5 bg-slate-50 dark:bg-[#121418] hover:bg-slate-100 dark:hover:bg-[#181B22] border border-slate-200 dark:border-[#22262E] text-slate-600 dark:text-[#8A93A4] hover:text-slate-900 dark:hover:text-white rounded transition-colors"
              title="Broadcast Hotkeys Reference (?)"
            >
              <Keyboard size={14} />
            </button>

            {user && (
              <button
                onClick={() => setIsIntegrationsOpen(true)}
                className="hidden sm:inline-flex p-1.5 bg-slate-50 dark:bg-[#121418] hover:bg-slate-100 dark:hover:bg-[#181B22] border border-slate-200 dark:border-[#22262E] text-slate-600 dark:text-[#8A93A4] hover:text-[#0EA5E9] rounded transition-colors"
                title="Broadcast Integrations (OBS, vMix, ATEM, ProPresenter 7)"
              >
                <Layers size={14} />
              </button>
            )}

            {canControlLive && (
              <button
                onClick={() => openFlightBridge()}
                className={`hidden sm:inline-flex p-1.5 rounded border transition-colors ${
                  (pipWindow || isFloatingBridgeOpen)
                    ? 'bg-[#0EA5E9]/20 border-[#0EA5E9] text-[#0EA5E9]' 
                    : 'bg-slate-50 dark:bg-[#121418] border-slate-200 dark:border-[#22262E] text-slate-600 dark:text-[#8A93A4] hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Toggle Floating Flight Bridge (PiP / HUD)"
              >
                <AppWindow size={14} />
              </button>
            )}

            {!isReadOnly && user && (
              <button
                onClick={() => setIsExportOpen(true)}
                className="inline-flex p-1.5 bg-slate-50 dark:bg-[#121418] hover:bg-slate-100 dark:hover:bg-[#181B22] border border-slate-200 dark:border-[#22262E] text-slate-600 dark:text-[#8A93A4] hover:text-slate-900 dark:hover:text-white rounded transition-colors"
                title="Export Schedule"
              >
                <Download size={14} />
              </button>
            )}

            {user && (
              <button
                onClick={() => setIsRightDockCollapsed(prev => !prev)}
                className={`hidden lg:inline-flex p-1.5 rounded border transition-colors ${
                  !isRightDockCollapsed
                    ? 'bg-[#0EA5E9]/15 border-[#0EA5E9]/40 text-[#0EA5E9]'
                    : 'bg-slate-50 dark:bg-[#121418] border-slate-200 dark:border-[#22262E] text-slate-600 dark:text-[#8A93A4] hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Toggle Right Studio Dock (Ctrl+\)"
              >
                <PanelRight size={14} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* =========================================================
          ROW 3: 3-ZONE STUDIO WORKSPACE (LEFT RAIL | CENTER CANVAS | RIGHT DOCK)
         ========================================================= */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* ZONE A: Left Navigation Rail */}
        {user && (
          <Sidebar
            activeOrg={activeOrg}
            userOrganizations={userOrganizations}
            setActiveOrgId={setActiveOrgId}
            profile={profile}
            user={user}
            onProfileUpdate={setProfile}
            handleSignOut={handleSignOut}
            isOnline={isOnline}
            programTitle={displayProgram.title}
            programId={displayProgram.id}
            editorProgramId={program.id}
            activeSessions={activeSessions}
            selectedLiveId={selectedLiveId}
            onSelectLive={setSelectedLiveId}
            isCollapsed={isSidebarCollapsed}
            onToggle={setIsSidebarCollapsed}
            onCreateOrg={() => setIsOnboardingManual(true)}
            onStopAllSessions={handleStopAllSessions}
          />
        )}

        {user && !isBoothMode && (userOrganizations.length === 0 || isOnboardingManual) && !effectiveAuthLoading && !loadingOrgs && (
          <OnboardingOverlay
            userId={user.id}
            userEmail={user.email || ''}
            onClose={userOrganizations.length > 0 || isOnboardingManual ? () => setIsOnboardingManual(false) : undefined}
            onOrgCreated={(newOrg) => {
              queryClient.invalidateQueries({ queryKey: ['myOrganizations', user?.id] });
              setActiveOrgId(newOrg.id);
              setIsOnboardingManual(false);
              navigate('/');
            }}
          />
        )}

        {promptMessage && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xl px-4 animate-in slide-in-from-top-4 duration-500">
            <div className="bg-rose-600 text-white py-4 px-8 rounded-2xl shadow-2xl flex items-center gap-4 border-2 border-white/20 backdrop-blur-xl">
              <Bell className="animate-bounce" size={24} />
              <span className="text-xl font-bold uppercase tracking-tight">{promptMessage.text}</span>
            </div>
          </div>
        )}

        {/* ZONE B: Center Primary Canvas */}
        <main className="flex-1 min-w-0 overflow-y-auto pb-36 lg:pb-8 relative custom-scrollbar">
          {/* Venue Dock (Pill Switcher) */}
          <VenueDock 
            activeSessions={activeSessions}
            selectedLiveId={selectedLiveId}
            onSelect={setSelectedLiveId}
          />
          <div className="max-w-7xl mx-auto px-4 pb-4 pt-1 md:p-6 h-full">
            {effectiveAuthLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : null}

            <ConfirmationModal
              isOpen={isInterlockOpen}
              title="Concurrent Event Detected"
              message="Another event is currently live. Would you like to start this as an additional concurrent session, or replace the existing one?"
              confirmText="Start Concurrent"
              cancelText="Replace Current"
              onConfirm={() => handleConfirmStart('concurrent')}
              onClose={() => setIsInterlockOpen(false)}
              onAction={() => handleConfirmStart('replace')}
              type="warning"
            />

            {!user && !isBoothMode ? (
              <Auth inviteDetails={effectiveInviteDetails} />
            ) : (
              <Routes>
                <Route path="/org" element={
                  <OrganizationManager
                    userId={user.id}
                    activeOrgId={activeOrgId ?? undefined}
                    onSelect={setActiveOrgId}
                  />
                } />

                <Route path="/guide" element={<UserGuide />} />

                {/* Main Views */}
                <Route path="/" element={
                  <HomeWrapper
                    activeOrgId={activeOrgId ?? undefined}
                    activeProgramId={program.id}
                    activeSessions={activeSessions}
                    loadProgram={loadProgram}
                    createProgram={createProgram}
                    deleteProgram={deleteProgram}
                    duplicateProgram={duplicateProgram}
                    onTurnaround={handleTurnaroundProgram}
                    onPlay={handlePlayProgram}
                    mode={mode}
                  />
                } />

                <Route path="/calendar" element={
                  <CalendarWrapper
                    activeOrgId={activeOrgId ?? undefined}
                    activeProgramId={program.id}
                    activeSessions={activeSessions}
                    loadProgram={loadProgram}
                    createProgram={createProgram}
                    deleteProgram={deleteProgram}
                    duplicateProgram={duplicateProgram}
                    onPlay={handlePlayProgram}
                    mode={mode}
                  />
                } />

                <Route path="/admin" element={
                  activeOrg ? (
                    <AdminPanel organization={activeOrg} currentUserRole={userRole} currentUser={user} />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4">
                      <Building size={48} className="opacity-20" />
                      <p>Select a workspace from the sidebar to manage settings.</p>
                    </div>
                  )
                } />

                <Route path="/monitors" element={
                  <MonitorDashboard
                    program={displayProgram}
                    activeOrg={activeOrg}
                    onLaunchFlightBridge={() => openFlightBridge()}
                    isFlightBridgeSupported={isFlightBridgeSupported}
                    isPro={isPro}
                    displayStatuses={displayStatuses}
                  />
                } />

                <Route path="/command" element={
                  <CommandCenter
                    programs={programs}
                    activeSessions={activeSessions}
                    onToggleTimer={(p) => handleToggleTimer(p)}
                    onNext={handleNext}
                    onPrev={handlePrev}
                    onNudge={handleNudge}
                    onSelectProgram={handleSelectProgramFromCommand}
                  />
                } />

                <Route path="/analytics/:id" element={<AnalyticsWrapper onUpdateSlot={handleUpdateSlot} />} />

                <Route path="/live" element={
                  <LiveTimer
                    program={displayProgram}
                    currentSlotIndex={displayCurrentSlotIndex}
                    isTimerActive={displayIsTimerActive}
                    timerStartTimestamp={displayTimerStartTimestamp}
                    secondsElapsed={displaySecondsElapsed}
                    onToggleTimer={handleToggleTimer}
                    onToggleHold={handleToggleHold}
                    onNext={handleNext}
                    onPrev={handlePrev}
                    onEndEvent={(id) => handleEndEvent(id || displayProgram.id)}
                    onRequestEndEvent={(id) => requestEndEventConfirmation(id || displayProgram.id)}
                    onNudge={handleNudge}
                    readOnly={!canControlLive}
                    isAutopilotEnabled={isAutopilotEnabled}
                    onToggleAutopilot={handleToggleAutopilot}
                  />
                } />

                <Route path="/list" element={
                  <ScheduleList
                    program={displayProgram}
                    currentSlotIndex={displayCurrentSlotIndex}
                    timerStartTimestamp={displayTimerStartTimestamp}
                    isTimerActive={displayIsTimerActive}
                    readOnly={isReadOnly}
                  />
                } />
                <Route path="/editor" element={
                  <ProgramEditor
                    program={program}
                    isReadOnly={isReadOnly}
                    isCoEditor={isCoEditor}
                    isAdminOnline={isAdminOnline}
                    isTimerActive={isTimerActive}
                    currentSlotIndex={currentSlotIndex}
                    isPro={isPro}
                    isAutopilotEnabled={isAutopilotEnabled}
                    onToggleAutopilot={handleToggleAutopilot}
                    onTurnaround={() => handleTurnaroundProgram(program.id)}
                    onEndEvent={(id) => requestEndEventConfirmation(id || program.id)}
                    onNudge={handleNudge}
                    selectedSlotId={selectedSlotId}
                    onSelectSlotId={setSelectedSlotId}
                    onSaveKaironFile={() => void handleSaveKaironFile(program)}
                    onOpenKaironFile={() => void handleOpenKaironFile()}
                    onUpdate={(p) => {
                      if ((p as any)._triggerRebalance) {
                        handleAiRebalance(p);
                        return;
                      }

                      // ACTIVE SLOT UUID STABILITY:
                      const activeSlotId = program.slots[currentSlotIndex]?.id;
                      if (activeSlotId && p.slots.length > 0) {
                        const newActiveIdx = p.slots.findIndex(s => s.id === activeSlotId);
                        if (newActiveIdx !== -1 && newActiveIdx !== currentSlotIndex) {
                          setCurrentSlotIndex(newActiveIdx);
                          if (p.status === 'live') {
                            timerSaveMutation.mutate({
                              id: p.id,
                              currentSlotIndex: newActiveIdx,
                              isTimerActive,
                              secondsElapsed,
                              timerStartTimestamp
                            });
                          }
                        } else if (newActiveIdx === -1) {
                          const clampedIdx = Math.max(0, Math.min(currentSlotIndex, p.slots.length - 1));
                          setCurrentSlotIndex(clampedIdx);
                          if (p.status === 'live') {
                            timerSaveMutation.mutate({
                              id: p.id,
                              currentSlotIndex: clampedIdx,
                              isTimerActive,
                              secondsElapsed,
                              timerStartTimestamp
                            });
                          }
                        }
                      }

                      updateLocalProgram(p);
                      if (p.slots.length === 0) {
                        setCurrentSlotIndex(0);
                        setSecondsElapsed(0);
                        setIsTimerActive(false);
                      }
                    }}
                  />
                } />
              </Routes>
            )}
          </div>
        </main>

        {/* ZONE C: Collapsible Right Studio Dock (Live Output Preview + Context Inspector / Stage Cues) */}
        {user && (
          <StudioRightDock
            isOpen={!isRightDockCollapsed}
            onClose={() => setIsRightDockCollapsed(true)}
            program={displayProgram}
            editorProgram={program}
            currentSlotIndex={displayCurrentSlotIndex}
            isTimerActive={displayIsTimerActive}
            selectedSlotId={selectedSlotId}
            onSelectSlotId={setSelectedSlotId}
            isReadOnly={isReadOnly}
            onUpdateEditorProgram={(updated) => updateLocalProgram(updated)}
            onToggleHold={() => handleToggleHold()}
            onOpenIntegrations={() => setIsIntegrationsOpen(true)}
            onSaveKaironFile={(p) => void handleSaveKaironFile(p)}
            onPlayProgram={(p) => handlePlayProgram(p)}
            isSoundAcked={isSoundAcked}
            isLightsAcked={isLightsAcked}
            isVideoAcked={isVideoAcked}
          />
        )}

        {/* AI Suggestion Toast */}
        {aiSuggestion && (
          <div className="fixed bottom-10 right-10 z-[60] w-full max-w-md animate-in slide-in-from-right-8 duration-500">
            <div className="bg-indigo-600 dark:bg-indigo-500 text-white p-6 rounded-3xl shadow-2xl flex items-start gap-4">
              <div className="bg-white/20 p-2 rounded-xl">
                <Sparkles size={24} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-lg mb-1">AI Insight</h4>
                <p className="text-indigo-50 text-sm leading-relaxed">{aiSuggestion}</p>
              </div>
              <button
                onClick={() => setAiSuggestion(null)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        )}

        {isAiLoading && (
          <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-500/20 rounded-full animate-pulse" />
                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-500 animate-bounce" size={32} />
              </div>
              <p className="font-bold text-slate-900 dark:text-white">Consulting AI...</p>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================
          ROW 4: BOTTOM STUDIO STATUS & TELEMETRY BAR (24px, lg:flex)
         ========================================================= */}
      {user && (
        <StudioStatusBar
          isOnline={isOnline}
          saveStatus={saveStatus}
          isAutopilotEnabled={isAutopilotEnabled}
          onToggleAutopilot={() => handleToggleAutopilot()}
          connectedDisplayCount={Math.max(screens.length - 1, Object.keys(displayStatuses).length)}
          lastArchivedPath={lastDiskArchiveAt}
          isSoundAcked={isSoundAcked}
          isLightsAcked={isLightsAcked}
          isVideoAcked={isVideoAcked}
        />
      )}

      <ExportDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        program={exportTargetProgram}
        options={exportOptions}
        setOptions={setExportOptions}
        activeOrg={activeOrg}
      />

      {!location.pathname.startsWith('/analytics') && (
        <PrintableSchedule
          program={exportTargetProgram}
          includeDetails={exportOptions.includeDetails}
          includeSpeakers={exportOptions.includeSpeakers}
          includePrompter={exportOptions.includePrompter}
          activeOrg={activeOrg}
        />
      )}

      <ConfirmationModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />

      <BroadcastHotkeysModal
        isOpen={isHotkeysOpen}
        onClose={() => setIsHotkeysOpen(false)}
      />

      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        program={displayProgram}
        isTimerActive={displayIsTimerActive}
        onToggleTimer={() => handleToggleTimer()}
        onNextSlot={() => handleNext()}
        onPrevSlot={() => handlePrev()}
        onToggleHold={() => handleToggleHold()}
        onSaveKaironFile={() => void handleSaveKaironFile()}
        onOpenKaironFile={() => void handleOpenKaironFile()}
        onExportCsv={() => downloadProgramCsv(exportTargetProgram)}
        onApplyTemplate={(tmplId) => {
          const tmpl = PRODUCTION_TEMPLATES.find(t => t.id === tmplId);
          if (!tmpl) return;
          const newSlots: Slot[] = tmpl.slots.map((s, idx) => ({
            id: `slot-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
            title: s.title,
            speaker: s.speaker,
            durationMinutes: s.durationMinutes,
            type: s.type as SlotType,
            details: s.details || '',
            productionNotes: s.productionNotes || '',
            prompterText: s.prompterText || '',
          }));
          updateLocalProgram(prev => ({
            ...prev,
            title: prev.title === 'New Event' ? tmpl.name : prev.title,
            startTime: tmpl.startTime,
            slots: newSlots,
          }));
          if (newSlots.length > 0) setSelectedSlotId(newSlots[0].id);
          navigate('/editor');
        }}
        onOpenIntegrations={() => setIsIntegrationsOpen(true)}
      />

      <BroadcastIntegrationsModal
        isOpen={isIntegrationsOpen}
        onClose={() => setIsIntegrationsOpen(false)}
        program={displayProgram}
      />

      {pipWindow && createPortal(
        <FlightBridge
          program={displayProgram}
          currentSlotIndex={displayCurrentSlotIndex}
          isTimerActive={displayIsTimerActive}
          timerStartTimestamp={displayTimerStartTimestamp}
          secondsElapsed={headerElapsed}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
          onToggleTimer={handleToggleTimer}
          onToggleHold={handleToggleHold}
          onNext={handleNext}
          onPrev={handlePrev}
          onNudge={handleNudge}
          onEndEvent={handleEndEvent}
          onRequestEndEvent={requestEndEventConfirmation}
          isManualMode={displayProgram.isManualMode}
          onToggleManualMode={handleToggleManualMode}
        />,
        pipWindow.document.body
      )}

      {/* In-App Floating Flight Bridge HUD for Web Browsers without Document PiP */}
      {!isElectronRuntime && !pipWindow && isFloatingBridgeOpen && (displayProgram && displayProgram.slots.length > 0) && (
        <div 
          style={hudPos ? { left: `${hudPos.x}px`, top: `${hudPos.y}px`, right: 'auto', bottom: 'auto' } : undefined}
          className={`fixed ${!hudPos ? 'bottom-6 right-6' : ''} z-[9999] shadow-2xl rounded-2xl overflow-hidden border border-slate-300 dark:border-[#22262E] w-[380px] max-w-[calc(100vw-32px)] ${isDraggingHud ? 'select-none pointer-events-auto shadow-emerald-500/10' : 'transition-all animate-in fade-in duration-150'}`}
        >
          <div 
            onPointerDown={handleHudPointerDown}
            onPointerMove={handleHudPointerMove}
            onPointerUp={handleHudPointerUp}
            onPointerCancel={handleHudPointerUp}
            className={`flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-slate-400 text-xs font-mono select-none ${isDraggingHud ? 'cursor-grabbing bg-slate-950' : 'cursor-grab hover:bg-slate-800/80'}`}
            title="Drag to reposition HUD anywhere on screen"
          >
            <span className="flex items-center gap-1.5 font-bold text-[10px] tracking-wider text-slate-300 pointer-events-none">
              <GripHorizontal size={14} className="text-slate-500" />
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              FLIGHT BRIDGE HUD
            </span>
            <div className="flex items-center gap-1">
              {hudPos && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setHudPos(null);
                    localStorage.removeItem('kairon_flight_bridge_pos');
                  }}
                  className="px-1.5 py-0.5 text-[9px] text-slate-500 hover:text-slate-300 transition-colors rounded"
                  title="Reset to default bottom-right position"
                >
                  Snap
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  closeFlightBridge();
                }}
                className="p-1 hover:text-white transition-colors"
                title="Close Flight Bridge"
              >
                <X size={14} />
              </button>
            </div>
          </div>
          <FlightBridge
            program={displayProgram}
            currentSlotIndex={displayCurrentSlotIndex}
            isTimerActive={displayIsTimerActive}
            timerStartTimestamp={displayTimerStartTimestamp}
            secondsElapsed={headerElapsed}
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
            onToggleTimer={handleToggleTimer}
            onToggleHold={handleToggleHold}
            onNext={handleNext}
            onPrev={handlePrev}
            onNudge={handleNudge}
            onEndEvent={handleEndEvent}
            onRequestEndEvent={requestEndEventConfirmation}
            isManualMode={displayProgram.isManualMode}
            onToggleManualMode={handleToggleManualMode}
          />
        </div>
      )}

      {canControlLive && (displayProgram && displayProgram.slots.length > 0) && !pipWindow && !isFloatingBridgeOpen && (
        <MobileFlightBridge
          program={displayProgram}
          currentSlotIndex={displayCurrentSlotIndex}
          timerStartTimestamp={displayTimerStartTimestamp}
          isTimerActive={displayIsTimerActive}
          secondsElapsed={displaySecondsElapsed}
          isAdminOnline={isAdminOnline}
          onToggleTimer={handleToggleTimer}
          onNextSlot={() => handleNext(displayProgram.id)}
          onPrevSlot={() => handlePrev(displayProgram.id)}
          onToggleManualMode={() => handleToggleManualMode(displayProgram.id)}
          onToggleHold={() => handleToggleHold(undefined, displayProgram.id)}
          onNudge={handleNudge}
          onEndEvent={() => handleEndEvent(displayProgram.id)}
          onViewAnalysis={(id) => navigate(`/analytics/${id}`)}
        />
      )}

      {user && (
        <MobileNav
          activeOrg={activeOrg}
          profile={profile}
          user={user}
          onSignOut={handleSignOut}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
          organizations={userOrganizations}
          onSelectOrg={setActiveOrgId}
          editorProgramId={program.id}
          liveProgramId={displayProgram.id}
        />
      )}

      {/* Hidden Browser File Input for .kairon & .csv */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".kairon,.json,.csv"
        onChange={handleBrowserFileChange}
        className="hidden"
      />
    </div>
  );
};

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AppErrorBoundary extends Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false, error: null };

  constructor(props: { children: React.ReactNode }) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[Kairon ErrorBoundary] Caught render error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#090A0C] flex flex-col items-center justify-center p-8 text-center font-sans">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-6">
            <span className="text-2xl text-amber-500">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Something interrupted Kairon Studio</h2>
          <p className="text-[#8A93A4] text-sm max-w-md mb-6 leading-relaxed">
            {this.state.error?.message || "An unexpected error occurred while rendering the studio interface."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-xs font-mono font-bold uppercase tracking-wider transition-all"
            >
              Reload Studio
            </button>
            <button
              onClick={() => {
                try {
                  localStorage.setItem('kairon_booth_mode', 'true');
                  window.location.reload();
                } catch {}
              }}
              className="px-5 py-2.5 rounded-xl bg-[#181B22] hover:bg-[#22262E] text-[#8A93A4] hover:text-white border border-[#22262E] text-xs font-mono font-bold uppercase tracking-wider transition-all"
            >
              Launch Offline Booth Mode
            </button>
            <button
              onClick={() => {
                try {
                  localStorage.removeItem('kairon_booth_mode');
                  sessionStorage.clear();
                  window.location.href = '/';
                } catch {}
              }}
              className="px-5 py-2.5 rounded-xl bg-transparent hover:bg-red-500/10 text-red-400 text-xs font-mono font-bold uppercase tracking-wider transition-all"
            >
              Clear Session & Reset
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <ConvexAuthProvider client={convex}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppErrorBoundary>
            <AppContent />
          </AppErrorBoundary>
        </BrowserRouter>
      </QueryClientProvider>
    </ConvexAuthProvider>
  );
};

export default App;