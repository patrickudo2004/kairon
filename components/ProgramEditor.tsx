import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Program, Slot, SLOT_PRESETS } from '../types';
import { Trash2, Plus, GripVertical, Sparkles, Clock, Calendar, AlertCircle, Timer, Copy, ChevronDown, ChevronUp, Users, Globe, Link as LinkIcon, Share2 } from 'lucide-react';
import { generateProgramDraft } from '../services/geminiService';
import { EmbedSnippet } from './EmbedSnippet';


import { timeToMinutes, minutesToTime } from '../utils/time';
import { ProductionHUD } from './ProductionHUD';

interface ProgramEditorProps {
  program: Program;
  onUpdate: (program: Program) => void;
  isCoEditor?: boolean;
  isAdminOnline?: boolean;
  onEndEvent?: () => void;
  onNudge?: (minutes: number) => void;
  currentSlotIndex?: number;
}

const ProgramEditor: React.FC<ProgramEditorProps> = ({
  program,
  onUpdate,
  isCoEditor = false,
  isAdminOnline = true,
  onEndEvent,
  onNudge,
  currentSlotIndex = 0
}) => {
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedSlots, setExpandedSlots] = useState<Set<string>>(new Set());


  // Drag and Drop Refs
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);



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

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragItem.current = index;
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    if (dragItem.current === null || dragItem.current === index) return;

    const newSlots = [...program.slots];
    const draggedItemContent = newSlots[dragItem.current];

    newSlots.splice(dragItem.current, 1);
    newSlots.splice(index, 0, draggedItemContent);

    dragItem.current = index;
    onUpdate({ ...program, slots: newSlots });
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('opacity-50');
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
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
    <div className="max-w-5xl mx-auto p-6 pb-24">

      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Program Editor
          </h2>
          <p className="text-slate-500 dark:text-slate-400">Configure schedule timeline and slots.</p>
        </div>
        <div className="flex items-center gap-3">
          {remainingMinutes !== null && Math.abs(remainingMinutes) > 0 && (
            <button
              onClick={() => {
                // This will be handled by a prop or event bubble for real AI call
                (onUpdate as any)({ ...program, _triggerRebalance: true });
              }}
              className="flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 rounded-lg font-medium transition-all hover:bg-amber-200 dark:hover:bg-amber-500/20"
            >
              <Sparkles size={18} />
              Re-balance with AI
            </button>
          )}
          {!isCoEditor && (
            <button
              onClick={() => setIsAIDialogOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-lg font-medium shadow-lg transition-all"
            >
              <Sparkles size={18} />
              AI Draft
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
              value={program.title}
              onChange={(e) => {
                onUpdate({ ...program, title: e.target.value });
              }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium transition-colors"
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

          {/* Analytics Fields (Pro Tier) */}
          <div className="md:col-span-1 border-l border-slate-200 dark:border-slate-800 pl-4">
            <label className="block text-xs font-medium text-amber-600 dark:text-amber-400 uppercase mb-1 flex items-center gap-2">
              <Users size={12} /> Attendees
            </label>
            <input
              type="number"
              value={program.estimatedAttendees || 0}
              onChange={(e) => onUpdate({ ...program, estimatedAttendees: parseInt(e.target.value) || 0 })}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none text-sm transition-colors"
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-amber-600 dark:text-amber-400 uppercase mb-1 flex items-center gap-2">
              Avg. Hourly Rate
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input
                type="number"
                value={program.averageHourlyRate || 0}
                onChange={(e) => onUpdate({ ...program, averageHourlyRate: parseInt(e.target.value) || 0 })}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md pl-7 pr-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none text-sm transition-colors"
              />
            </div>
          </div>

          {/* Time Summary Widget */}
          <div className="md:col-span-1 lg:col-span-1 flex flex-col justify-center pl-4 border-l border-slate-200 dark:border-slate-800 gap-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500 dark:text-slate-400">Total Program</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{Math.floor(totalDuration / 60)}h {totalDuration % 60}m</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500 dark:text-slate-400">Finishes At</span>
              <span className="text-sm font-mono text-indigo-600 dark:text-indigo-300">{minutesToTime(calculatedEndMinutes)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Public Access Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden mb-8 shadow-xl transition-all duration-500">
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Globe size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Public Access</h3>
              <p className="text-xs text-slate-500 font-medium">Allow attendees to view the schedule via a public link.</p>
            </div>
          </div>
          <button
            onClick={() => onUpdate({ ...program, isPublic: !program.isPublic })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ring-2 ring-offset-2 ring-transparent ${program.isPublic ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${program.isPublic ? 'translate-x-[26px]' : 'translate-x-[4px]'
                }`}
            />
          </button>
        </div>

        {program.isPublic && (
          <div className="p-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-2 flex items-center gap-2">
                  <LinkIcon size={12} /> Custom Event Slug
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-sm font-mono whitespace-nowrap">kairon.app/p/</span>
                  <input
                    type="text"
                    value={program.slug || ''}
                    placeholder="my-great-event"
                    onChange={(e) => {
                      const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
                      onUpdate({ ...program, slug: sanitized });
                    }}
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm transition-colors"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={`/p/${program.slug || program.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all shadow-sm group"
                >
                  <Share2 size={16} className="group-hover:text-indigo-600" />
                  Preview Portal
                </a>
              </div>
            </div>

            {program.slug && (
              <EmbedSnippet slug={program.slug} />
            )}
          </div>
        )}
      </div>

      {/* Slots List */}
      <div className="space-y-3">
        {program.slots.map((slot, index) => (
          <div
            key={slot.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnter={(e) => handleDragEnter(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            className="group flex flex-col bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-move md:cursor-default"
          >
            {/* Main Row */}
            <div className="flex flex-col md:flex-row items-center gap-4 p-4">

              {/* Time Column */}
              <div className="md:w-24 flex flex-col items-center justify-center border-r border-slate-200 dark:border-slate-700 pr-4 mr-2 pointer-events-none">
                <span className="text-xs font-mono text-slate-400 dark:text-slate-500">{getSlotStartTime(index)}</span>
              </div>

              <div className="text-slate-400 dark:text-slate-600 hidden md:block cursor-move">
                <GripVertical size={20} />
              </div>

              <div className="flex-1 grid grid-cols-12 gap-4 w-full items-center">
                <div className="col-span-12 md:col-span-4 flex items-center gap-2">
                  <button
                    onClick={() => toggleSlotDetails(slot.id)}
                    className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    title={expandedSlots.has(slot.id) ? "Hide Details" : "Show Details"}
                  >
                    {expandedSlots.has(slot.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <input
                    type="text"
                    value={slot.title}
                    onChange={(e) => handleSlotChange(slot.id, 'title', e.target.value)}
                    placeholder="Session Title"
                    className="w-full bg-transparent text-slate-900 dark:text-white font-medium focus:underline outline-none placeholder-slate-400 dark:placeholder-slate-600"
                  />
                </div>
                <div className="col-span-12 md:col-span-3">
                  <input
                    type="text"
                    value={slot.speaker}
                    onChange={(e) => handleSlotChange(slot.id, 'speaker', e.target.value)}
                    placeholder="Speaker Name"
                    className="w-full bg-transparent text-indigo-600 dark:text-indigo-300 text-sm focus:underline outline-none placeholder-slate-400 dark:placeholder-slate-600"
                  />
                </div>
                <div className="col-span-6 md:col-span-2">
                  <input
                    list="slot-types"
                    type="text"
                    value={slot.type}
                    onChange={(e) => handleSlotChange(slot.id, 'type', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs rounded px-2 py-1 border border-slate-200 dark:border-slate-700 outline-none"
                    placeholder="Type..."
                  />
                </div>
                <div className="col-span-6 md:col-span-2 flex items-center gap-2 justify-end">
                  <input
                    type="number"
                    value={slot.durationMinutes}
                    onChange={(e) => handleSlotChange(slot.id, 'durationMinutes', parseInt(e.target.value) || 0)}
                    className="w-16 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm rounded px-2 py-1 border border-slate-200 dark:border-slate-700 outline-none text-center focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-slate-500 w-6">min</span>
                </div>
              </div>

              <div className="flex items-center border-l border-slate-200 dark:border-slate-700 pl-2 ml-2 gap-1">
                <button
                  onClick={() => duplicateSlot(index)}
                  className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-2 rounded transition-colors"
                  title="Duplicate Slot"
                >
                  <Copy size={18} />
                </button>
                <button
                  onClick={() => removeSlot(slot.id)}
                  className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-500 p-2 rounded transition-colors"
                  title="Remove Slot"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {/* Details Section (Collapsible) */}
            {expandedSlots.has(slot.id) && (
              <div className="px-4 pb-4 pl-12 md:pl-36">
                <textarea
                  value={slot.details || ''}
                  onChange={(e) => handleSlotChange(slot.id, 'details', e.target.value)}
                  placeholder="Add notes, abstract, or detailed description for this slot..."
                  className="w-full h-24 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:ring-1 focus:ring-indigo-500 outline-none resize-none transition-colors"
                />
              </div>
            )}
          </div>
        ))}
      </div>

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

      {/* AI Modal */}
      {isAIDialogOpen && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="text-indigo-600 dark:text-indigo-400" size={24} />
                AI Program Drafter
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Paste an email, agenda document text, or rough notes. Gemini will organize it.
              </p>
            </div>
            <div className="p-6">
              <textarea
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="e.g., 'Starts at 9am with Opening Remarks for 15m, then Keynote... ends at 1pm'"
                className="w-full h-48 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-mono text-sm transition-colors"
              />
            </div>
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3">
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
          </div>
        </div>
      )}

      <datalist id="slot-types">
        {SLOT_PRESETS.map(preset => (
          <option key={preset} value={preset} />
        ))}
      </datalist>

      {/* Production Control HUD */}
      <ProductionHUD
        isTimerActive={program.isTimerActive ?? false}
        isAdminOnline={isAdminOnline}
        onEndEvent={onEndEvent || (() => { })}
        onNudge={onNudge || (() => { })}
        currentSlotTitle={program.slots[currentSlotIndex]?.title}
      />
    </div>
  );
};

export default ProgramEditor;