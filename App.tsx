import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { BrowserRouter, Routes, Route, NavLink, useNavigate, useLocation, useSearchParams, Navigate, useParams } from 'react-router-dom';
import { Mic, Edit3, Play, ClipboardList, Calendar as CalendarIcon, Home, Sun, Moon, Share2, Copy, Check, X, AlertTriangle, FileText, Download, User, User as UserIcon, AlignLeft, QrCode, Clipboard, Wifi, WifiOff, Sparkles, Zap, CheckCircle, MousePointerClick, UserPlus, ExternalLink, Tv, AppWindow, SkipBack, SkipForward, Pause, Clock, Monitor, Building, MessageSquare, Bell, Crown } from 'lucide-react';
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Services
import { ConvexAuthProvider, useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery as useConvexQuery, useMutation as useConvexMutation } from "./hooks/useConvexMock";
import { api } from "./convex/_generated/api";
import { convex } from "./services/convexClient";
import { getPrograms, getProgramById, createProgram as createProgramService, updateProgram as updateProgramService, deleteProgram as deleteProgramService, updateTimerState as updateTimerStateService, transformProgram } from './services/programService';
import { getProfile } from './services/authService';
import { getMyOrganizations, checkPendingInvites, getInviteDetails } from './services/orgService';
import { rebalanceSchedule } from './services/geminiService';

// Store & Hooks
import { useUIStore } from './store/uiStore';
import { useStageMessages } from './hooks/useStageMessages';
import { useWakeLock } from './hooks/useWakeLock';
import { useFlightBridge } from './hooks/useFlightBridge';
import { useTimerSync } from './hooks/useTimerSync';

// Components
import { FlightBridge } from './components/FlightBridge';

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
import { MobileFlightBridge } from './components/MobileFlightBridge';

import { MobileNav } from './components/MobileNav';

// Utils & Types
import { Program, Slot, SlotType, Profile, Organization, TimerState } from './types';
import { timeToMinutes, minutesToTime, formatDuration } from './utils/time';
import { encodeProgramData, decodeProgramData } from './utils/encoding';
import { getInitialProgram } from './utils/constants';

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
  const flexTypes = ['break', 'transition', 'announcements', 'buffer', 'music', 'worship'];
  const remainingFlexSlots = newSlots.slice(currentSlotIndex + 1).filter(s => 
    flexTypes.includes((s.type || '').toLowerCase())
  );

  for (let s of remainingFlexSlots) {
    if (absorbed >= minutesToAbsorb) break;
    const currentDuration = s.durationMinutes;
    const maxShave = Math.max(0, currentDuration - 1); // keep at least 1 min
    const shave = Math.min(minutesToAbsorb - absorbed, maxShave);
    if (shave > 0) {
      s.durationMinutes -= shave;
      absorbed += shave;
    }
  }

  // Step 2: If we still need to absorb time, shave from other slots down to 1 minute
  if (absorbed < minutesToAbsorb) {
    const remainingOtherSlots = newSlots.slice(currentSlotIndex + 1).filter(s => 
      !flexTypes.includes((s.type || '').toLowerCase())
    );
    
    for (let s of remainingOtherSlots) {
      if (absorbed >= minutesToAbsorb) break;
      const currentDuration = s.durationMinutes;
      const maxShave = Math.max(0, currentDuration - 1); // keep at least 1 min
      const shave = Math.min(minutesToAbsorb - absorbed, maxShave);
      if (shave > 0) {
        s.durationMinutes -= shave;
        absorbed += shave;
      }
    }
  }

  return newSlots;
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
          if (now - value.timestamp > 3000) {
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
  const [program, setProgram] = useState<Program>(() => getInitialProgram());
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
  const { pipWindow, isSupported: isFlightBridgeSupported, openFlightBridge } = useFlightBridge();
  const { signOut } = useAuthActions();
  const convexUser = useConvexQuery(
    api.authQueries.getCurrentUser,
    isAuthenticated ? {} : "skip"
  );

  // Derive a simple user object compatible with existing code
  const user = isAuthenticated && convexUser
    ? { id: convexUser.id as string, email: convexUser.email as string | undefined }
    : null;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);

  // --- Permissions & Membership ---
  // Fetch membership for current user in active org
  const myMembership = useConvexQuery(
    api.members.getMyMembershipInOrg,
    activeOrgId && isAuthenticated ? { organizationId: activeOrgId as any } : "skip"
  );

  const userRole = myMembership?.role; // 'admin', 'manager', 'operator'

  // Permissions Logic
  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';
  const isOperator = userRole === 'operator';

  // 1. URL-based overrides (purely aesthetic for Admins/Managers)
  const isUrlReadOnly = mode === 'viewer' || mode === 'ReadOnly';

  // 2. Auth Resolution (Wait for Convex to settle)
  const isAuthResolved = !isConvexAuthLoading && (!isAuthenticated || (isAuthenticated && myMembership !== undefined));

  // 3. Permission Evaluation (POWER-BASED)
  // Admins and Managers are NEVER restricted by mode, unless they choose to be viewers.
  useEffect(() => {
    document.title = "Kairon - Production Timer";
  }, []);

  const isReadOnly = !isAuthResolved ? false : (
    program.status === 'archived' || (
      (isAdmin || isManager)
        ? (mode === 'viewer') 
        : true // Operators and Guests are read-only for structural edits
    )
  );

  const canControlLive = isAdmin || isManager || isOperator;
  const isCoEditor = isAdmin || isManager || (mode === 'coeditor');

  const isReadOnlyRef = React.useRef(isReadOnly);
  useEffect(() => {
    isReadOnlyRef.current = isReadOnly;
  }, [isReadOnly]);

  const isPro = activeOrg?.subscriptionStatus === 'pro';
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [isDataHydrated, setIsDataHydrated] = useState(false);
  const [authRetryCount, setAuthRetryCount] = useState(0);

  const retryAuth = () => {
    setIsAuthLoading(true);
    setNetworkError(null);
    setAuthRetryCount(prev => prev + 1);
  };

  // Fetch all organizations for the user
  const { data: userOrganizations = [], isLoading: loadingOrgs } = useQuery<Organization[]>({
    queryKey: ['myOrganizations', user?.id],
    queryFn: () => getMyOrganizations(user?.id || ''),
    enabled: !!user
  });

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

  const [isOnline, setIsOnline] = useState(window.navigator.onLine);
  const [isOnboardingManual, setIsOnboardingManual] = useState(false);
  const [isAutopilotEnabled, setIsAutopilotEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('kairon_autopilot_enabled') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleAutopilot = (enabled: boolean) => {
    setIsAutopilotEnabled(enabled);
    try {
      localStorage.setItem('kairon_autopilot_enabled', String(enabled));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setNetworkError(null);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setNetworkError("Your device is offline. Kairon requires an active internet connection to sync.");
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
  }, []);

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
            const joinedOrgs = await checkPendingInvites();
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
  }, [user?.id, isAuthenticated, isConvexAuthLoading, checkPendingInvites, queryClient]);


  const loadProfile = async (userId: string) => {
    const p = await getProfile(userId);
    setProfile(p);
  };

  useWakeLock(isTimerActive);

  const { clearStageMessage } = useStageMessages(program.id);

  const handleSignOut = async () => {
    // useAuthActions hook handles sign out in components that need to trigger it
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
  
  const activeSessionsRaw = useConvexQuery(
    api.programs.getActiveSessions, 
    activeOrgId ? { organizationId: activeOrgId as any } : "skip"
  );

  const activeSessions = useMemo(() => {
    if (!activeSessionsRaw) return [];
    return activeSessionsRaw.map(s => ({
      ...s,
      // CRITICAL: Force string normalization for ID comparisons (prevents object-vs-string mismatch)
      id: String(s._id || s.id)
    })) as Program[];
  }, [activeSessionsRaw]);

  const allProgramsRaw = useConvexQuery(
    api.programs.getPrograms,
    activeOrgId ? { organizationId: activeOrgId as any } : "skip"
  );

  const programs = useMemo(() => {
    if (!allProgramsRaw) return [];
    return allProgramsRaw.map(s => ({
      ...s,
      id: String(s._id || s.id)
    })) as Program[];
  }, [allProgramsRaw]);

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
  const isTargetSameAsLocal = isLiveEventActive && (String(globalLiveProgram?.id) === String(program.id) || String(globalLiveProgram?.id) === String(selectedLiveId));

  const displayProgram = isLiveEventActive ? globalLiveProgram! : program;
  const displayCurrentSlotIndex = isLiveEventActive ? (globalLiveProgram?.currentSlotIndex ?? 0) : currentSlotIndex;
  
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
  const fetchedProgram = fetchedProgramRaw ? {
    ...(fetchedProgramRaw as any),
    id: String((fetchedProgramRaw as any)._id || (fetchedProgramRaw as any).id)
  } as Program : undefined;

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
        const fetchedUuidClean = fetchedProgram.uuid?.replace('local-', '');
        const fetchedSlugClean = fetchedProgram.slug?.replace('local-', '');
        
        if (urlId) {
          const matchesUrl = fetchedProgram.id === urlId || 
            (urlIdClean && (fetchedUuidClean === urlIdClean || fetchedSlugClean === urlIdClean));
          if (!matchesUrl) {
            return;
          }
        }

        const currentProg = programRef.current;
        const isSameProgram = fetchedProgram.id === currentProg.id || 
          (currentProg.id?.startsWith('local-') && 
            (fetchedProgram.uuid === currentProg.id.replace('local-', '') || 
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
            lastSavedProgramRef.current = { ...lastSavedProgramRef.current, id: fetchedProgram.id };
          }
          setProgram(prev => ({ ...prev, id: fetchedProgram.id }));
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

          // SANITY CHECK: If not live OR the start timestamp is "stale" (e.g., from more than 4 hours ago), timer MUST be inactive
          const isStale = isLive && fetchedProgram.timerStartTimestamp && (Date.now() - fetchedProgram.timerStartTimestamp > 4 * 60 * 60 * 1000);

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

      // 3. Offline Deep Recovery Fallback (Deprecated)
      // Convex is now the single source of truth.
    };

    hydrate();
  }, [importData, fetchedProgram, searchParams, saveStatus]);

  // Persistence (Convex)
  const mutation = useMutation({
    mutationFn: async (p: Program): Promise<Program | void> => {
      // Broadcast local offline state sync across tabs immediately
      try {
        const channel = new BroadcastChannel('kairon_offline_sync');
        channel.postMessage({
          id: p.id,
          program: p
        });
        channel.close();
      } catch (err) {
        console.error("Local BroadcastChannel sync failed:", err);
      }

      // Only attempt creation if it's a local-prefixed ID
      if (p.id?.startsWith('local-')) {
        return await createProgramService(p);
      }

      // Otherwise, it's already a Convex program, just update it
      return await updateProgramService(p);
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

      const isTestBypass = typeof window !== 'undefined' && (window.location.search.includes('testBypass=true') || localStorage.getItem('testBypass') === 'true');
      // CRITICAL GUARD
      if (id?.startsWith('local-') && !isTestBypass) {
        console.warn("Timer save blocked: Program ID is local.");
        return;
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
    if (isReadOnly) return;
    
    const targetId = targetProgramId || displayProgram.id;
    const targetProg = targetProgramId ? (activeSessions.find(s => String(s.id) === String(targetProgramId)) || displayProgram) : displayProgram;
    const targetIdx = targetId === displayProgram.id ? displayCurrentSlotIndex : (targetProg.currentSlotIndex || 0);

    const newSlots = [...targetProg.slots];
    const currentSlot = newSlots[targetIdx];
    console.log('handleNudge called with:', minutes, 'currentSlot duration minutes before nudge:', currentSlot?.durationMinutes);

    if (currentSlot) {
      currentSlot.durationMinutes = Math.max(0, currentSlot.durationMinutes + minutes);
      const updated = { ...targetProg, slots: newSlots };
      console.log('updated slot durationMinutes:', updated.slots[targetIdx].durationMinutes);

      const targetIsLive = targetProg.status === 'live';
      const targetIsActive = (targetProg.isTimerActive !== undefined ? targetProg.isTimerActive : false) ||
                            activeSessions.some(as => String(as.id) === String(targetId) && as.isTimerActive) || 
                            (String(targetId) === String(displayProgram.id) ? displayIsTimerActive : false) ||
                            (String(targetId) === String(program.id) ? isTimerActive : false);
      const targetStartTs = targetId === displayProgram.id ? displayTimerStartTimestamp : targetProg.timerStartTimestamp;
      const targetElapsed = targetId === displayProgram.id ? displaySecondsElapsed : (targetProg.secondsElapsed || 0);

      if (targetIsLive) {
        timerSaveMutation.mutate({
          id: targetId,
          currentSlotIndex: targetIdx,
          isTimerActive: targetIsActive,
          secondsElapsed: targetElapsed,
          timerStartTimestamp: targetStartTs,
          isManualMode: targetProg.isManualMode
        });
      }

      if (targetId === program.id || targetId === displayProgram.id) {
        updateLocalProgram(updated);
      }
      
      // Persist the slot change
      updateProgramService(updated);
    }
  };

  const handleEndEvent = (targetProgramId?: string) => {
    if (isReadOnly) return;
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

    const updatedProgram = { 
      ...targetProg, 
      slots: slotsWithFinalDuration,
      status: 'concluded' as const, 
      isTimerActive: false 
    };

    // PUSH TO CLOUD
    timerSaveMutation.mutate({
      id: targetId,
      currentSlotIndex: targetIdx,
      isTimerActive: false,
      secondsElapsed: 0,
      timerStartTimestamp: null,
      status: 'concluded'
    });

    if (targetId === program.id) {
      updateLocalProgram(updatedProgram);
      setIsTimerActive(false);
      setTimerStartTimestamp(null);
      setSecondsElapsed(0);
    }
    
    // Final save to DB - Explicitly clear timer state for this venue
    updateProgramService(updatedProgram);
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
      console.log(`Auto-saving program "${program.title}" to Convex...`);
      setSaveStatus('saving');
      lastSavedProgramRef.current = program;
      mutation.mutate(program);
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
        if (lastSavedProgramRef.current) {
          lastSavedProgramRef.current = { ...lastSavedProgramRef.current, id: savedProgram.id };
        }
        setProgram(prev => ({ ...prev, id: (savedProgram as Program).id }));
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
    lastAdvancedIndexRef.current = -1;
    lastProcessedIndexRef.current = -1;
    lastSavedProgramRef.current = newProgram;
    setProgram(newProgram);
    setSaveStatus('saved');

    // Safety: Only reset local viewer state if we are NOT loading the live program.
    // If loading the live program, we want to keep the current running pointers.
    if (globalLiveProgram?.id !== newProgram.id) {
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
    navigate(`/editor?id=${newProgram.id}`);
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
    if (!isAdmin && !isManager) return;
    const newProgram: Program = {
      ...getInitialProgram(activeOrgId || undefined),
      id: `local-${crypto.randomUUID()}`, // Prefix to distinguish local-only programs
      date: date,
    };
    loadProgram(newProgram);
  };

  const deleteProgram = async (id: string) => {
    if ((!isAdmin && !isManager) || !id) return;

    try {
      // Guard: Don't call backend if it's a local-only program
      if (!id.startsWith('local-')) {
        await deleteProgramService(id);
      }

      // Invalidate cache to refresh home view
      queryClient.invalidateQueries({ queryKey: ['programs'] });

      // If we deleted the current program, load another one
      if (program.id === id) {
        // Fetch programs to find another one
        const allPrograms = await getPrograms();
        if (allPrograms.length > 0) {
          loadProgram(allPrograms[0]);
        } else {
          // Reset to initial if all deleted
          const reset = getInitialProgram();
          loadProgram(reset);
        }
      }
    } catch (error) {
      console.error('Failed to delete program:', error);
      alert('Failed to delete program. Please try again.');
    }
  };

  const duplicateProgram = (id: string) => {
    if (!isAdmin && !isManager) return;
    void (async () => {
      try {
        const original = await getProgramById(id);
        if (!original) return;

        const newProgram: Program = {
          ...original,
          id: `local-${crypto.randomUUID()}`,
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
        loadProgram(saved);
      } catch (error) {
        console.error('Failed to duplicate program:', error);
        alert('Failed to duplicate program. Please try again.');
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
    if (displayProgram.isManualMode) return;

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
      lastAdvancedIndexRef.current = currentIdx; // Lock it!
      // Throttle Auto-Advance (Mutation Lock)
      if (Date.now() - lastAdvanceTimeRef.current < 2000) return;
      lastAdvanceTimeRef.current = Date.now();

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
  }, [displaySecondsElapsed, displayIsTimerActive, displayProgram.id, displayCurrentSlotIndex, displayProgram.slots, displayProgram.isManualMode]);

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

    if (newState) {
      const now = Date.now();
      if (targetIdStr === String(displayProgram.id)) {
        lastAdvancedIndexRef.current = -1;
        lastProcessedIndexRef.current = -1;
      }
      // For PLAY: Use localSecondsOverride (from manual start) or existing display elapsed
      const secondsToUse = localSecondsOverride !== undefined 
        ? localSecondsOverride 
        : (targetIdStr === String(displayProgram.id) ? displaySecondsElapsed : 0);
      
      const shiftedStart = now - (secondsToUse * 1000);

      timerSaveMutation.mutate({
        id: target.id,
        currentSlotIndex: indexToUse,
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
        setIsTimerActive(true);
        setTimerStartTimestamp(shiftedStart);
        updateLocalProgram(prev => ({ ...prev, status: 'live' }));
        
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
      const wallDelta = target.timerStartTimestamp ? Math.floor((now - target.timerStartTimestamp) / 1000) : (target.secondsElapsed || 0);
      
      const secondsToSave = (target.status === 'live' && target.timerStartTimestamp)
        ? Math.max(wallDelta, currentTickingSecondsRef.current)
        : (localSecondsOverride !== undefined ? localSecondsOverride : wallDelta);

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

    // PUSH TO CLOUD - Ensure HUDs update instantly
    timerSaveMutation.mutate({
      id: targetId,
      currentSlotIndex: targetId === displayProgram.id ? displayCurrentSlotIndex : (targetProg.currentSlotIndex || 0),
      isTimerActive: targetId === displayProgram.id ? displayIsTimerActive : (targetProg.isTimerActive || false),
      secondsElapsed: targetId === displayProgram.id ? currentTickingSecondsRef.current : (targetProg.secondsElapsed || 0),
      timerStartTimestamp: targetId === displayProgram.id ? displayTimerStartTimestamp : (targetProg.timerStartTimestamp || null),
      isOnHold: holdState,
      holdMessage: msg
    });

    // Local update for smoothness on draft
    if (targetId === program.id) {
      updateLocalProgram(prev => ({ ...prev, isOnHold: holdState, holdMessage: msg }));
    }
  };

  const handleToggleManualMode = (targetProgramId?: string) => {
    if (isReadOnly) return;
    const targetId = targetProgramId || displayProgram.id;
    const targetProg = targetProgramId ? (activeSessions.find(s => String(s.id) === String(targetProgramId)) || displayProgram) : displayProgram;
    
    const nextManualState = !targetProg.isManualMode;

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
    if (isReadOnly) return;
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
    if (isReadOnly) return;
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

  // Wrappers (Replaced with external components)

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

  // --- Public View Bypass (TOP LEVEL) ---
  // We check this before ANY auth or shell rendering to ensure zero-friction guest access and no flicker.
  if (isPublicPath) {
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

  // Special Route Handling: TV Mode
  // We render this exclusively, bypassing the main application shell (header, footer, etc.)
  if (location.pathname === '/tv') {
    return <TVWrapper />;
  }

  if (location.pathname === '/stage') {
    return <StageWrapper />;
  }

  if (location.pathname === '/prompter') {
    return <PrompterWrapper />;
  }

  if (location.pathname === '/crew') {
    return <CrewHUD />;
  }


  // Header UI Sync (for the mini-timer)
  const headerElapsed = useTimerSync(displayTimerStartTimestamp, displayIsTimerActive, displaySecondsElapsed);
  const currentHeaderSlot = displayProgram.slots?.[displayCurrentSlotIndex];
  const headerTimeLeft = currentHeaderSlot ? (currentHeaderSlot.durationMinutes * 60 - headerElapsed) : 0;

  // Sync the Ref for background mutations (handlers)
  useEffect(() => {
    currentTickingSecondsRef.current = headerElapsed;
  }, [headerElapsed]);

  const isHudVisible = !!(user && canControlLive && displayProgram.slots.length > 0);

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
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
          activeSessions={activeSessions}
          selectedLiveId={selectedLiveId}
          onSelectLive={setSelectedLiveId}
          isCollapsed={isSidebarCollapsed}
          onToggle={setIsSidebarCollapsed}
          onCreateOrg={() => setIsOnboardingManual(true)}
          onStopAllSessions={handleStopAllSessions}
        />
      )}

      {user && (userOrganizations.length === 0 || isOnboardingManual) && !effectiveAuthLoading && !loadingOrgs && (
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

      <div className={`flex-1 flex flex-col min-h-screen pb-32 lg:pb-0 transition-all duration-300 overflow-x-hidden ${
        user 
          ? (isSidebarCollapsed 
              ? (isHudVisible ? 'lg:pl-[192px]' : 'lg:pl-20') 
              : (isHudVisible ? 'lg:pl-[368px]' : 'lg:pl-64')
            ) 
          : ''
      }`}>
        {/* Header (Studio Precision Top Bar) */}
        <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-[#22262E] bg-white/95 dark:bg-[#090A0C]/95 backdrop-blur-md transition-colors h-14 flex items-center shrink-0 no-print font-sans">
          <div className="w-full px-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!user ? (
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-slate-100 dark:bg-[#181B22] border border-slate-200 dark:border-[#2D333F] flex items-center justify-center">
                    <Mic className="text-[#0EA5E9]" size={15} />
                  </div>
                  <span className="font-mono font-bold text-sm tracking-wider text-slate-900 dark:text-white uppercase">KAIRON</span>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-sm text-slate-900 dark:text-white truncate max-w-full">
                        {displayProgram.title}
                      </h2>
                      {displayIsTimerActive ? (
                        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#10B981]/10 border border-[#10B981]/30 text-[10px] font-mono font-bold text-[#10B981]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-tally" />
                          LIVE
                        </span>
                      ) : (
                        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[10px] font-mono font-bold text-[#F59E0B]">
                          STANDBY
                        </span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Live Control Center & Header Timer */}
            {!isReadOnly && displayProgram.slots.length > 0 && (
              <div className="hidden md:flex items-center gap-3 bg-slate-50 dark:bg-[#121418] border border-slate-200 dark:border-[#22262E] px-3 py-1 rounded-md shadow-sm">
                <div className={`text-base font-mono font-bold tabular-nums min-w-[70px] text-center ${
                  displayIsTimerActive 
                    ? (headerTimeLeft < 0 ? 'text-[#EF4444] animate-pulse' : 'text-[#10B981]') 
                    : 'text-slate-500 dark:text-[#8A93A4]'
                }`}>
                  {currentHeaderSlot ? formatDuration(headerTimeLeft) : '00:00'}
                </div>

                <div className="w-[1px] h-4 bg-slate-200 dark:bg-[#22262E]" />

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleTimer()}
                    className={`p-1.5 rounded transition-all ${
                      displayIsTimerActive 
                        ? 'bg-slate-200 dark:bg-[#1C2028] text-slate-900 dark:text-white border border-slate-300 dark:border-[#2D333F]' 
                        : 'bg-[#10B981] text-white hover:bg-[#059669]'
                    }`}
                    title={displayIsTimerActive ? "Pause Timer" : "Start Event"}
                  >
                    {displayIsTimerActive ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                  </button>

                  <button
                    onClick={() => handlePrev()}
                    disabled={displayCurrentSlotIndex === 0}
                    className={`p-1.5 rounded transition-all ${
                      displayCurrentSlotIndex === 0 
                        ? 'text-slate-300 dark:text-[#4B5563] cursor-not-allowed' 
                        : 'text-slate-600 dark:text-[#8A93A4] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#181B22]'
                    }`}
                    title="Previous Slot"
                  >
                    <SkipBack size={14} />
                  </button>

                  <button
                    onClick={() => handleNext()}
                    disabled={displayCurrentSlotIndex === displayProgram.slots.length - 1}
                    className={`p-1.5 rounded transition-all ${
                      displayCurrentSlotIndex === displayProgram.slots.length - 1 
                        ? 'text-slate-300 dark:text-[#4B5563] cursor-not-allowed' 
                        : 'text-slate-600 dark:text-[#8A93A4] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#181B22]'
                    }`}
                    title="Next Slot"
                  >
                    <SkipForward size={14} />
                  </button>

                  <button
                    onClick={() => handleToggleHold()}
                    className={`p-1.5 rounded transition-all ${
                      displayProgram.isOnHold 
                        ? 'bg-[#F59E0B] text-black' 
                        : 'text-slate-600 dark:text-[#8A93A4] hover:text-[#F59E0B] hover:bg-slate-100 dark:hover:bg-[#181B22]'
                    }`}
                    title="Toggle Hold"
                  >
                    <Clock size={14} />
                  </button>

                  <div className="w-[1px] h-4 bg-slate-200 dark:bg-[#22262E] mx-0.5" />

                  <button
                    onClick={() => handleToggleManualMode()}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded transition-all ${
                      displayProgram.isManualMode
                        ? 'bg-slate-100 dark:bg-[#181B22] text-[#0EA5E9] border border-slate-300 dark:border-[#2D333F]'
                        : 'text-slate-600 dark:text-[#8A93A4] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#181B22]'
                    }`}
                    title={displayProgram.isManualMode ? "Manual Mode (Manual Advance)" : "Auto-Advance Mode (Continuous)"}
                  >
                    {displayProgram.isManualMode ? <MousePointerClick size={13} /> : <Zap size={13} />}
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider hidden lg:block">
                      {displayProgram.isManualMode ? 'MAN' : 'AUTO'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              {/* Network Status Indicator */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-[#121418] border border-slate-200 dark:border-[#22262E] rounded text-[10px] font-mono text-slate-600 dark:text-[#8A93A4]">
                {isOnline ? <Wifi size={11} className="text-[#10B981]" /> : <WifiOff size={11} className="text-[#EF4444]" />}
                <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
              </div>

              {!isReadOnly && (
                <button
                  onClick={toggleTheme}
                  className="p-1.5 bg-slate-50 dark:bg-[#121418] hover:bg-slate-100 dark:hover:bg-[#181B22] border border-slate-200 dark:border-[#22262E] text-slate-600 dark:text-[#8A93A4] hover:text-slate-900 dark:hover:text-white rounded transition-colors"
                  title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
                </button>
              )}

              {!isReadOnly && user && (
                <>
                  {canControlLive && isFlightBridgeSupported && (
                    <button
                      onClick={() => openFlightBridge()}
                      className={`p-1.5 rounded border transition-colors ${
                        pipWindow 
                          ? 'bg-[#0EA5E9]/20 border-[#0EA5E9] text-[#0EA5E9]' 
                          : 'bg-slate-50 dark:bg-[#121418] border-slate-200 dark:border-[#22262E] text-slate-600 dark:text-[#8A93A4] hover:text-slate-900 dark:hover:text-white'
                      }`}
                      title="Open Floating PiP Window"
                    >
                      <AppWindow size={15} />
                    </button>
                  )}

                  <button
                    onClick={() => window.open(`${window.location.origin}/tv?id=${displayProgram.id}`, 'kairon_tv_display')}
                    className="p-1.5 bg-slate-50 dark:bg-[#121418] hover:bg-slate-100 dark:hover:bg-[#181B22] border border-slate-200 dark:border-[#22262E] text-slate-600 dark:text-[#8A93A4] hover:text-slate-900 dark:hover:text-white rounded transition-colors"
                    title="Launch TV / Overflow Screen"
                  >
                    <Tv size={15} />
                  </button>

                  <button
                    onClick={() => setIsExportOpen(true)}
                    className="p-1.5 bg-slate-50 dark:bg-[#121418] hover:bg-slate-100 dark:hover:bg-[#181B22] border border-slate-200 dark:border-[#22262E] text-slate-600 dark:text-[#8A93A4] hover:text-slate-900 dark:hover:text-white rounded transition-colors"
                    title="Export Schedule"
                  >
                    <Download size={15} />
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        {promptMessage && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xl px-4 animate-in slide-in-from-top-4 duration-500">
            <div className="bg-rose-600 text-white py-4 px-8 rounded-2xl shadow-2xl flex items-center gap-4 border-2 border-white/20 backdrop-blur-xl">
              <Bell className="animate-bounce" size={24} />
              <span className="text-xl font-bold uppercase tracking-tight">{promptMessage.text}</span>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto pb-20 md:pb-0 relative custom-scrollbar">
          {/* Venue Dock (Pill Switcher) */}
          <VenueDock 
            activeSessions={activeSessions}
            selectedLiveId={selectedLiveId}
            onSelect={setSelectedLiveId}
          />
          <div className="max-w-7xl mx-auto px-4 pb-4 pt-1 md:p-8 h-full">
            {/* Invitation Banner for Unauthenticated Users */}

            {effectiveAuthLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : networkError ? (
              <div className="flex flex-col items-center justify-center h-full max-w-sm mx-auto text-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl">
                <div className="w-16 h-16 bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <WifiOff size={32} />
                </div>
                <h2 className="text-xl font-bold mb-2">Connection Issues</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8">{networkError}</p>
                <div className="flex flex-col gap-3 w-full">
                  <button
                    onClick={retryAuth}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2"
                  >
                    <Sparkles size={18} /> Try Again
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition-all"
                  >
                    Refresh Page
                  </button>
                </div>
              </div>
            ) : null}

            <ConfirmationModal
              isOpen={isInterlockOpen}
              title="Concurrent Event Detected"
              message="Another event is currently live. Would you like to start this as an additional concurrent session, or replace the existing one?"
              confirmText="Start Concurrent"
              cancelText="Replace Current"
              onConfirm={() => handleConfirmStart('concurrent')}
              onClose={() => setIsInterlockOpen(false)} // Safe Cancel
              onAction={() => handleConfirmStart('replace')} // We'll use a custom button if needed, but for now let's map onClose to Cancel and provide a 'Replace' option in the message or modal
              type="warning"
            />

            {!user ? (
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
                        onEndEvent={handleEndEvent}
                        onNudge={handleNudge}
                        readOnly={isReadOnly && userRole !== 'operator'}
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
                        onEndEvent={handleEndEvent}
                        onNudge={handleNudge}
                        onUpdate={(p) => {
                          if ((p as any)._triggerRebalance) {
                            handleAiRebalance(p);
                            return;
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



      <ExportDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        program={displayProgram}
        options={exportOptions}
        setOptions={setExportOptions}
      />

      {/* Network Error Overlay */}
      {networkError && (
        <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl border border-red-500/20 text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bell className="text-red-600 dark:text-red-400" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Connection Issues</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed text-sm">
              {networkError} Check your internet connection or try again in a moment.
            </p>

            {/* Diagnostic Block */}
            <div className="text-left bg-slate-100 dark:bg-slate-800/50 p-4 rounded-2xl mb-8 border border-slate-200 dark:border-slate-700">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Technical Diagnostics</h3>
              <p className="text-[10px] text-slate-500 break-all font-mono">
                CONVEX_URL: <span className="text-indigo-500">{import.meta.env.VITE_CONVEX_URL}</span>
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-indigo-500/25"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {user && canControlLive && (displayProgram.slots.length > 0) && (
        <div className={`hidden lg:block fixed top-16 bottom-0 z-[100] transition-all duration-300 ${isSidebarCollapsed ? 'left-20' : 'left-64'} h-[calc(100vh-64px)]`}>
          <ProductionHUD
            isTimerActive={displayIsTimerActive}
            isAdminOnline={isAdminOnline}
            onEndEvent={() => handleEndEvent(displayProgram.id)}
            onNudge={handleNudge}
            onToggleTimer={handleToggleTimer}
            onViewAnalytics={(id) => navigate(`/analytics/${id}`)}
            currentSlotTitle={displayProgram?.slots[displayCurrentSlotIndex]?.title}
            programId={displayProgram.id}
            timerStartTimestamp={displayTimerStartTimestamp}
            secondsElapsed={displaySecondsElapsed}
            isVertical={true}
          />
        </div>
      )}


      {!location.pathname.startsWith('/analytics') && (
        <PrintableSchedule
          program={displayProgram}
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
          isManualMode={displayProgram.isManualMode}
          onToggleManualMode={handleToggleManualMode}
        />,
        pipWindow.document.body
      )}

      {user && canControlLive && (displayProgram && displayProgram.slots.length > 0) && !pipWindow && (
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
        />
      )}
    </div>
  );
};

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <ConvexAuthProvider client={convex}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </QueryClientProvider>
    </ConvexAuthProvider>
  );
};

export default App;