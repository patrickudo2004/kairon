import { Program, Slot } from '../types';
import { PRODUCTION_TEMPLATES } from './rundownParser';

/**
 * Returns default canonical church service programs for offline Booth Mode.
 * Mirrors Winners Chapel Manchester operational service structure.
 */
export const getDefaultSeedPrograms = (organizationId: string = 'local-workspace'): Program[] => {
  const today = new Date().toISOString().split('T')[0];

  const sundayTemplate = PRODUCTION_TEMPLATES.find(t => t.id === 'church-sunday') || PRODUCTION_TEMPLATES[0];
  const midweekTemplate = PRODUCTION_TEMPLATES.find(t => t.id === 'church-midweek') || PRODUCTION_TEMPLATES[1];

  const sundaySlots: Slot[] = (sundayTemplate?.slots || []).map((s, idx) => ({
    id: `local-slot-sun-${idx + 1}`,
    title: s.title,
    speaker: s.speaker || '',
    durationMinutes: s.durationMinutes,
    type: s.type,
    details: s.details || '',
    productionNotes: s.productionNotes || '',
    prompterText: s.prompterText || '',
  }));

  const midweekSlots: Slot[] = (midweekTemplate?.slots || []).map((s, idx) => ({
    id: `local-slot-mid-${idx + 1}`,
    title: s.title,
    speaker: s.speaker || '',
    durationMinutes: s.durationMinutes,
    type: s.type,
    details: s.details || '',
    productionNotes: s.productionNotes || '',
    prompterText: s.prompterText || '',
  }));

  const sundayProgram: Program = {
    id: 'local-sunday-service',
    slug: 'sunday-celebration-service',
    title: 'Sunday Celebration Service',
    subtitle: 'Winners Chapel Manchester',
    date: today,
    startTime: sundayTemplate?.startTime || '09:00',
    endTime: '11:00',
    organizationId,
    isPublic: true,
    status: 'draft',
    isManualMode: false,
    isOnHold: false,
    currentSlotIndex: 0,
    isTimerActive: false,
    timerStartTimestamp: null,
    secondsElapsed: 0,
    slots: sundaySlots,
  };

  const midweekProgram: Program = {
    id: 'local-midweek-service',
    slug: 'midweek-communion-service',
    title: 'Midweek Communion Service',
    subtitle: 'Winners Chapel Manchester',
    date: today,
    startTime: midweekTemplate?.startTime || '18:30',
    endTime: '20:00',
    organizationId,
    isPublic: true,
    status: 'draft',
    isManualMode: false,
    isOnHold: false,
    currentSlotIndex: 0,
    isTimerActive: false,
    timerStartTimestamp: null,
    secondsElapsed: 0,
    slots: midweekSlots,
  };

  return [sundayProgram, midweekProgram];
};
