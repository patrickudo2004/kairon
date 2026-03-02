// Common presets for the UI, but user can type anything
export const SLOT_PRESETS = [
  'Talk',
  'Break',
  'Keynote',
  'Panel',
  'Worship',
  'Sermon',
  'Music'
] as const;

export type SlotType = string;


export interface Slot {
  id: string;
  title: string;
  speaker: string;
  durationMinutes: number;
  type: SlotType;
  actualDuration?: number; // For analytics
  details?: string; // Additional detailed description
  productionNotes?: string; // Phase 18: Internal cues for staff
}

export interface Program {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  startTime: string; // "HH:mm" 24h format
  endTime?: string; // "HH:mm" 24h format (Target end time)
  organizationId?: string;
  estimatedAttendees?: number; // Phase 3
  averageHourlyRate?: number; // Phase 3
  slots: Slot[];
  // Timer State (Persisted in DB)
  isManualMode?: boolean;
  isOnHold?: boolean;
  holdMessage?: string;
  currentSlotIndex?: number;
  isTimerActive?: boolean;
  timerStartTimestamp?: number | null;
  secondsElapsed?: number;
  slug?: string;
  isPublic?: boolean;
  status?: 'draft' | 'live' | 'concluded';
}

export interface AnalyticsData {
  name: string;
  planned: number;
  actual: number;
}

// Phase 1: Identity & Organizations
export type UserRole = 'admin' | 'manager' | 'operator';

export interface Profile {
  id: string;
  fullName: string;
  avatarUrl?: string;
}
export interface TimerState {
  programId: string;
  isTimerActive: boolean;
  currentSlotIndex: number;
  secondsElapsed: number;
  timerStartTimestamp: number | null;
  isOnHold?: boolean;
  holdMessage?: string;
  status?: 'draft' | 'live' | 'concluded';
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  brandColor?: string;
  subscriptionStatus?: 'free' | 'pro' | 'enterprise';
  stripeCustomerId?: string;
  createdBy: string;
  createdAt: string;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: UserRole;
}