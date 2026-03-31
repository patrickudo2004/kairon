import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Program, Slot, SLOT_PRESETS } from '../types';
import { Trash2, Plus, GripVertical, Sparkles, Clock, Calendar, AlertCircle, Timer, Copy, ChevronDown, ChevronUp, Users, Globe, Link as LinkIcon, Share2, Crown } from 'lucide-react';
import { generateProgramDraft } from '../services/geminiService';
import { EmbedSnippet } from './EmbedSnippet';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  TouchSensor,
  MouseSensor
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableSlot } from './SortableSlot';

import { timeToMinutes, minutesToTime } from '../utils/time';

interface ProgramEditorProps {
  program: Program;
  onUpdate: (program: Program) => void;
  isCoEditor?: boolean;
  isReadOnly?: boolean;
  isPro?: boolean;
}

const ProgramEditor: React.FC<ProgramEditorProps> = ({
  program,
  onUpdate,
  isCoEditor = false,
  isReadOnly = false,
  isPro = false
}) => {
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedSlots, setExpandedSlots] = useState<Set<string>>(new Set());

  // Sensors for DnD
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // Reduced for snappier feel
        tolerance: 8, // Increased for finger jitter
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleSlotChange = (id: string, field: keyof Slot, value: any) => {
    const newSlots = program.slots.map(s => s.id === id ? { ...s, [field]: value } : s);
    onUpdate({ ...program, slots: newSlots });
  };

  const removeSlot = (id: string) => {
    const newSlots = program.slots.filter(s => s.id !== id);
    onUpdate({ ...program, slots: newSlots });
  };

  const duplicateSlot = (index: number) => {
    const slotToClone = program.slots[index];
    const newSlot: Slot = {
      ...slotToClone,
      id: crypto.randomUUID(),
      title: `${slotToClone.title} (Copy)`
    };
    const newSlots = [...program.slots];
    newSlots.splice(index + 1, 0, newSlot);
    onUpdate({ ...program, slots: newSlots });
  };

  const addSlot = () => {
    const newSlot: Slot = {
      id: crypto.randomUUID(),
      title: 'New Session',
      speaker: '',
      durationMinutes: 30,
      type: 'Talk'
    };
    const newSlots = [...program.slots, newSlot];
    onUpdate({ ...program, slots: newSlots });
  };

  const toggleSlotDetails = (id: string) => {
    setExpandedSlots(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleMagicDraft = async () => {
    if (!aiInput.trim()) return;
    setIsGenerating(true);
    const newProgram = await generateProgramDraft(aiInput);
    if (newProgram) {
      // Preserve ID and Date, replace content
      const merged = { ...program, ...newProgram, id: program.id, date: program.date };
      onUpdate(merged);

      setIsAIDialogOpen(false);
    }
    setIsGenerating(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = program.slots.findIndex((s) => s.id === active.id);
      const newIndex = program.slots.findIndex((s) => s.id === over.id);
      const newSlots = arrayMove(program.slots, oldIndex, newIndex);
      onUpdate({ ...program, slots: newSlots });
    }
  };


  // Time Calculations
  const startMinutes = useMemo(() => timeToMinutes(program.startTime || "09:00"), [program.startTime]);
  const targetEndMinutes = useMemo(() => program.endTime ? timeToMinutes(program.endTime) : null, [program.endTime]);

  const totalDuration = program.slots.reduce((acc, slot) => acc + slot.durationMinutes, 0);
  const calculatedEndMinutes = startMinutes + totalDuration;
  const remainingMinutes = targetEndMinutes !== null ? targetEndMinutes - calculatedEndMinutes : null;

  // Helper to get slot start time
  const getSlotStartTime = (index: number) => {
    let minutes = startMinutes;
    for (let i = 0; i < index; i++) {
      minutes += program.slots[i].durationMinutes;
    }
    return minutesToTime(minutes);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 pb-32 overflow-x-hidden">

      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Program Editor
          </h2>
          <p className="text-slate-500 dark:text-slate-400">Configure schedule timeline and slots.</p>
        </div>
        <div className="flex items-center gap-3">
          {remainingMinutes !== null && Math.abs(remainingMinutes) > 0 && !isReadOnly && (
            <button
              onClick={() => {
                // This will be handled by a prop or event bubble for real AI call
                (onUpdate as any)({ ...program, _triggerRebalance: true });
              }}
              className="group relative flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 rounded-lg font-medium transition-all hover:bg-amber-200 dark:hover:bg-amber-500/20"
            >
              <Sparkles size={18} />
              Re-balance with AI
              {!isPro && (
                <Crown size={12} className="text-amber-500 ml-1" />
              )}
            </button>
          )}
          {!isCoEditor && !isReadOnly && (
            <button
              onClick={() => setIsAIDialogOpen(true)}
              className="group relative flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-lg font-medium shadow-lg transition-all"
            >
              <Sparkles size={18} />
              AI Draft
              {!isPro && (
                <div className="absolute -top-2 -right-2 bg-amber-500 text-[8px] px-1.5 py-0.5 rounded-full border border-white dark:border-slate-900 flex items-center gap-0.5 shadow-sm">
                  <Crown size={8} /> PRO
                </div>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Config Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden mb-8 shadow-xl">
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Conference Title</label>
            <input
              type="text"
              readOnly={isReadOnly}
              value={program.title}
              onChange={(e) => {
                onUpdate({ ...program, title: e.target.value });
              }}
              className={`w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium transition-colors ${isReadOnly ? 'cursor-default' : ''}`}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Subtitle</label>
            <input
              type="text"
              value={program.subtitle}
              onChange={(e) => {
                onUpdate({ ...program, subtitle: e.target.value });
              }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
            />
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6 bg-slate-50 dark:bg-slate-900/50">
          <div className="md:col-span-1 relative">
            <label className="block text-xs font-medium text-slate-500 uppercase mb-1 flex items-center gap-2">
              <Calendar size={12} /> Date
            </label>
            <input
              type="date"
              value={program.date}
              onChange={(e) => onUpdate({ ...program, date: e.target.value })}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-colors"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-slate-500 uppercase mb-1 flex items-center gap-2">
              <Clock size={12} /> Start Time
            </label>
            <input
              type="time"
              value={program.startTime}
              onChange={(e) => onUpdate({ ...program, startTime: e.target.value })}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-colors"
            />
          </div>

          <div className="md:col-span-1 border-l border-slate-200 dark:border-slate-800 pl-4">
            <label className="block text-xs font-medium text-slate-500 uppercase mb-1 flex items-center gap-2">
              <Clock size={12} /> Target End Time
            </label>
            <input
              type="time"
              value={program.endTime || ''}
              onChange={(e) => onUpdate({ ...program, endTime: e.target.value })}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-colors"
            />
          </div>

          {/* Time Summary Widget */}
          <div className="md:col-span-1 lg:col-span-2 flex items-center justify-end pr-2 gap-6 border-l border-slate-200 dark:border-slate-800">
            <div className="text-right">
              <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-tight">Total Duration</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{Math.floor(totalDuration / 60)}h {totalDuration % 60}m</span>
            </div>
            <div className="text-right">
              <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-tight">Projected End</span>
              <span className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">{minutesToTime(calculatedEndMinutes)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Public Access Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden mb-8 shadow-xl transition-all duration-500 w-full flex flex-col">
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0">
              <Globe size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider truncate">Public Access</h3>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate sm:whitespace-normal">Allow attendees to view the schedule via a public link.</p>
            </div>
          </div>
          <button
            onClick={() => onUpdate({ ...program, isPublic: !program.isPublic })}
            className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors focus:outline-none shrink-0 ${program.isPublic ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
          >
            <span
              className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${program.isPublic ? 'translate-x-[18px] sm:translate-x-[26px]' : 'translate-x-[2px] sm:translate-x-[4px]'
                }`}
            />
          </button>
        </div>

        {program.isPublic && (
          <div className="p-4 sm:p-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 sm:gap-6">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Public Link Active</h4>
                <p className="text-xs text-slate-500 mb-3 sm:mb-4">Anyone with this link can view the live countdown.</p>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-2 sm:p-3 rounded-lg border border-slate-200 dark:border-slate-700/50 font-mono text-[10px] sm:text-xs text-indigo-600 dark:text-indigo-400 break-all">
                  {window.location.origin.replace('http://', '').replace('https://', '')}/p/{program.id}
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <a
                  href={`/p/${program.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm group"
                >
                  <Share2 size={16} className="group-hover:text-indigo-600" />
                  Preview
                </a>
              </div>
            </div>

            <div className="mt-8">
              <EmbedSnippet slug={program.id} />
            </div>
          </div>
        )}
      </div>

      {/* Slots List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <SortableContext
          items={program.slots.map(s => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {program.slots.map((slot, index) => (
              <SortableSlot
                key={slot.id}
                slot={slot}
                index={index}
                isReadOnly={isReadOnly}
                isExpanded={expandedSlots.has(slot.id)}
                onToggleDetails={toggleSlotDetails}
                onSlotChange={handleSlotChange}
                onDuplicate={duplicateSlot}
                onRemove={removeSlot}
                getSlotStartTime={getSlotStartTime}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {!isReadOnly && (
        <button
          onClick={addSlot}
          className="w-full mt-4 py-4 border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 rounded-xl hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex flex-col items-center justify-center gap-1 font-medium group"
        >
          <div className="flex items-center gap-2">
            <Plus size={20} className="group-hover:scale-110 transition-transform" />
            <span>Add Session Slot</span>
          </div>
          {remainingMinutes !== null && remainingMinutes > 0 && (
            <span className="text-xs text-emerald-600/80 dark:text-emerald-500/80 font-normal">
              You have {remainingMinutes} minutes remaining in your budget
            </span>
          )}
        </button>
      )}

      {/* AI Modal */}
      {isAIDialogOpen && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="text-indigo-600 dark:text-indigo-400" size={24} />
                    AI Program Drafter
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                    Paste an email, agenda document text, or rough notes. Gemini will organize it.
                  </p>
                </div>
                {!isPro && (
                  <div className="bg-amber-500/10 text-amber-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider">
                    <Crown size={12} /> Pro Feature
                  </div>
                )}
              </div>
            </div>
            <div className={`p-6 ${!isPro ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}>
              <textarea
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="e.g., 'Starts at 9am with Opening Remarks for 15m, then Keynote... ends at 1pm'"
                className="w-full h-48 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-mono text-sm transition-colors"
                disabled={!isPro}
              />
            </div>
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              {!isPro ? (
                <div className="flex flex-col items-center gap-4 text-center">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    AI generation is reserved for **Kairon Pro** workspaces.
                  </p>
                  <button
                    onClick={() => {
                        window.location.href = '/admin?tab=branding'; // Redirect to branding tab to see Pro status
                    }}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                  >
                    <Crown size={18} /> Upgrade to Kairon Pro
                  </button>
                </div>
              ) : (
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setIsAIDialogOpen(false)}
                    className="px-4 py-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleMagicDraft}
                    disabled={isGenerating || !aiInput.trim()}
                    className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20"
                  >
                    {isGenerating ? (
                      <><span className="animate-spin">⏳</span> Drafting...</>
                    ) : (
                      <><Sparkles size={18} /> Generate Program</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <datalist id="slot-types">
        {SLOT_PRESETS.map(preset => (
          <option key={preset} value={preset} />
        ))}
      </datalist>
    </div>
  );
};

export default ProgramEditor;