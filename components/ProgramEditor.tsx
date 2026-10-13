import React, { useState, useMemo } from 'react';
import { Program, Slot, SLOT_PRESETS } from '../types';
import { Trash2, Plus, GripVertical, Sparkles, Clock, Calendar, AlertCircle, Timer, Copy, ChevronDown, ChevronUp, Users, Globe, Link as LinkIcon, Share2, Crown, Cast, Shield, BookOpen, Check } from 'lucide-react';
import { generateProgramDraft } from '../services/geminiService';
import { parseRundownText, PRODUCTION_TEMPLATES } from '../utils/rundownParser';
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
        delay: 200,
        tolerance: 8,
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
      title: 'New Session Item',
      speaker: '',
      durationMinutes: 15,
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

  const parsedPreview = useMemo(() => {
    if (!aiInput.trim()) return null;
    return parseRundownText(aiInput);
  }, [aiInput]);

  const handleApplyTemplate = (templateId: string) => {
    const tmpl = PRODUCTION_TEMPLATES.find(t => t.id === templateId);
    if (!tmpl) return;
    const newSlots: Slot[] = tmpl.slots.map(s => ({
      ...s,
      id: crypto.randomUUID ? crypto.randomUUID() : `slot-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    }));
    onUpdate({
      ...program,
      title: program.title === 'New Event' || !program.title ? tmpl.name : program.title,
      startTime: program.startTime || tmpl.startTime,
      slots: newSlots
    });
    setIsAIDialogOpen(false);
    setAiInput('');
  };

  const handleMagicDraft = () => {
    if (!aiInput.trim()) return;
    const result = parseRundownText(aiInput);
    if (result && result.slots.length > 0) {
      const merged: Program = {
        ...program,
        title: result.title && (program.title === 'New Event' || !program.title) ? result.title : program.title,
        startTime: result.startTime || program.startTime,
        slots: result.slots
      };
      onUpdate(merged);
      setIsAIDialogOpen(false);
      setAiInput('');
    }
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

  const getSlotStartTime = (index: number) => {
    let minutes = startMinutes;
    for (let i = 0; i < index; i++) {
      minutes += program.slots[i].durationMinutes;
    }
    return minutesToTime(minutes);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 pb-32 overflow-x-hidden font-sans">

      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-slate-200 dark:border-[#22262E] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1C2028] border border-slate-200 dark:border-[#2D333F] text-[10px] font-mono tracking-widest text-slate-600 dark:text-[#9BA3AF] uppercase">Rundown Architect</span>
            <span className="text-xs text-[#0EA5E9] font-mono font-medium">Timeline Editor</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">Program Editor</h1>
          <p className="text-xs text-slate-500 dark:text-[#8A93A4]">Structure your service rundown, assign cues, and configure timing targets.</p>
        </div>

        <div className="flex items-center gap-2">
          {remainingMinutes !== null && Math.abs(remainingMinutes) > 0 && !isReadOnly && (
            <button
              onClick={() => {
                (onUpdate as any)({ ...program, _triggerRebalance: true });
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30 rounded-md font-mono text-xs font-semibold transition-all"
            >
              <Sparkles size={13} />
              <span>AI Rebalance</span>
              {!isPro && <Crown size={10} className="text-[#F59E0B] ml-1" />}
            </button>
          )}

          {!isCoEditor && !isReadOnly && (
            <button
              onClick={() => setIsAIDialogOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0EA5E9] hover:bg-[#0284C7] text-white rounded-md font-mono text-xs font-semibold transition-all shadow-sm"
            >
              <Sparkles size={13} />
              <span>AI Draft</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Configuration Panel */}
      <div className="bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#22262E] rounded-md overflow-hidden mb-6 shadow-sm">
        
        {/* Titles Row */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-200 dark:border-[#22262E]">
          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-500 dark:text-[#8A93A4] uppercase mb-1">
              Event / Service Title
            </label>
            <input
              type="text"
              readOnly={isReadOnly}
              value={program.title}
              onChange={(e) => onUpdate({ ...program, title: e.target.value })}
              className={`w-full bg-slate-50 dark:bg-[#090A0C] border border-slate-200 dark:border-[#22262E] rounded px-3 py-2 text-sm text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-[#0EA5E9] ${isReadOnly ? 'cursor-default' : ''}`}
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-500 dark:text-[#8A93A4] uppercase mb-1">
              Subtitle / Theme / Scripture
            </label>
            <input
              type="text"
              readOnly={isReadOnly}
              value={program.subtitle}
              onChange={(e) => onUpdate({ ...program, subtitle: e.target.value })}
              className={`w-full bg-slate-50 dark:bg-[#090A0C] border border-slate-200 dark:border-[#22262E] rounded px-3 py-2 text-sm text-[#0EA5E9] font-mono focus:outline-none focus:border-[#0EA5E9] ${isReadOnly ? 'cursor-default' : ''}`}
            />
          </div>
        </div>

        {/* Timing Controls & Telemetry Readout */}
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/50 dark:bg-[#0E1013]">
          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-500 dark:text-[#8A93A4] uppercase mb-1 flex items-center gap-1.5">
              <Calendar size={11} className="text-[#0EA5E9]" /> Date
            </label>
            <input
              type="date"
              readOnly={isReadOnly}
              value={program.date}
              onChange={(e) => onUpdate({ ...program, date: e.target.value })}
              className="w-full bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#22262E] rounded px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#0EA5E9]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-500 dark:text-[#8A93A4] uppercase mb-1 flex items-center gap-1.5">
              <Clock size={11} className="text-[#10B981]" /> Start Time
            </label>
            <input
              type="time"
              readOnly={isReadOnly}
              value={program.startTime}
              onChange={(e) => onUpdate({ ...program, startTime: e.target.value })}
              className="w-full bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#22262E] rounded px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#0EA5E9]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-500 dark:text-[#8A93A4] uppercase mb-1 flex items-center gap-1.5">
              <Clock size={11} className="text-[#F59E0B]" /> Target End Time
            </label>
            <input
              type="time"
              readOnly={isReadOnly}
              value={program.endTime || ''}
              onChange={(e) => onUpdate({ ...program, endTime: e.target.value })}
              className="w-full bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#22262E] rounded px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#0EA5E9]"
            />
          </div>

          {/* Precision Timing Telemetry */}
          <div className="flex items-center justify-between lg:justify-end gap-5 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-[#22262E] pt-2 sm:pt-0 sm:pl-4">
            <div>
              <span className="block text-[9px] font-mono text-slate-400 dark:text-[#6A7382] uppercase">Total Duration</span>
              <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                {Math.floor(totalDuration / 60)}h {totalDuration % 60}m
              </span>
            </div>
            <div className="text-right">
              <span className="block text-[9px] font-mono text-slate-400 dark:text-[#6A7382] uppercase">Projected End</span>
              <span className="text-xs font-mono font-bold text-[#0EA5E9]">
                {minutesToTime(calculatedEndMinutes)}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Public Access Link Bar */}
      <div className="bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#22262E] rounded-md p-3.5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-slate-100 dark:bg-[#181B22] border border-slate-200 dark:border-[#22262E] text-[#0EA5E9] rounded">
            <Globe size={15} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white font-mono uppercase">Public Attendee Link</h4>
            <p className="text-[11px] text-slate-500 dark:text-[#8A93A4]">Allow congregants and guests to view live schedule countdown on their phones.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => onUpdate({ ...program, isPublic: !program.isPublic })}
            disabled={isReadOnly}
            className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all border ${
              program.isPublic
                ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
                : 'bg-slate-100 dark:bg-[#181B22] border-slate-200 dark:border-[#22262E] text-slate-500 dark:text-[#6A7382]'
            }`}
          >
            {program.isPublic ? 'PUBLIC ENABLED' : 'PRIVATE'}
          </button>
          
          {program.isPublic && (
            <a
              href={`/p/${program.slug || program.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-slate-100 dark:bg-[#181B22] hover:bg-slate-200 dark:hover:bg-[#22262E] border border-slate-200 dark:border-[#22262E] text-slate-700 dark:text-white rounded text-xs font-mono flex items-center gap-1 transition-colors"
            >
              <Share2 size={12} />
              <span>Preview</span>
            </a>
          )}
        </div>
      </div>

      {/* DnD Rundown Slot Stack */}
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
          <div className="space-y-2">
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

      {/* Add Slot Button */}
      {!isReadOnly && (
        <button
          onClick={addSlot}
          className="w-full mt-4 py-3 bg-slate-50 dark:bg-[#0D0F12] hover:bg-slate-100 dark:hover:bg-[#14171E] border border-dashed border-slate-300 dark:border-[#22262E] hover:border-[#0EA5E9] text-slate-600 dark:text-[#8A93A4] hover:text-slate-900 dark:hover:text-white rounded-md text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 group shadow-sm"
        >
          <Plus size={14} className="group-hover:scale-110 text-[#0EA5E9] transition-transform" />
          <span>Add Session Slot</span>
          {remainingMinutes !== null && remainingMinutes > 0 && (
            <span className="text-[10px] text-[#10B981] font-normal ml-2">
              ({remainingMinutes}m unallocated budget remaining)
            </span>
          )}
        </button>
      )}

      {/* Smart Rundown Importer Modal */}
      {isAIDialogOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#22262E] rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-[#22262E] flex items-center justify-between bg-slate-50/50 dark:bg-[#0D0F12]">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-[#0EA5E9]/10 text-[#0EA5E9]">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono uppercase tracking-wide">
                    Smart Rundown Importer
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-[#8A93A4] font-mono">
                    Deterministic offline parser • Zero cloud tokens • 100% private
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAIDialogOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg p-1 leading-none"
              >
                ✕
              </button>
            </div>

            {/* Quick Production Templates */}
            <div className="p-4 border-b border-slate-200 dark:border-[#22262E] bg-slate-50 dark:bg-[#090A0C]">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-[#8A93A4] mb-2 flex items-center gap-1.5">
                <BookOpen size={12} className="text-[#0EA5E9]" />
                <span>Quick Production Templates</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PRODUCTION_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => handleApplyTemplate(tmpl.id)}
                    className="p-2 rounded-lg border border-slate-200 dark:border-[#22262E] bg-white dark:bg-[#121418] hover:border-[#0EA5E9] hover:bg-[#0EA5E9]/5 text-left transition-all group"
                  >
                    <div className="font-mono font-bold text-[11px] text-slate-900 dark:text-white group-hover:text-[#0EA5E9] truncate">
                      {tmpl.name.split(' (')[0]}
                    </div>
                    <div className="font-mono text-[9px] text-slate-400 dark:text-[#6A7382]">
                      {tmpl.slots.length} items • {tmpl.slots.reduce((a, b) => a + b.durationMinutes, 0)}m
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea Paste Area */}
            <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-3">
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-500 dark:text-[#8A93A4] uppercase tracking-wider mb-1.5">
                  Or Paste Order of Service / Agenda Text
                </label>
                <textarea
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Paste WhatsApp messages, order of service, or schedules. Examples:&#10;1. Opening Prayer - Pastor David (5 mins)&#10;2. Praise & Worship - Choir (20 mins)&#10;3. Bible Reading: Psalm 23 - Sister Grace (5m)&#10;4. Sermon: Word of Faith - Bishop David (45m)"
                  className="w-full h-36 bg-slate-50 dark:bg-[#090A0C] border border-slate-200 dark:border-[#22262E] rounded-lg p-3 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#4B5563] focus:outline-none focus:border-[#0EA5E9] resize-none"
                />
              </div>

              {/* Live Parsed Preview */}
              {parsedPreview && parsedPreview.slots.length > 0 && (
                <div className="border border-slate-200 dark:border-[#22262E] rounded-lg p-3 bg-slate-50/50 dark:bg-[#090A0C]/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] font-bold text-[#10B981] uppercase tracking-wider flex items-center gap-1">
                      <Check size={12} />
                      Parsed {parsedPreview.slots.length} slots ({parsedPreview.slots.reduce((a, b) => a + b.durationMinutes, 0)}m total)
                    </span>
                    {parsedPreview.title && (
                      <span className="font-mono text-[10px] text-slate-400 truncate max-w-[200px]">
                        Event: {parsedPreview.title}
                      </span>
                    )}
                  </div>
                  <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
                    {parsedPreview.slots.map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px] font-mono p-1.5 bg-white dark:bg-[#121418] rounded border border-slate-200 dark:border-[#22262E]">
                        <div className="truncate flex-1 mr-2">
                          <span className="text-slate-400 mr-1.5">{idx + 1}.</span>
                          <span className="font-semibold text-slate-900 dark:text-white">{s.title}</span>
                          {s.speaker && <span className="text-[#0EA5E9] ml-2 font-medium">({s.speaker})</span>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">{s.type}</span>
                          <span className="text-[#10B981] font-bold">{s.durationMinutes}m</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-200 dark:border-[#22262E] flex items-center justify-between bg-slate-50 dark:bg-[#0E1013]">
              <span className="text-[10px] font-mono text-slate-400">
                Supports WhatsApp, bullets, tabs, and time ranges (09:00 - 09:30)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAIDialogOpen(false)}
                  className="px-3.5 py-2 text-xs font-mono text-slate-500 dark:text-[#8A93A4] hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMagicDraft}
                  disabled={!parsedPreview || parsedPreview.slots.length === 0}
                  className="px-4 py-2 bg-[#0EA5E9] hover:bg-[#0284C7] disabled:opacity-40 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <span>Import {parsedPreview?.slots.length ? `${parsedPreview.slots.length} Slots` : 'Rundown'} ❯</span>
                </button>
              </div>
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
