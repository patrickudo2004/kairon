import React, { useState } from 'react';
import { Program } from '../types';
import { Calendar, Clock, ArrowRight, Play, Plus, History, LayoutDashboard, Trash2, Copy, AlertTriangle, X, Eye, BarChart3 } from 'lucide-react';
import { PreviewDrawer } from './PreviewDrawer';

interface HomeDashboardProps {
  programs: Program[];
  activeProgramId: string;
  liveProgramId: string | null;
  onSelectProgram: (program: Program) => void;
  onViewAnalytics: (id: string) => void;
  onCreateNew: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

interface ProgramCardProps {
  program: Program;
  isPast?: boolean;
  isActive: boolean;
  isLive: boolean;
  onSelect: (program: Program) => void;
  onPreview: (program: Program) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onViewAnalytics: (id: string) => void;
}

const ProgramCard: React.FC<ProgramCardProps> = ({ program, isPast = false, isActive, isLive, onSelect, onPreview, onDelete, onDuplicate, onViewAnalytics }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  return (
    <div
      onClick={() => onSelect(program)}
      className={`
        group relative overflow-hidden p-5 rounded-xl border transition-all cursor-pointer
        ${isLive
          ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500/50 ring-1 ring-emerald-500/30'
          : isActive
            ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500/50 ring-1 ring-indigo-500/30 shadow-md'
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
          <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            Live Now
          </span>
        ) : isActive ? (
          <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">
            Selected
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-500 mt-4">
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

      <div className={`absolute right-4 bottom-4 flex gap-2 transition-opacity ${isPast ? 'opacity-0 group-hover:opacity-100' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'}`}>
        <button
          onClick={handlePreview}
          className="bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-slate-400 hover:text-emerald-600 p-2 rounded-full shadow-lg transition-colors border border-slate-200 dark:border-slate-800"
          title="Quick Preview"
        >
          <Eye size={16} />
        </button>
        <button
          onClick={handleDuplicate}
          className="bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-slate-400 hover:text-indigo-600 p-2 rounded-full shadow-lg transition-colors border border-slate-200 dark:border-slate-800"
          title="Duplicate Program"
        >
          <Copy size={16} />
        </button>
        <button
          onClick={handleAnalytics}
          className="bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-900/30 text-slate-400 hover:text-amber-600 p-2 rounded-full shadow-lg transition-colors border border-slate-200 dark:border-slate-800"
          title="Service Report (Analytics)"
        >
          <BarChart3 size={16} />
        </button>
        <button
          onClick={handleDelete}
          className="bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-slate-400 hover:text-rose-600 p-2 rounded-full shadow-lg transition-colors border border-slate-200 dark:border-slate-800"
          title="Delete Program"
        >
          <Trash2 size={16} />
        </button>
        <div className={`bg-indigo-600 p-2 rounded-full text-white shadow-lg ${isPast ? 'hidden' : 'block'}`}>
          <Play size={16} fill="currentColor" />
        </div>
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
  liveProgramId,
  onSelectProgram,
  onCreateNew,
  onDelete,
  onDuplicate,
  onViewAnalytics
}) => {
  const [previewProgram, setPreviewProgram] = useState<Program | null>(null);

  // Sort programs: Newest date first
  const sortedPrograms = [...programs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const today = new Date().toISOString().split('T')[0];
  const upcoming = sortedPrograms.filter(p => p.date >= today);
  const past = sortedPrograms.filter(p => p.date < today);

  return (
    <div className="max-w-4xl mx-auto p-6 pb-24">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <LayoutDashboard className="text-indigo-600 dark:text-indigo-500" />
            My Programs
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your conference schedules</p>
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
          <Clock size={16} /> Upcoming & Active
        </h2>

        {upcoming.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcoming.map(program => (
              <ProgramCard
                key={program.id}
                program={program}
                isActive={program.id === activeProgramId}
                isLive={program.id === liveProgramId}
                onSelect={onSelectProgram}
                onPreview={setPreviewProgram}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                onViewAnalytics={onViewAnalytics}
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

      {/* Past Section */}
      <div>
        <h2 className="text-sm font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <History size={16} /> Past Events
        </h2>
        {past.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {past.map(program => (
              <ProgramCard
                key={program.id}
                program={program}
                isPast={true}
                isActive={program.id === activeProgramId}
                isLive={program.id === liveProgramId}
                onSelect={onSelectProgram}
                onPreview={setPreviewProgram}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                onViewAnalytics={onViewAnalytics}
              />
            ))}
          </div>
        ) : (
          <p className="text-slate-400 dark:text-slate-600 text-sm italic">No past history.</p>
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