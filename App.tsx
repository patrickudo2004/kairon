import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Mic, Edit3, Play, List, Calendar as CalendarIcon, Home, Sun, Moon, Share2, Copy, Check, X, AlertTriangle, FileText, Download, User, AlignLeft, QrCode, Clipboard, Wifi, WifiOff, Sparkles } from 'lucide-react';
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Services
import { realtimeService, TimerState } from './services/realtimeService';
import { getPrograms, getProgramById, createProgram as createProgramService, updateProgram as updateProgramService, deleteProgram as deleteProgramService, updateTimerState as updateTimerStateService } from './services/programService';
import { getProfile, signOut as signOutService } from './services/authService';
import { getMyOrganizations } from './services/orgService';
import { rebalanceSchedule } from './services/geminiService';
import { supabase } from './services/supabaseClient';

// Store & Hooks
import { useUIStore } from './store/uiStore';
import { useLocalSync } from './hooks/useLocalSync';
import { useStageMessages } from './hooks/useStageMessages';

// Components
import LiveTimer from './components/LiveTimer';
import ScheduleList from './components/ScheduleList';
import ProgramEditor from './components/ProgramEditor';
import CalendarView from './components/CalendarView';
import HomeDashboard from './components/HomeDashboard';
import PrintableSchedule from './components/PrintableSchedule';
import ShareDialog from './components/ShareDialog';
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

// Utils & Types
import { Program, Slot, SlotType, Profile, Organization } from './types';
import { timeToMinutes, minutesToTime, formatDuration } from './utils/time';
import { encodeProgramData, decodeProgramData } from './utils/encoding';
import { INITIAL_PROGRAM } from './utils/constants';

import { Monitor, User as UserIcon, Building, MessageSquare, Bell, Clock, Crown, SkipForward, Pause } from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';

// --- App Content Component ---
const AppContent: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState(searchParams.get('mode') || 'editor');
  const importData = searchParams.get('import');

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const isReadOnly = mode === 'viewer' || mode === 'ReadOnly';
  const isCoEditor = mode === 'coeditor';
  const queryClient = useQueryClient();

  const isReadOnlyRef = React.useRef(isReadOnly);
  useEffect(() => {
    isReadOnlyRef.current = isReadOnly;
  }, [isReadOnly]);

  // Main State
  const [program, setProgram] = useState<Program>(INITIAL_PROGRAM);

  const [currentSlotIndex, setCurrentSlotIndex] = useState<number>(0);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  // --- Auth & Org State ---
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);

  // Fetch all organizations for the user
  const { data: userOrganizations = [] } = useQuery({
    queryKey: ['organizations', user?.id],
    queryFn: getMyOrganizations,
    enabled: !!user,
  });

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
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);
  const [isOnboardingManual, setIsOnboardingManual] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle Auth Session
  useEffect(() => {
    let sub: { unsubscribe: () => void } | null = null;

    const setupAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        const p = await getProfile(session.user.id);
        setProfile(p);
      }
      setIsAuthLoading(false);

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          const p = await getProfile(session.user.id);
          setProfile(p);
        } else {
          setProfile(null);
        }
        setIsAuthLoading(false);
      });
      sub = subscription;
    };

    setupAuth();

    return () => {
      if (sub) sub.unsubscribe();
    };
  }, []);

  const loadProfile = async (userId: string) => {
    const p = await getProfile(userId);
    setProfile(p);
  };

  const handleSignOut = async () => {
    await signOutService();
    setProfile(null);
    setUser(null);
    setActiveOrgId(null);
    setActiveOrg(null);
  };

  // Lifted Timer State
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [timerStartTimestamp, setTimerStartTimestamp] = useState<number | null>(null);


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
  const [exportOptions, setExportOptions] = useState<ExportOptions>({ includeDetails: true, includeSpeakers: true });

  useEffect(() => {
    if (isReadOnly) setIsShareOpen(false);
  }, [isReadOnly]);

  // Persistence Key
  const TIMER_STORAGE_KEY = 'kairon_timer_state';

  // Restore state on program load
  useEffect(() => {
    try {
      const saved = localStorage.getItem(TIMER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.programId === program.id) {
          console.log("Restoring timer state from localStorage", parsed);
          setCurrentSlotIndex(parsed.currentSlotIndex);
          setIsTimerActive(parsed.isTimerActive);

          // Recalculate elapsed if active to catch up time lost during refresh
          if (parsed.isTimerActive && parsed.timerStartTimestamp) {
            const now = Date.now();
            const elapsed = Math.floor((now - parsed.timerStartTimestamp) / 1000);
            setSecondsElapsed(elapsed);
            setTimerStartTimestamp(parsed.timerStartTimestamp);
          } else {
            setSecondsElapsed(parsed.secondsElapsed);
            setTimerStartTimestamp(parsed.timerStartTimestamp);
          }
        }
      }
    } catch (e) {
      console.warn("Failed to restore timer state", e);
    }
  }, [program.id]);

  // Save state on change
  useEffect(() => {
    // Only save if we have a valid program and state
    if (program.id === INITIAL_PROGRAM.id) return;

    const state = {
      programId: program.id,
      program, // Include the full program for offline recovery
      currentSlotIndex,
      isTimerActive,
      secondsElapsed,
      timerStartTimestamp,
      lastBackup: Date.now()
    };
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
    // Also save a per-program backup for easier multi-program management
    localStorage.setItem(`kairon_backup_${program.id}`, JSON.stringify(state));
  }, [program, currentSlotIndex, isTimerActive, secondsElapsed, timerStartTimestamp]);

  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleAiRebalance = async (currentProgram: Program) => {
    setIsAiLoading(true);
    try {
      // Calculate how far off we are
      const totalPlanned = currentProgram.slots.reduce((acc, s) => acc + s.durationMinutes, 0);
      const currentTimeInMinutes = timeToMinutes(currentProgram.startTime) + (secondsElapsed / 60);
      // For simplicity, we just pass the remaining time needed to be shaved or added
      const suggestion = await rebalanceSchedule(currentProgram, totalPlanned);
      setAiSuggestion(suggestion);
    } catch (err) {
      console.error("AI Rebalance failed:", err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const timerStateRef = React.useRef({
    programId: INITIAL_PROGRAM.id,
    isTimerActive: false,
    currentSlotIndex: 0,
    secondsElapsed: 0,
    timerStartTimestamp: null as number | null,
  });

  useEffect(() => {
    timerStateRef.current = {
      programId: program.id,
      isTimerActive,
      currentSlotIndex,
      secondsElapsed,
      timerStartTimestamp,
    };
  }, [program.id, isTimerActive, currentSlotIndex, secondsElapsed, timerStartTimestamp]);

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

  // Fetch program if ID is present
  const { data: fetchedProgram } = useQuery<Program>({
    queryKey: ['program', urlId],
    queryFn: () => getProgramById(urlId!),
    enabled: !!urlId,
  });

  // Load state from URL if present
  useEffect(() => {
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

  // Fetch active organization details for branding
  useEffect(() => {
    if (activeOrgId) {
      supabase
        .from('organizations')
        .select('*')
        .eq('id', activeOrgId)
        .single()
        .then(({ data }) => {
          if (data) {
            setActiveOrg({
              id: data.id,
              name: data.name,
              slug: data.slug,
              logoUrl: data.logo_url,
              brandColor: data.brand_color,
              subscriptionStatus: data.subscription_status,
              createdBy: data.created_by,
              createdAt: data.created_at
            });
          }
        });
    } else {
      setActiveOrg(null);
    }
  }, [activeOrgId]);

  // If program has an orgId but activeOrgId is null, sync them
  useEffect(() => {
    if (program.organizationId && !activeOrgId) {
      setActiveOrgId(program.organizationId);
    }
  }, [program.organizationId]);

  useEffect(() => {
    const hydrate = async () => {
      // 1. Try DB Hydration
      if (fetchedProgram && fetchedProgram.id !== program.id) {
        console.log("Hydrating program from ID:", fetchedProgram.title);
        setProgram(fetchedProgram);

        // Hydrate Timer State from DB if available
        if (fetchedProgram.isTimerActive !== undefined) {
          setCurrentSlotIndex(fetchedProgram.currentSlotIndex ?? 0);
          setIsTimerActive(fetchedProgram.isTimerActive ?? false);
          setTimerStartTimestamp(fetchedProgram.timerStartTimestamp ?? null);

          if (fetchedProgram.isTimerActive && fetchedProgram.timerStartTimestamp) {
            const now = Date.now();
            const elapsed = Math.floor((now - fetchedProgram.timerStartTimestamp) / 1000);
            setSecondsElapsed(elapsed);
          } else {
            setSecondsElapsed(fetchedProgram.secondsElapsed ?? 0);
          }
        }
        return;
      }

      // 2. Try URL Import Hydration
      if (importData) {
        const importedProgram = decodeProgramData(importData);
        if (importedProgram && importedProgram.id !== program.id) {
          console.log("Hydrating program from URL Data:", importedProgram.title);
          setProgram(importedProgram);
        }
        return;
      }

      // 3. Offline Deep Recovery Fallback
      // If we are offline or DB failed, check for the specific program backup
      const programId = searchParams.get('id');
      if (programId && program.id === INITIAL_PROGRAM.id) {
        const localBackup = localStorage.getItem(`kairon_backup_${programId}`);
        if (localBackup) {
          try {
            const parsed = JSON.parse(localBackup);
            console.log("Offline Recovery: Restoring full program from local backup", parsed.program.title);
            setProgram(parsed.program);
            setCurrentSlotIndex(parsed.currentSlotIndex);
            setIsTimerActive(parsed.isTimerActive);
            setTimerStartTimestamp(parsed.timerStartTimestamp);
            setSecondsElapsed(parsed.secondsElapsed);
          } catch (e) {
            console.warn("Offline recovery failed:", e);
          }
        }
      }
    };

    hydrate();
  }, [importData, fetchedProgram, searchParams]);

  // Persistence (Supabase)
  const mutation = useMutation({
    mutationFn: (p: Program) => {
      // Check if it exists? For now, we assume if we have an ID we "upsert" or "update".
      // Let's try update first. If DB empty, this fails. 
      // Actually we should perform an UPSERT logic or Try Create if Update fails
      // But our service abstractions are separate.
      // Let's rely on Create for "Initial" valid UUIDs?
      // Or just try create. If ID exists, it throws...

      // Strategy: Since I just generated a new UUID, it definitely DOESN'T exist in DB.
      // So first save should be CREATE. Subsequent are UPDATE.

      // Hack for Prototype: Try Create, if conflict (23505), try Update.
      return createProgramService(p).catch(() => updateProgramService(p));
    }
  });

  const timerSaveMutation = useMutation({
    mutationFn: (state: {
      currentSlotIndex: number;
      isTimerActive: boolean;
      secondsElapsed: number;
      timerStartTimestamp: number | null;
    }) => updateTimerStateService(program.id, state)
  });

  // Debounced Auto-Save with Visual Feedback
  useEffect(() => {
    if (isReadOnly) return;

    // Don't auto-save empty placeholder programs
    if (program.slots.length === 0 && program.title === 'New Event' && program.subtitle === '') {
      return;
    }

    // Mark as unsaved when program changes
    setSaveStatus('unsaved');

    const timer = setTimeout(() => {
      console.log("Auto-saving to Supabase...", program.id);
      setSaveStatus('saving');
      mutation.mutate(program);
    }, 2000); // 2s debounce

    return () => clearTimeout(timer);
  }, [program, isReadOnly]);

  // Debounced Timer State Save to Supabase
  useEffect(() => {
    if (isReadOnly || program.id === INITIAL_PROGRAM.id) return;

    const timer = setTimeout(() => {
      console.log("Saving timer state to Supabase...", program.id);
      timerSaveMutation.mutate({
        currentSlotIndex,
        isTimerActive,
        secondsElapsed: isTimerActive ? 0 : secondsElapsed, // If active, the start timestamp is the source of truth
        timerStartTimestamp
      });
    }, 5000); // 5s debounce for timer state to avoid spamming DB during ticks

    return () => clearTimeout(timer);
  }, [currentSlotIndex, isTimerActive, secondsElapsed, timerStartTimestamp, isReadOnly, program.id]);

  // Update save status when mutation completes
  useEffect(() => {
    if (mutation.isSuccess) {
      setSaveStatus('saved');
      // Invalidate programs cache to refresh home view
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      // Reset to unsaved after 2 seconds to show it's ready for next change
      setTimeout(() => setSaveStatus('saved'), 2000);
    }
    if (mutation.isError) {
      setSaveStatus('unsaved');
    }
  }, [mutation.isSuccess, mutation.isError, queryClient]);

  // Supabase Realtime Connection & Sync
  useEffect(() => {
    console.log('Subscribing to realtime updates for program:', program.id);

    const unsubscribe = realtimeService.subscribe(
      program.id,
      (remoteState: TimerState) => {
        console.log('Received realtime timer update:', remoteState);

        // Ignore updates for other programs
        if (remoteState.programId !== program.id) return;

        // Update Slot Index
        setCurrentSlotIndex(prev => {
          if (prev !== remoteState.currentSlotIndex) return remoteState.currentSlotIndex;
          return prev;
        });

        // Update Timer Status
        setIsTimerActive(remoteState.isTimerActive);

        // Update Hold Status
        if (remoteState.hasOwnProperty('isOnHold')) {
          setProgram(prev => ({ ...prev, isOnHold: remoteState.isOnHold, holdMessage: remoteState.holdMessage }));
        }

        // Persist timer start timestamp
        setTimerStartTimestamp(remoteState.timerStartTimestamp);

        // Sync Time
        if (remoteState.isTimerActive && remoteState.timerStartTimestamp) {
          const now = Date.now();
          const elapsed = Math.floor((now - remoteState.timerStartTimestamp) / 1000);
          setSecondsElapsed(elapsed);
        } else {
          setSecondsElapsed(remoteState.secondsElapsed);
        }
      },
      // Program content update handler
      (updatedProgram: Program) => {
        console.log('Received realtime program update:', updatedProgram);
        // Only update if it's for the current program
        if (updatedProgram.id === program.id) {
          setProgram(updatedProgram);
        }
      },
      // Sync request handler (for late-joining viewers)
      () => {
        // Only an editor/co-editor should respond with the current state.
        if (isReadOnlyRef.current) return;

        const now = Date.now();
        const snapshot = timerStateRef.current;
        const resolvedStart = snapshot.isTimerActive
          ? (snapshot.timerStartTimestamp ?? (now - (snapshot.secondsElapsed * 1000)))
          : null;

        realtimeService.sendSyncResponse({
          programId: snapshot.programId,
          isTimerActive: snapshot.isTimerActive,
          currentSlotIndex: snapshot.currentSlotIndex,
          secondsElapsed: snapshot.secondsElapsed,
          timerStartTimestamp: resolvedStart,
        });
      },
      // Sync response handler (apply to late-joining viewers)
      (payload) => {
        const state = payload.state;
        if (state.programId !== program.id) return;

        setCurrentSlotIndex(state.currentSlotIndex);
        setIsTimerActive(state.isTimerActive);
        setTimerStartTimestamp(state.timerStartTimestamp);

        if (state.hasOwnProperty('isOnHold')) {
          setProgram(prev => ({ ...prev, isOnHold: state.isOnHold, holdMessage: state.holdMessage }));
        }

        if (state.isTimerActive && state.timerStartTimestamp) {
          const now = Date.now();
          const elapsed = Math.floor((now - state.timerStartTimestamp) / 1000);
          setSecondsElapsed(elapsed);
        } else {
          setSecondsElapsed(state.secondsElapsed);
        }
      }
    );

    return () => {
      console.log('Unsubscribing from realtime updates');
      unsubscribe();
    };
  }, [program.id]);

  // --- Local Sync Integration ---
  const onRequestSyncRef = React.useRef<() => void>(() => { });

  const { broadcastTimerState, broadcastProgramUpdate, requestSync: requestLocalSync } = useLocalSync(
    'kairon_local_sync',
    // onTimerState (Receive update from Controller)
    (state) => {
      // Only accept if program ID matches
      if (state.programId !== program.id) return;

      console.log('Local Sync: Timer:', state);
      // Update local state
      setCurrentSlotIndex(state.currentSlotIndex);
      setIsTimerActive(state.isTimerActive);
      setTimerStartTimestamp(state.timerStartTimestamp);

      if (state.hasOwnProperty('isOnHold')) {
        setProgram(prev => ({ ...prev, isOnHold: state.isOnHold, holdMessage: state.holdMessage }));
      }

      if (state.isTimerActive && state.timerStartTimestamp) {
        const now = Date.now();
        const elapsed = Math.floor((now - state.timerStartTimestamp) / 1000);
        setSecondsElapsed(elapsed);
      } else {
        setSecondsElapsed(state.secondsElapsed);
      }
    },
    // onProgramUpdate (Receive edit from Controller)
    (updatedProgram) => {
      if (updatedProgram.id === program.id) {
        console.log('Local Sync: Program Update');
        setProgram(updatedProgram);
      }
    },
    // onRequestSync (Controller receives request from new Projector)
    () => {
      onRequestSyncRef.current();
    }
  );

  // Request sync on mount if we are a viewer (Projector)
  useEffect(() => {
    if (isReadOnly) {
      console.log("Projector: Requesting Local Sync...");
      requestLocalSync();
    }
  }, [isReadOnly, requestLocalSync]);

  // Broadcast Helper (Supabase Realtime)
  const broadcastState = (overrides: Partial<TimerState> = {}) => {
    const now = Date.now();
    const hasStartOverride = Object.prototype.hasOwnProperty.call(overrides, 'timerStartTimestamp');
    const state: TimerState = {
      programId: program.id,
      isTimerActive: overrides.hasOwnProperty('isTimerActive') ? overrides.isTimerActive! : isTimerActive,
      currentSlotIndex: overrides.hasOwnProperty('currentSlotIndex') ? overrides.currentSlotIndex! : currentSlotIndex,
      secondsElapsed: overrides.hasOwnProperty('secondsElapsed') ? overrides.secondsElapsed! : secondsElapsed,
      timerStartTimestamp: hasStartOverride
        ? (overrides.timerStartTimestamp ?? null)
        : (overrides.isTimerActive ? now : timerStartTimestamp),
      isOnHold: overrides.hasOwnProperty('isOnHold') ? (overrides.isOnHold as boolean) : program.isOnHold,
      holdMessage: (overrides.holdMessage as string) || program.holdMessage,
    };

    realtimeService.broadcast(state);
    // Also broadcast locally
    broadcastTimerState(state);
  };

  // Wire up the sync request handler
  useEffect(() => {
    onRequestSyncRef.current = () => {
      if (!isReadOnlyRef.current) {
        console.log("Controller: Sending Local Sync Response");
        // Force a broadcast of current state
        broadcastState();
      }
    };
  }, [program.id, isTimerActive, currentSlotIndex, secondsElapsed]);

  const loadProgram = (newProgram: Program) => {
    setProgram(newProgram);
    setCurrentSlotIndex(0);
    setSecondsElapsed(0);
    setIsTimerActive(false);
    setTimerStartTimestamp(null);
    // Broadcast Reset
    broadcastState({
      isTimerActive: false,
      currentSlotIndex: 0,
      secondsElapsed: 0,
      timerStartTimestamp: null
    });
    // Clear persisted state for safety when explicitly switching/loading
    localStorage.removeItem(TIMER_STORAGE_KEY);
  };

  const createProgram = (date: string) => {
    if (isReadOnly) return;
    const newProgram: Program = {
      ...INITIAL_PROGRAM,
      id: crypto.randomUUID(),
      title: 'New Event',
      subtitle: 'Add subtitle',
      date: date,
      startTime: '09:00',
      organizationId: activeOrgId || undefined,
      slots: []
    };
    loadProgram(newProgram);
  };

  const deleteProgram = async (id: string) => {
    if (isReadOnly) return;

    try {
      // Delete from Supabase
      await deleteProgramService(id);

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
          const reset = { ...INITIAL_PROGRAM, id: crypto.randomUUID() };
          loadProgram(reset);
        }
      }
    } catch (error) {
      console.error('Failed to delete program:', error);
      alert('Failed to delete program. Please try again.');
    }
  };

  const duplicateProgram = (id: string) => {
    if (isReadOnly) return;
    void (async () => {
      try {
        const original = await getProgramById(id);
        if (!original) return;

        const newProgram: Program = {
          ...original,
          id: crypto.randomUUID(),
          title: `${original.title} (Copy)`,
          slots: original.slots.map(s => ({
            ...s,
            id: crypto.randomUUID()
          }))
        };

        await createProgramService(newProgram);

        queryClient.invalidateQueries({ queryKey: ['programs'] });
      } catch (error) {
        console.error('Failed to duplicate program:', error);
        alert('Failed to duplicate program. Please try again.');
      }
    })();
  };

  // Timer Tick Logic (Drift-Proof)
  useEffect(() => {
    let interval: number | undefined;
    if (isTimerActive && timerStartTimestamp) {
      interval = window.setInterval(() => {
        const now = Date.now();
        const exactElapsed = Math.floor((now - timerStartTimestamp) / 1000);
        setSecondsElapsed(exactElapsed);
      }, 200); // Update 5 times a second to catch the second flip immediately
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timerStartTimestamp]);

  const handleSlotComplete = (slotId: string, actualDuration: number) => {
    setProgram(prev => ({
      ...prev,
      slots: prev.slots.map(s => s.id === slotId ? { ...s, actualDuration } : s)
    }));
  };

  // Auto-Advance Logic
  useEffect(() => {
    if (!isTimerActive) return;

    const currentSlot = program.slots[currentSlotIndex];
    if (!currentSlot) return;

    const durationSeconds = currentSlot.durationMinutes * 60;

    // Manual Mode Override: Don't auto-advance if manual mode is on
    if (program.isManualMode) return;

    if (secondsElapsed >= durationSeconds) {
      handleSlotComplete(currentSlot.id, currentSlot.durationMinutes);

      if (currentSlotIndex < program.slots.length - 1) {
        // Auto-advance to next slot
        const nextIndex = currentSlotIndex + 1;
        setCurrentSlotIndex(nextIndex);
        setSecondsElapsed(0);

        const nextStartTs = Date.now();
        setTimerStartTimestamp(nextStartTs);

        // Broadcast Auto-Advance
        broadcastState({
          currentSlotIndex: nextIndex,
          isTimerActive: true,
          secondsElapsed: 0,
          timerStartTimestamp: nextStartTs
        });
      } else {
        // Last slot finished - stop timer
        setCurrentSlotIndex(prev => prev + 1);
        setIsTimerActive(false);
        setSecondsElapsed(0);
        setTimerStartTimestamp(null);

        broadcastState({
          currentSlotIndex: currentSlotIndex + 1,
          isTimerActive: false,
          secondsElapsed: 0
        });
      }
    }
  }, [secondsElapsed, isTimerActive, currentSlotIndex, program.slots.length]);

  // Auto-Start Watcher (New Feature)
  useEffect(() => {
    // Only run if timer is NOT active and we are NOT in read-only mode
    if (isTimerActive || isReadOnly) return;

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

        // Broadcast
        broadcastState({
          isTimerActive: true,
          timerStartTimestamp: startTs,
          secondsElapsed: 0
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerActive, isReadOnly, program.date, program.startTime, program.id]);

  // Fix: Toggle Timer with Broadcast
  const handleToggleTimer = () => {
    const newState = !isTimerActive;
    setIsTimerActive(newState);

    const startTs = newState ? (Date.now() - (secondsElapsed * 1000)) : null;
    setTimerStartTimestamp(startTs);

    // Broadcast immediately so Viewers know
    broadcastState({ isTimerActive: newState, timerStartTimestamp: startTs });
  };

  const handleToggleHold = () => {
    if (isReadOnly) return;
    const nextHoldState = !program.isOnHold;

    // Update local state first for immediate UI feedback
    setProgram(prev => ({ ...prev, isOnHold: nextHoldState }));

    // Broadcast for TV/Projectors and sync to Supabase
    broadcastState({ isOnHold: nextHoldState });

    // Final persistence to DB
    void (async () => {
      try {
        await updateTimerStateService(program.id, {
          currentSlotIndex,
          isTimerActive,
          secondsElapsed,
          timerStartTimestamp,
          isOnHold: nextHoldState,
          holdMessage: program.holdMessage
        });
      } catch (err) {
        console.error("Failed to persist hold state:", err);
      }
    })();
  };


  const handleNext = () => {
    if (isReadOnly) return;
    if (currentSlotIndex < program.slots.length) {
      const currentSlot = program.slots[currentSlotIndex];
      handleSlotComplete(currentSlot.id, Math.round(secondsElapsed / 60));

      if (currentSlotIndex < program.slots.length - 1) {
        setCurrentSlotIndex(prev => prev + 1);
        setSecondsElapsed(0);
        setIsTimerActive(false);
        setTimerStartTimestamp(null);

        broadcastState({
          currentSlotIndex: currentSlotIndex + 1,
          isTimerActive: false,
          secondsElapsed: 0
        });
      } else {
        setCurrentSlotIndex(prev => prev + 1);
        setIsTimerActive(false);
        setTimerStartTimestamp(null);

        broadcastState({
          currentSlotIndex: currentSlotIndex + 1,
          isTimerActive: false,
          secondsElapsed: Math.round(secondsElapsed)
        });
      }
    }
  };

  const handlePrev = () => {
    if (isReadOnly) return;
    if (currentSlotIndex > 0) {
      setCurrentSlotIndex(prev => prev - 1);
      setSecondsElapsed(0);
      setIsTimerActive(false);
      setTimerStartTimestamp(null);
      broadcastState({
        currentSlotIndex: currentSlotIndex - 1,
        isTimerActive: false,
        secondsElapsed: 0,
        timerStartTimestamp: null
      });
    }
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center w-14 md:w-20 h-16 rounded-xl transition-all ${isActive
      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 translate-y-[-4px]'
      : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200'
    }`;

  // Wrappers (Replaced with external components)

  // Redirect if ReadOnly user tries to access restricted routes
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isReadOnly) {
      const restrictedPaths = ['/', '/editor', '/calendar'];
      if (restrictedPaths.includes(location.pathname)) {
        // Preserve import data if redirecting
        const importParam = importData ? `&import=${importData}` : '';
        navigate(`/live?mode=viewer${importParam}`, { replace: true });
      }
    }
  }, [isReadOnly, location.pathname, navigate, importData]);

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

  const isPublicPath =
    location.pathname.includes('/p/') ||
    location.pathname === '/guide' ||
    location.hash.includes('/p/') ||
    location.hash.includes('mode=viewer');

  // Special Route Handling: TV Mode
  // We render this exclusively, bypassing the main application shell (header, footer, etc.)
  if (location.pathname === '/tv') {
    return (
      <TVView
        program={program}
        currentSlotIndex={currentSlotIndex}
        isTimerActive={isTimerActive}
        secondsElapsed={secondsElapsed}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        activeOrg={activeOrg}
      />
    );
  }

  if (location.pathname === '/stage') {
    return (
      <StageDisplay
        program={program}
        currentSlotIndex={currentSlotIndex}
        isTimerActive={isTimerActive}
        secondsElapsed={secondsElapsed}
        activeOrg={activeOrg}
      />
    );
  }

  // --- Public View Bypass ---
  // If we are on a public path and NOT logged in, render the view directly without the main app shell
  if (isPublicPath && !user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Routes>
          <Route path="/p/:slug" element={<PublicPortal />} />
          <Route path="/guide" element={<UserGuide />} />
          {/* Fallback to home if they somehow land here */}
          <Route path="*" element={<Auth />} />
        </Routes>
      </div>
    );
  }

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
          handleSignOut={signOutService}
          isOnline={isOnline}
          programTitle={program.title}
          isCollapsed={isSidebarCollapsed}
          onToggle={setIsSidebarCollapsed}
          onCreateOrg={() => setIsOnboardingManual(true)}
        />
      )}

      {user && (userOrganizations.length === 0 || isOnboardingManual) && !isAuthLoading && (
        <OnboardingOverlay
          userEmail={user.email || ''}
          onOrgCreated={(newOrg) => {
            queryClient.invalidateQueries({ queryKey: ['organizations', user?.id] });
            setActiveOrgId(newOrg.id);
            setIsOnboardingManual(false);
            navigate('/');
          }}
        />
      )}

      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${user ? (isSidebarCollapsed ? 'pl-20' : 'pl-64') : ''}`}>
        {/* Header (Simplified Top Bar) */}
        <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-colors h-16 flex items-center shrink-0 no-print">
          <div className="w-full px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {!user ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md bg-gradient-to-tr from-indigo-500 to-violet-500">
                    <Mic className="text-white" size={18} />
                  </div>
                  <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">KAIRON</span>
                </div>
              ) : (
                <>
                  <h2 className="font-bold text-slate-900 dark:text-white truncate max-w-[200px] lg:max-w-[400px]">
                    {program.title}
                  </h2>
                  {isReadOnly && (
                    <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500 font-medium tracking-widest uppercase">Viewer</span>
                  )}
                </>
              )}
            </div>

            {/* Live Control Center & Timer (THE RESTORED PIECE) */}
            {!isReadOnly && program.slots.length > 0 && (
              <div className="hidden md:flex items-center gap-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-1.5 rounded-2xl shadow-sm">
                <div className={`text-xl font-mono font-bold tabular-nums min-w-[80px] text-center ${isTimerActive ? (program.slots[currentSlotIndex] ? (program.slots[currentSlotIndex].durationMinutes * 60 - secondsElapsed < 0 ? 'text-rose-500' : 'text-indigo-600 dark:text-indigo-400') : 'text-slate-400') : 'text-slate-400'}`}>
                  {program.slots[currentSlotIndex]
                    ? formatDuration(program.slots[currentSlotIndex].durationMinutes * 60 - secondsElapsed)
                    : '00:00'}
                </div>

                <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

                <div className="flex items-center gap-1">
                  <button
                    onClick={handleToggleTimer}
                    className={`p-2 rounded-xl transition-all ${isTimerActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-indigo-500'}`}
                    title={isTimerActive ? "Pause Timer" : "Start Event"}
                  >
                    {isTimerActive ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                  </button>

                  <button
                    onClick={handleNext}
                    className="p-2 rounded-xl text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-indigo-500 transition-all"
                    title="Next Slot"
                  >
                    <SkipForward size={18} />
                  </button>

                  <button
                    onClick={handleToggleHold}
                    className={`p-2 rounded-xl transition-all ${program.isOnHold ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-amber-500'}`}
                    title="Toggle Hold"
                  >
                    <Clock size={18} />
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              {/* Connection & Mode Indicator */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {isOnline ? <Wifi size={12} className="text-emerald-500" /> : <WifiOff size={12} className="text-rose-500" />}
                {isOnline ? 'Synced' : 'Offline'}
              </div>

              {!isReadOnly && (
                <>
                  <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                    title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  >
                    {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                  </button>

                  {user && (
                    <>
                      <button
                        onClick={() => window.open(`${window.location.origin}/tv`, '_blank')}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                        title="Launch Projector (TV View)"
                      >
                        <Monitor size={18} />
                      </button>

                      <button
                        onClick={() => setIsExportOpen(true)}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                        title="Export PDF"
                      >
                        <Download size={18} />
                      </button>

                      <button
                        onClick={() => setIsShareOpen(true)}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-500/20 transition-all active:scale-95 flex items-center gap-2"
                      >
                        <Share2 size={14} />
                        Share
                      </button>
                    </>
                  )}
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
          <div className="max-w-7xl mx-auto p-4 md:p-8 h-full">
            {isAuthLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : !user ? (
              <Auth />
            ) : (
              <Routes>
                <Route path="/org" element={
                  <OrganizationManager
                    activeOrgId={activeOrgId ?? undefined}
                    onSelect={setActiveOrgId}
                  />
                } />

                {/* Main Views */}
                <Route path="/" element={
                  <HomeWrapper
                    activeProgramId={program.id}
                    loadProgram={loadProgram}
                    createProgram={createProgram}
                    deleteProgram={deleteProgram}
                    duplicateProgram={duplicateProgram}
                    mode={mode}
                  />
                } />

                <Route path="/calendar" element={
                  <CalendarWrapper
                    activeProgramId={program.id}
                    loadProgram={loadProgram}
                    createProgram={createProgram}
                    deleteProgram={deleteProgram}
                    duplicateProgram={duplicateProgram}
                    mode={mode}
                  />
                } />

                <Route path="/admin" element={
                  activeOrg ? (
                    <AdminPanel organization={activeOrg} />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4">
                      <Building size={48} className="opacity-20" />
                      <p>Select a workspace from the sidebar to manage settings.</p>
                    </div>
                  )
                } />

                <Route path="/p/:slug" element={<PublicPortal />} />
                <Route path="/guide" element={<UserGuide />} />

                <Route path="/live" element={
                  <LiveTimer
                    program={program}
                    currentSlotIndex={currentSlotIndex}
                    isTimerActive={isTimerActive}
                    secondsElapsed={secondsElapsed}
                    onToggleTimer={handleToggleTimer}
                    onToggleHold={handleToggleHold}
                    onNext={handleNext}
                    onPrev={handlePrev}
                    readOnly={isReadOnly}
                  />
                } />

                <Route path="/list" element={
                  <ScheduleList
                    program={program}
                    currentSlotIndex={currentSlotIndex}
                    secondsElapsed={secondsElapsed}
                    isTimerActive={isTimerActive}
                    readOnly={isReadOnly}
                  />
                } />

                {!isReadOnly && (
                  <Route path="/editor" element={
                    <ProgramEditor
                      program={program}
                      isCoEditor={isCoEditor}
                      onUpdate={(p) => {
                        if ((p as any)._triggerRebalance) {
                          handleAiRebalance(p);
                          return;
                        }
                        setProgram(p);
                        realtimeService.broadcastProgram(p);
                        broadcastProgramUpdate(p);
                        if (p.slots.length === 0) {
                          setCurrentSlotIndex(0);
                          setSecondsElapsed(0);
                          setIsTimerActive(false);
                        }
                      }}
                    />
                  } />
                )}
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

      <ShareDialog isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} program={program} />
      <ExportDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        program={program}
        options={exportOptions}
        setOptions={setExportOptions}
      />

      <PrintableSchedule
        program={program}
        includeDetails={exportOptions.includeDetails}
        includeSpeakers={exportOptions.includeSpeakers}
      />
    </div>
  );
};

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;