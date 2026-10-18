import { Program } from '../types';

const LEDGER_STORAGE_KEY = 'kairon_offline_ledger_v1';
const ENTITLEMENT_STORAGE_KEY = 'kairon_entitlement_cache_v1';
const GRACE_PERIOD_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export interface OfflineLedgerEntry {
  programId: string;
  lastEdited: number;
  action: 'save_program' | 'update_timer';
  program?: Program;
  timerState?: {
    currentSlotIndex: number;
    isTimerActive: boolean;
    secondsElapsed: number;
    timerStartTimestamp: number | null;
    isOnHold?: boolean;
    holdMessage?: string;
    isManualMode?: boolean;
    status?: 'draft' | 'live' | 'concluded' | 'archived';
  };
}

export interface CachedEntitlement {
  orgId: string;
  orgName: string;
  subscriptionStatus: 'free' | 'pro' | 'enterprise';
  role: string;
  lastVerifiedAt: number;
}

/**
 * Reads the current offline mutation queue from localStorage.
 */
export function getOfflineLedger(): OfflineLedgerEntry[] {
  try {
    const raw = localStorage.getItem(LEDGER_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Enqueues a program or timer state change while offline, coalescing by programId + action
 * and preserving the newest lastEdited timestamp (Last-Write-Wins).
 */
export function enqueueOfflineChange(entry: OfflineLedgerEntry): number {
  try {
    const current = getOfflineLedger();
    const filtered = current.filter(
      (item) => !(item.programId === entry.programId && item.action === entry.action)
    );
    filtered.push({
      ...entry,
      lastEdited: entry.lastEdited || Date.now(),
    });
    localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent('kairon_ledger_updated', { detail: { count: filtered.length } }));
    return filtered.length;
  } catch (err) {
    console.warn('Failed to enqueue offline change:', err);
    return 0;
  }
}

/**
 * Clears the offline mutation queue after a successful reconnection sync.
 */
export function clearOfflineLedger(): void {
  try {
    localStorage.removeItem(LEDGER_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('kairon_ledger_updated', { detail: { count: 0 } }));
  } catch (err) {
    console.warn('Failed to clear offline ledger:', err);
  }
}

/**
 * Caches the user's organization subscription & role for the 14-day silent offline grace period.
 */
export function cacheWorkspaceEntitlement(entitlement: Omit<CachedEntitlement, 'lastVerifiedAt'>): void {
  try {
    const payload: CachedEntitlement = {
      ...entitlement,
      lastVerifiedAt: Date.now(),
    };
    localStorage.setItem(ENTITLEMENT_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Checks if the workspace has a valid cached Pro entitlement within the 14-day offline grace window.
 */
export function getCachedWorkspaceEntitlement(orgId?: string | null): CachedEntitlement | null {
  try {
    const raw = localStorage.getItem(ENTITLEMENT_STORAGE_KEY);
    if (!raw) return null;
    const cached: CachedEntitlement = JSON.parse(raw);
    if (orgId && cached.orgId !== orgId) return null;
    if (Date.now() - cached.lastVerifiedAt > GRACE_PERIOD_MS) return null;
    return cached;
  } catch {
    return null;
  }
}
