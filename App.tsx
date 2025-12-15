import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, NavLink, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Mic, Edit3, Play, List, Calendar as CalendarIcon, Home, Sun, Moon, Share2, Copy, Check, X, AlertTriangle, FileText, Download, User, AlignLeft, QrCode, Clipboard, Wifi, WifiOff } from 'lucide-react';
import QRCode from 'react-qr-code';
import { realtimeService, TimerState } from './services/realtimeService';
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getPrograms, getProgramById, createProgram as createProgramService, updateProgram as updateProgramService, deleteProgram as deleteProgramService } from './services/programService';
import { useUIStore } from './store/uiStore';
import LiveTimer from './components/LiveTimer';
import ScheduleList from './components/ScheduleList';
import ProgramEditor from './components/ProgramEditor';
import CalendarView from './components/CalendarView';
import HomeDashboard from './components/HomeDashboard';
import PrintableSchedule from './components/PrintableSchedule';
import ShareDialog from './components/ShareDialog';
import TVView from './components/TVView';
import { Program, Slot, SlotType } from './types';

// --- Helpers for URL State Encoding (Minification Strategy) ---

// Minified Structure types for reference
// ProgramArr: [version, id, title, subtitle, date, startTime, endTime, slots[]]
// SlotArr: [id, title, speaker, duration, type, details, actualDuration]

const MINIFY_VERSION = 1;

const minifyProgram = (p: Program): any[] => {
  return [
    MINIFY_VERSION,
    p.id,
    p.title,
    p.subtitle,
    p.date,
    p.startTime,
    p.endTime || null,
    p.slots.map(s => [
      s.id,
      s.title,
      s.speaker,
      s.durationMinutes,
      s.type,
      s.details || "",
      s.actualDuration || 0
    ])
  ];
};

const expandProgram = (data: any[]): Program | null => {
  try {
    const [version, id, title, subtitle, date, startTime, endTime, slotsArr] = data;

    // Basic validation
    if (version !== MINIFY_VERSION) console.warn("Version mismatch in shared link");

    const slots: Slot[] = Array.isArray(slotsArr) ? slotsArr.map((s: any[]) => ({
      id: s[0],
      title: s[1],
      speaker: s[2],
      durationMinutes: s[3],
      type: s[4] as SlotType,
      details: s[5] || undefined,
      actualDuration: s[6] || undefined
    })) : [];

    return {
      id,
      title,
      subtitle,
      date,
      startTime,
      endTime: endTime || undefined,
      slots
    };
  } catch (e) {
    console.error("Failed to expand program data", e);
    return null;
  }
};

const encodeData = (data: Program): string => {
  try {
    const minified = minifyProgram(data);
    const jsonStr = JSON.stringify(minified);
    // Use LZString for URL-safe compression (Base64-like)
    return compressToEncodedURIComponent(jsonStr);
  } catch (e) {
    console.error("Encoding failed", e);
    return '';
  }
};

const decodeData = (str: string): Program | null => {
  try {
    // 1. Try decompressing with LZString first (New Format)
    let jsonStr = decompressFromEncodedURIComponent(str);

    // 2. Fallback: If null, it might be the old format (Base64)
    if (!jsonStr) {
      try {
        jsonStr = decodeURIComponent(escape(atob(str)));
      } catch (innerE) {
        // Not Base64 either
        console.warn("Legacy decoding failed", innerE);
        return null;
      }
    }

    const parsed = JSON.parse(jsonStr);

    // Check if it's the new minified array format
    if (Array.isArray(parsed)) {
      return expandProgram(parsed);
    }

    // Fallback for legacy object format
    return parsed as Program;
  } catch (e) {
    console.error("Decoding failed", e);
    return null;
  }
};

// --- Time Helpers (Duplicated here to avoid deep prop drilling or module issues) ---
const timeToMinutes = (time: string): number => {
  if (!time) return 0;
  const [h, m] = time.split(':').map(Number);
  return (h * 60) + m;
};

const minutesToTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
};

// Minimal initial program (will be replaced by database data)
const INITIAL_PROGRAM: Program = {
  id: crypto.randomUUID(),
  title: 'New Event',
  subtitle: '',
  date: new Date().toISOString().split('T')[0],
  startTime: '09:00',
  slots: []
};

// Export Dialog Component
interface ExportOptions {
  includeDetails: boolean;
  includeSpeakers: boolean;
}

const ExportDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  program: Program;
  options: ExportOptions;
  setOptions: React.Dispatch<React.SetStateAction<ExportOptions>>;
  onPrint: () => void;
}> = ({ isOpen, onClose, program, options, setOptions, onPrint }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyText = () => {
    let text = `${program.title}\n`;
    if (program.subtitle) text += `${program.subtitle}\n`;
    text += `Date: ${program.date} | Start: ${program.startTime}\n`;
    text += `----------------------------------------\n\n`;

    let runningMinutes = timeToMinutes(program.startTime);

    program.slots.forEach(slot => {
      const startStr = minutesToTime(runningMinutes);
      runningMinutes += slot.durationMinutes;

      text += `${startStr} - ${slot.title}`;
      if (slot.type === 'Break') text += ` (Break)`;
      text += `\n`;

      if (options.includeSpeakers && slot.speaker) {
        text += `Speaker: ${slot.speaker}\n`;
      }

      text += `Duration: ${slot.durationMinutes} mins\n`;

      if (options.includeDetails && slot.details) {
        text += `Details: ${slot.details}\n`;
      }
      text += `\n`;
    });

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 no-print">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Download className="text-rose-600 dark:text-rose-400" size={24} />
            Export Schedule
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Choose options for your export.
          </p>

          <div className="space-y-4">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <input
                type="checkbox"
                checked={options.includeSpeakers}
                onChange={(e) => setOptions(prev => ({ ...prev, includeSpeakers: e.target.checked }))}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
                <User size={18} className="text-slate-400" />
                <span className="font-medium">Include Speakers</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <input
                type="checkbox"
                checked={options.includeDetails}
                onChange={(e) => setOptions(prev => ({ ...prev, includeDetails: e.target.checked }))}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
                <AlignLeft size={18} className="text-slate-400" />
                <span className="font-medium">Include Details</span>
              </div>
            </label>
          </div>

          <div className="flex flex-col gap-3 mt-4">
            <button
              onClick={handleCopyText}
              className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
            >
              {copied ? <Check size={20} className="text-emerald-500" /> : <Clipboard size={20} />}
              {copied ? "Copied to Clipboard" : "Copy Schedule Text"}
            </button>

            <button
              onClick={() => {
                onClose();
                window.print();
              }}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2"
            >
              <FileText size={20} />
              Generate PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'editor';
  const importData = searchParams.get('import');
  const isReadOnly = mode === 'viewer';
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

  // Export State
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [printOptions, setPrintOptions] = useState<ExportOptions>({ includeDetails: true, includeSpeakers: true });

  useEffect(() => {
    if (isReadOnly) setIsShareOpen(false);
  }, [isReadOnly]);

  // Lifted Timer State
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [timerStartTimestamp, setTimerStartTimestamp] = useState<number | null>(null);

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
  const { data: fetchedProgram } = useQuery({
    queryKey: ['program', urlId],
    queryFn: () => getProgramById(urlId!),
    enabled: !!urlId,
  });

  useEffect(() => {
    if (fetchedProgram && fetchedProgram.id !== program.id) {
      console.log("Hydrating program from ID:", fetchedProgram.title);
      setProgram(fetchedProgram);
    } else if (importData) {
      const importedProgram = decodeData(importData);
      if (importedProgram && importedProgram.id !== program.id) {
        console.log("Hydrating program from URL Data:", importedProgram.title);
        setProgram(importedProgram);
      }
    }
  }, [importData, fetchedProgram]);

  // Persistence (Supabase)
  const mutation = useMutation({
    mutationFn: (p: Program) => {
      // Check if it exists? For now, we assume if we have an ID we "upsert" or "update".
      // Let's try update first. If DB empty, this fails. 
      // Actually we should perform an UPSERT logic or Try Create if Update fails
      // But updateProgramService attempts to update.
      // Let's use createProgramService but maybe modifying it to Upsert? 
      // Supabase insert with upsert: true is cleaner. 
      // Our createProgram uses insert(). 

      // Keep it simple: Try Update, if error (or row count 0?), Create.
      // But our service abstractions are separate.
      // Let's rely on Create for "Initial" valid UUIDs?
      // Or just try create. If ID exists, it throws...

      // Strategy: Since I just generated a new UUID, it definitely DOESN'T exist in DB.
      // So first save should be CREATE. Subsequent are UPDATE.

      // Hack for Prototype: Try Create, if conflict (23505), try Update.
      return createProgramService(p).catch(() => updateProgramService(p));
    }
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

        // Persist timer start timestamp so we can answer sync requests accurately
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
    };

    realtimeService.broadcast(state);
  };

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
  };

  const createProgram = (date: string) => {
    if (isReadOnly) return;
    const newProgram: Program = {
      id: crypto.randomUUID(),
      title: 'New Event',
      subtitle: 'Add subtitle',
      date: date,
      startTime: '09:00',
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

  // Timer Tick Logic
  useEffect(() => {
    let interval: number | undefined;
    if (isTimerActive) {
      interval = window.setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerActive]);

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

  // Wrappers
  const CalendarWrapper = () => {
    const navigate = useNavigate();

    // Fetch all programs from Supabase
    const { data: allPrograms = [], isLoading } = useQuery({
      queryKey: ['programs'],
      queryFn: getPrograms,
    });

    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-slate-500">Loading programs...</div>
        </div>
      );
    }

    return (
      <CalendarView
        programs={allPrograms}
        activeProgramId={program.id}
        onSelectProgram={(p) => { loadProgram(p); navigate(`/live?mode=${mode}`); }}
        onCreateProgram={(date) => { createProgram(date); navigate(`/editor?mode=${mode}`); }}
        onDelete={deleteProgram}
        onDuplicate={duplicateProgram}
      />
    );
  }

  const HomeWrapper = () => {
    const navigate = useNavigate();

    // Fetch all programs from Supabase
    const { data: allPrograms = [], isLoading } = useQuery({
      queryKey: ['programs'],
      queryFn: getPrograms,
    });

    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-slate-500">Loading programs...</div>
        </div>
      );
    }

    return (
      <HomeDashboard
        programs={allPrograms}
        activeProgramId={program.id}
        onSelectProgram={(p) => { loadProgram(p); navigate(`/live?mode=${mode}`); }}
        onCreateNew={() => { createProgram(new Date().toISOString().split('T')[0]); navigate(`/editor?mode=${mode}`); }}
        onDelete={deleteProgram}
        onDuplicate={duplicateProgram}
      />
    )
  }

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
      />
    );
  }

  return (
    <>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 no-print">

        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-colors">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center shadow-md">
                <Mic className="text-white" size={18} />
              </div>
              <div>
                <h1 className="font-bold text-lg tracking-tight leading-tight text-slate-900 dark:text-white flex items-center gap-2">
                  Kairon
                  {isReadOnly && <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500">VIEWER</span>}
                </h1>
                <div className="text-[10px] text-slate-500 dark:text-slate-500 font-medium uppercase tracking-widest">Event Manager</div>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <div className="hidden md:block text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 truncate max-w-[200px]">
                {program.title}
              </div>

              <button
                onClick={() => setIsExportOpen(true)}
                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-rose-600 dark:text-rose-400 transition-colors"
                title="Export to PDF"
              >
                <Download size={20} />
              </button>

              {!isReadOnly && (
                <button
                  onClick={() => setIsShareOpen(true)}
                  className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 transition-colors"
                  title="Share"
                >
                  <Share2 size={20} />
                </button>
              )}

              {/* Save Status Indicator */}
              {!isReadOnly && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium">
                  {saveStatus === 'saving' && (
                    <>
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                      <span className="text-yellow-600 dark:text-yellow-400">Saving...</span>
                    </>
                  )}
                  {saveStatus === 'saved' && (
                    <>
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span className="text-emerald-600 dark:text-emerald-400">Saved</span>
                    </>
                  )}
                  {saveStatus === 'unsaved' && (
                    <>
                      <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                      <span className="text-slate-500 dark:text-slate-400">Unsaved</span>
                    </>
                  )}
                </div>
              )}

              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
                title="Toggle Theme"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 overflow-y-auto custom-scrollbar relative">
          <div className="max-w-7xl mx-auto w-full h-full">
            <Routes>
              {!isReadOnly && !isCoEditor && <Route path="/" element={<HomeWrapper />} />}
              <Route path="/live" element={
                <LiveTimer
                  program={program}
                  currentSlotIndex={currentSlotIndex}
                  isTimerActive={isTimerActive}
                  secondsElapsed={secondsElapsed}
                  onToggleTimer={handleToggleTimer}
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
              {!isReadOnly && <Route path="/editor" element={
                <ProgramEditor
                  program={program}
                  isCoEditor={isCoEditor}
                  onUpdate={(p) => {
                    setProgram(p);
                    // Broadcast program changes to all viewers in real-time
                    realtimeService.broadcastProgram(p);
                    if (p.slots.length === 0) {
                      setCurrentSlotIndex(0);
                      setSecondsElapsed(0);
                      setIsTimerActive(false);
                    }
                  }}
                />
              } />}
              {!isReadOnly && !isCoEditor && <Route path="/calendar" element={<CalendarWrapper />} />}
            </Routes>
          </div>
        </main>

        {/* Bottom Dock */}
        <nav className="sticky bottom-6 mx-auto z-50 flex justify-center w-full px-4">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-700/50 px-2 md:px-4 py-2 rounded-2xl shadow-2xl shadow-slate-200/50 dark:shadow-slate-950/50 flex items-center gap-1 md:gap-3 overflow-x-auto no-scrollbar max-w-full">
            {!isReadOnly && !isCoEditor && (
              <NavLink to={`/?mode=${mode}${importData ? '&import=' + importData : ''}`} className={navLinkClass}>
                <Home size={20} className="mb-1" />
                <span className="text-[10px] font-semibold uppercase">Home</span>
              </NavLink>
            )}
            <NavLink to={`/live?mode=${mode}${importData ? '&import=' + importData : ''}`} className={navLinkClass}>
              <Play size={20} className="mb-1" />
              <span className="text-[10px] font-semibold uppercase">Live</span>
            </NavLink>
            <NavLink to={`/list?mode=${mode}${importData ? '&import=' + importData : ''}`} className={navLinkClass}>
              <List size={20} className="mb-1" />
              <span className="text-[10px] font-semibold uppercase">List</span>
            </NavLink>
            {!isReadOnly && (
              <>
                <NavLink to={`/editor?mode=${mode}${importData ? '&import=' + importData : ''}`} className={navLinkClass}>
                  <Edit3 size={20} className="mb-1" />
                  <span className="text-[10px] font-semibold uppercase">Edit</span>
                </NavLink>
                {!isCoEditor && (
                  <NavLink to={`/calendar?mode=${mode}${importData ? '&import=' + importData : ''}`} className={navLinkClass}>
                    <CalendarIcon size={20} className="mb-1" />
                    <span className="text-[10px] font-semibold uppercase">Cal</span>
                  </NavLink>
                )}
              </>
            )}
          </div>
        </nav>

        {!isReadOnly && (
          <ShareDialog isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} program={program} />
        )}
        <ExportDialog
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          program={program}
          options={printOptions}
          setOptions={setPrintOptions}
          onPrint={() => window.print()}
        />
      </div>

      {/* Hidden Printable Area */}
      <PrintableSchedule
        program={program}
        includeDetails={printOptions.includeDetails}
        includeSpeakers={printOptions.includeSpeakers}
      />
    </>
  );
};

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </QueryClientProvider>
  );
}

export default App;