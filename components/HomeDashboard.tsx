import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Program } from '../types';
import { Calendar, Clock, ArrowRight, Play, Plus, History, LayoutDashboard, Trash2, Copy, AlertTriangle, X, Eye, BarChart3, Edit3, Search, ChevronDown, ChevronRight, Filter, Layers } from 'lucide-react';
import { PreviewDrawer } from './PreviewDrawer';

interface HomeDashboardProps {
  programs: Program[];
  activeProgramId: string;
  activeSessions: Program[];
  onSelectProgram: (program: Program, seconds?: number) => void;
  onViewAnalytics: (id: string) => void;
  onCreateNew: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onStopLive?: (id: string) => void;
  onPlay?: (program: Program, seconds?: number) => void;
}

interface ProgramCardProps {
  program: Program;
  isPast?: boolean;
  isActive: boolean;
  isLive: boolean;
  onSelect: (program: Program, seconds?: number) => void;
  onPreview: (program: Program) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onViewAnalytics: (id: string) => void;
  onStopLive?: (id: string) => void;
  onPlay?: (program: Program, seconds?: number) => void;
}

const ProgramCard: React.FC<ProgramCardProps> = ({ program, isPast = false, isActive, isLive, onSelect, onPreview, onDelete, onDuplicate, onViewAnalytics, onStopLive, onPlay }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'editor';

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const confirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(program.id);
    setShowDeleteConfirm(false);
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDuplicate(program.id);
  };

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPreview(program);
  };

  const handleAnalytics = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewAnalytics(program.id);
  };

  // LOCAL TRACKING: Each card manages its own time state to prevent global leakage
  const [localSeconds, setLocalSeconds] = useState(program.secondsElapsed || 0);

  useEffect(() => {
    let interval: number | undefined;
    if (program.isTimerActive && program.timerStartTimestamp) {
      const tick = () => {
        const now = Date.now();
        const elapsed = Math.floor((now - program.timerStartTimestamp!) / 1000);
        setLocalSeconds(elapsed);
      };
      tick();
      interval = window.setInterval(tick, 1000);
    } else {
      setLocalSeconds(program.secondsElapsed || 0);
    }
    return () => clearInterval(interval);
  }, [program.isTimerActive, program.timerStartTimestamp, program.secondsElapsed]);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPlay) onPlay(program, localSeconds);
  };

  return (
    <div
      onClick={() => onSelect(program)}
      className={`
        group relative overflow-hidden p-5 rounded-xl border transition-all cursor-pointer
        ${isLive
          ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500/50 ring-1 ring-emerald-500/30'
          : isActive
            ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500/50 ring-2 ring-indigo-500 shadow-xl'
            : isPast
              ? 'bg-slate-100 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 shadow-lg dark:shadow-none hover:shadow-xl'
        }
      `}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 pr-8">
          <h3 className={`font-bold text-lg mb-1 ${isPast ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300'} transition-colors`}>
            {program.title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-500 line-clamp-1">{program.subtitle}</p>
        </div>

        {isLive ? (
          <div className="flex flex-col items-end gap-1">
            <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              Live Now
            </span>
            {onStopLive && (
              <button
                onClick={(e) => { e.stopPropagation(); onStopLive(program.id); }}
                className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
              >
                Deactivate
              </button>
            )}
          </div>
        ) : isActive ? (
          <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">
            Selected
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-500 mt-3 mb-6">
        <div className="flex items-center gap-1.5">
          <Calendar size={14} className={isPast ? "text-slate-400 dark:text-slate-600" : "text-indigo-500 dark:text-indigo-400"} />
          <span>{new Date(program.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={14} className={isPast ? "text-slate-400 dark:text-slate-600" : "text-indigo-500 dark:text-indigo-400"} />
          <span>{program.startTime}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400">{program.slots.length} Slots</span>
        </div>
      </div>

      {/* Slim Tactical Tray (Mobile: on Select, Desktop: on Hover) */}
      <div className={`
        absolute bottom-0 left-0 w-full bg-slate-900 dark:bg-indigo-950 h-12
        transition-transform duration-300 ease-out flex items-stretch border-t border-white/10
        ${isActive ? 'translate-y-0' : 'translate-y-full md:group-hover:translate-y-0'}
      `}>
        {/* secondary actions: left edge */}
        <button
          onClick={handleDuplicate}
          className="w-10 flex items-center justify-center hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          title="Duplicate"
        >
          <Copy size={14} />
        </button>

        {/* Primary Pillar: Edit/Workspace */}
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/editor?id=${program.id}&mode=${mode}`); }}
          className="flex-1 flex items-center justify-center gap-2 hover:bg-white/10 text-white transition-colors border-x border-white/5"
        >
          <Edit3 size={16} />
          <span className="text-[9px] font-black uppercase tracking-widest">Edit</span>
        </button>
        
        {/* Status-Aware Mega Central Pillar - Unconditionally Visible */}
        {isLive ? (
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(program, localSeconds); }}
            className="flex-[2] min-w-[120px] px-6 bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] animate-pulse"
          >
            <LayoutDashboard size={16} fill="currentColor" />
            <span className="text-[10px] font-black uppercase tracking-tight">Manage Live</span>
          </button>
        ) : (
          <button
            onClick={handlePlay}
            className="flex-[2] min-w-[120px] px-6 bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            <Play size={16} fill="currentColor" />
            <span className="text-[10px] font-black uppercase tracking-tight">Start Live</span>
          </button>
        )}
        
        {/* Primary Pillar: Preview */}
        <button
          onClick={handlePreview}
          className="flex-1 flex items-center justify-center gap-2 hover:bg-white/10 text-white transition-colors border-x border-white/5"
        >
          <Eye size={16} />
          <span className="text-[9px] font-black uppercase tracking-widest">Preview</span>
        </button>

        {/* secondary actions: right edge */}
        <button
          onClick={handleDelete}
          className="w-10 flex items-center justify-center hover:bg-rose-600 text-white/50 hover:text-white transition-colors"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={cancelDelete}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-full">
                <AlertTriangle size={24} className="text-rose-600 dark:text-rose-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                  Delete Program?
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Are you sure you want to delete <span className="font-semibold">"{program.title}"</span>? This action cannot be undone.
                </p>
              </div>
              <button
                onClick={cancelDelete}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={cancelDelete}
                className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium shadow-lg shadow-rose-500/20 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const HomeDashboard: React.FC<HomeDashboardProps> = ({
  programs,
  activeProgramId,
  activeSessions,
  onSelectProgram,
  onViewAnalytics,
  onCreateNew,
  onDelete,
  onDuplicate,
  onStopLive,
  onPlay
}) => {
  const [previewProgram, setPreviewProgram] = useState<Program | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(activeProgramId);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'editor';

  // Sync selected card when activeProgramId changes
  useEffect(() => {
    if (activeProgramId) setSelectedCardId(activeProgramId);
  }, [activeProgramId]);

  // Search, Range Filter & Grouping State for Past Events
  const [searchQuery, setSearchQuery] = useState('');
  const [historyScope, setHistoryScope] = useState<'90days' | 'all' | 'older'>('90days');
  const [groupBy, setGroupBy] = useState<'month' | 'series' | 'flat'>('month');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Sort programs: Newest date first
  const sortedPrograms = React.useMemo(() => {
    return [...programs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [programs]);

  // Use local-safe date calculation (YYYY-MM-DD)
  const today = new Date().toLocaleDateString('en-CA');
  const upcoming = React.useMemo(() => sortedPrograms.filter(p => (p.date || '') >= today), [sortedPrograms, today]);
  const pastAll = React.useMemo(() => sortedPrograms.filter(p => (p.date || '') < today), [sortedPrograms, today]);

  // 90-day cutoff date string
  const ninetyDaysAgo = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 90);
    return d.toISOString().split('T')[0];
  }, []);

  const pastRecentCount = React.useMemo(() => pastAll.filter(p => (p.date || '') >= ninetyDaysAgo).length, [pastAll, ninetyDaysAgo]);
  const pastOlderCount = React.useMemo(() => pastAll.filter(p => (p.date || '') < ninetyDaysAgo).length, [pastAll, ninetyDaysAgo]);

  // Scoped Past Events based on range filter
  const pastScoped = React.useMemo(() => {
    return pastAll.filter(p => {
      const pDate = p.date || '';
      if (historyScope === '90days') return pDate >= ninetyDaysAgo;
      if (historyScope === 'older') return pDate < ninetyDaysAgo;
      return true;
    });
  }, [pastAll, historyScope, ninetyDaysAgo]);

  // Filtered by Search Query
  const filteredPast = React.useMemo(() => {
    if (!searchQuery.trim()) return pastScoped;
    const q = searchQuery.toLowerCase().trim();
    return pastScoped.filter(p => {
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchSub = (p.subtitle || '').toLowerCase().includes(q);
      const matchDate = (p.date || '').includes(q);
      const matchSlots = p.slots.some(s => 
        s.title.toLowerCase().includes(q) || 
        (s.speaker || '').toLowerCase().includes(q) ||
        (s.details || '').toLowerCase().includes(q)
      );
      return matchTitle || matchSub || matchDate || matchSlots;
    });
  }, [pastScoped, searchQuery]);

  // Grouped Past Events
  const groupedPast = React.useMemo(() => {
    if (groupBy === 'flat') return { 'All Past Events': filteredPast };

    const groups: Record<string, Program[]> = {};

    if (groupBy === 'month') {
      filteredPast.forEach(p => {
        let key = 'Earlier';
        if (p.date) {
          const d = new Date(p.date);
          if (!isNaN(d.getTime())) {
            key = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
          }
        }
        if (!groups[key]) groups[key] = [];
        groups[key].push(p);
      });
      return groups;
    }

    if (groupBy === 'series') {
      filteredPast.forEach(p => {
        let key = p.title.trim();
        if (/sunday/i.test(key)) key = 'Sunday Services';
        else if (/midweek|wednesday|communion/i.test(key)) key = 'Midweek Services';
        else if (/conference|summit/i.test(key)) key = 'Conferences & Summits';
        else if (/wedding/i.test(key)) key = 'Weddings & Celebrations';
        else key = 'Special Events';

        if (!groups[key]) groups[key] = [];
        groups[key].push(p);
      });
      return groups;
    }

    return { 'All Past Events': filteredPast };
  }, [filteredPast, groupBy]);

  // Expand the first group by default
  useEffect(() => {
    const keys = Object.keys(groupedPast);
    if (keys.length > 0 && expandedGroups.size === 0) {
      setExpandedGroups(new Set([keys[0]]));
    }
  }, [groupedPast]);

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandAllGroups = () => {
    setExpandedGroups(new Set(Object.keys(groupedPast)));
  };

  const collapseAllGroups = () => {
    setExpandedGroups(new Set());
  };

  return (
    <div className="max-w-4xl mx-auto p-6 pb-24">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <LayoutDashboard className="text-indigo-600 dark:text-indigo-500" />
            My Programs
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your broadcast & live service schedules</p>
        </div>
        <button
          onClick={onCreateNew}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl font-medium shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
        >
          <Plus size={20} />
          Create New
        </button>
      </div>

      {/* Active/Upcoming Section */}
      <div className="mb-10">
        <h2 className="text-sm font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Clock size={16} /> Upcoming & Active ({upcoming.length})
        </h2>

        {upcoming.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcoming.map(program => (
              <ProgramCard
                key={program.id}
                program={program}
                isActive={program.id === selectedCardId}
                isLive={activeSessions.some(as => String(as.id) === String(program.id))}
                onSelect={(p, s) => { setSelectedCardId(p.id); onSelectProgram(p, s); }}
                onPreview={setPreviewProgram}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                onViewAnalytics={onViewAnalytics}
                onStopLive={onStopLive}
                onPlay={(p, s) => onPlay?.(p, s)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 border-dashed rounded-xl p-8 text-center text-slate-500">
            <p>No upcoming programs.</p>
            <button onClick={onCreateNew} className="text-indigo-600 dark:text-indigo-400 hover:underline mt-2 text-sm">Create one now</button>
          </div>
        )}
      </div>

      {/* Past Section with Search, 90-Day Range & Grouping */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-sm font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <History size={16} /> Past Events ({pastAll.length})
          </h2>

          {/* Quick Scope Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl text-xs font-mono">
            <button
              onClick={() => setHistoryScope('90days')}
              className={`px-3 py-1 rounded-lg transition-all ${historyScope === '90days' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
            >
              Recent 90 Days ({pastRecentCount})
            </button>
            <button
              onClick={() => setHistoryScope('older')}
              className={`px-3 py-1 rounded-lg transition-all ${historyScope === 'older' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
            >
              Older ({pastOlderCount})
            </button>
            <button
              onClick={() => setHistoryScope('all')}
              className={`px-3 py-1 rounded-lg transition-all ${historyScope === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
            >
              All ({pastAll.length})
            </button>
          </div>
        </div>

        {/* Search & Grouping Bar */}
        <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-3 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
          <div className="relative w-full sm:flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, speaker, scripture, or date..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl pl-9 pr-8 py-2 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end font-mono text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 shrink-0">
              <Layers size={13} />
              <span className="text-[11px] uppercase font-semibold">Group:</span>
            </div>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as any)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl px-2.5 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="month">📅 By Month</option>
              <option value="series">🏷️ By Regular Title</option>
              <option value="flat">📋 Flat List</option>
            </select>

            {groupBy !== 'flat' && (
              <div className="flex items-center gap-1 ml-1">
                <button
                  onClick={expandAllGroups}
                  className="px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-lg text-[10px] text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  title="Expand all groups"
                >
                  Expand
                </button>
                <button
                  onClick={collapseAllGroups}
                  className="px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-lg text-[10px] text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  title="Collapse all groups"
                >
                  Collapse
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Grouped Accordions or Cards */}
        {filteredPast.length > 0 ? (
          <div className="space-y-4">
            {Object.entries(groupedPast).map(([groupTitle, groupPrograms]) => {
              const isGroupExpanded = expandedGroups.has(groupTitle);
              return (
                <div key={groupTitle} className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white/50 dark:bg-slate-900/20 shadow-sm">
                  {/* Collapsible Accordion Header */}
                  <button
                    onClick={() => toggleGroup(groupTitle)}
                    className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center justify-between transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="text-slate-400">
                        {isGroupExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white tracking-wide">
                        {groupTitle}
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                        {groupPrograms.length} {groupPrograms.length === 1 ? 'event' : 'events'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {isGroupExpanded ? 'Click to collapse' : 'Click to expand'}
                    </span>
                  </button>

                  {/* Accordion Content */}
                  {isGroupExpanded && (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-150">
                      {groupPrograms.map(program => (
                        <ProgramCard
                          key={program.id}
                          program={program}
                          isPast={true}
                          isActive={program.id === selectedCardId}
                          isLive={activeSessions.some(as => String(as.id) === String(program.id))}
                          onSelect={(p, s) => { setSelectedCardId(p.id); onSelectProgram(p, s); }}
                          onPreview={setPreviewProgram}
                          onDelete={onDelete}
                          onDuplicate={onDuplicate}
                          onViewAnalytics={onViewAnalytics}
                          onStopLive={onStopLive}
                          onPlay={(p, s) => onPlay?.(p, s)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 dark:text-slate-600 font-mono text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            {searchQuery ? `No past events matching "${searchQuery}".` : 'No past history in selected range.'}
          </div>
        )}
      </div>

      <PreviewDrawer
        program={previewProgram}
        isOpen={!!previewProgram}
        onClose={() => setPreviewProgram(null)}
        onOpenInEditor={(p) => {
          setPreviewProgram(null);
          onSelectProgram(p);
        }}
      />
    </div>
  );
};

export default HomeDashboard;