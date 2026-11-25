import { Program } from '../types';

export const KAIRON_IFRAME_SYNC_TYPE = 'KAIRON_TIMER_SYNC';

export interface DisplaySyncPayload {
  id?: string;
  program?: Program | null;
  currentSlotIndex?: number;
  isTimerActive?: boolean;
  secondsElapsed?: number;
  timerStartTimestamp?: number | null;
  isOnHold?: boolean;
  holdMessage?: string;
  isManualMode?: boolean;
  status?: 'draft' | 'live' | 'concluded' | 'archived';
  syncTimestamp?: number;
}

export type TimestampedProgram = Program & { _syncTimestamp?: number };

export const normalizeProgramId = (val?: string | null): string =>
  String(val || '').replace(/^local-/, '').trim();

const collectProgramIds = (prog?: Partial<Program> & { _id?: string; uuid?: string } | null): string[] => {
  if (!prog) return [];
  const raw = [prog.id, (prog as any)._id, (prog as any).uuid, prog.slug];
  return Array.from(new Set(raw.map((v) => normalizeProgramId(v)).filter(Boolean)));
};

/**
 * Determines whether an incoming BroadcastChannel / postMessage / Electron IPC sync payload
 * applies to this display instance (specific ?id= / slug OR global live feed).
 */
export const matchesDisplayTarget = (
  targetId: string | null | undefined,
  data: DisplaySyncPayload | null | undefined,
  currentBase?: Program | null
): boolean => {
  if (!data) return false;
  const cleanTarget = normalizeProgramId(targetId);
  const incomingIds = Array.from(
    new Set([
      normalizeProgramId(data.id),
      ...collectProgramIds(data.program as any),
    ].filter(Boolean))
  );

  // Specific display (?id=... or /p/:slug): match across id, _id, uuid, or slug
  if (cleanTarget) {
    if (data.id === targetId) return true;
    if (incomingIds.includes(cleanTarget)) return true;
    // Handle pre-Convex local-<uuid> display receiving first Convex _id update for same loaded program
    if (currentBase) {
      const baseIds = collectProgramIds(currentBase as any);
      if (incomingIds.some((id) => baseIds.includes(id))) return true;
    }
    return false;
  }

  // Global live display (no ?id=): accept active live broadcasts AND stop/concluded transitions
  const incomingStatus = data.status || data.program?.status;
  if (incomingStatus === 'live' || data.isTimerActive || data.program?.isTimerActive) {
    return true;
  }

  // Accept concluded / standby / pause / hold updates for the currently loaded global program
  if (incomingStatus === 'concluded' || data.isTimerActive === false || data.isOnHold !== undefined) {
    if (!currentBase) return incomingStatus === 'concluded';
    if (incomingIds.length === 0) return true;
    const baseIds = collectProgramIds(currentBase as any);
    return incomingIds.some((id) => baseIds.includes(id));
  }

  return false;
};

/**
 * Merges an incoming live/concluded sync payload cleanly onto the local display state.
 */
export const applyIncomingDisplaySync = (
  prev: TimestampedProgram | null,
  fallbackConvex: Program | null,
  data: DisplaySyncPayload,
  targetId?: string | null,
  extraCacheSuffix: string = ''
): TimestampedProgram | null => {
  let base: TimestampedProgram | null = prev || fallbackConvex;

  if (!base && typeof window !== 'undefined') {
    try {
      const cleanTarget = normalizeProgramId(targetId);
      const candidates = [
        targetId && extraCacheSuffix ? `kairon_offline_cache_${targetId}${extraCacheSuffix}` : null,
        cleanTarget && extraCacheSuffix ? `kairon_offline_cache_${cleanTarget}${extraCacheSuffix}` : null,
        targetId ? `kairon_offline_cache_${targetId}` : null,
        cleanTarget ? `kairon_offline_cache_${cleanTarget}` : null,
        'kairon_offline_cache_live',
        'kairon_program',
      ].filter(Boolean) as string[];
      for (const key of candidates) {
        const cached = localStorage.getItem(key);
        if (cached) {
          base = JSON.parse(cached);
          break;
        }
      }
    } catch {
      // ignore storage errors
    }
  }

  const syncTs = data.syncTimestamp || Date.now();
  let updated: TimestampedProgram | null = null;

  if (data.program) {
    const inc = data.program;
    const incomingStatus = data.status || inc.status;
    const isConcluded = incomingStatus === 'concluded' || inc.status === 'concluded';
    const incomingTimerActive = data.isTimerActive !== undefined ? data.isTimerActive : inc.isTimerActive;
    const effectiveIsActive = isConcluded
      ? false
      : (incomingTimerActive !== undefined ? Boolean(incomingTimerActive) : (base?.isTimerActive ?? false));

    const rawTimestamp = data.timerStartTimestamp !== undefined ? data.timerStartTimestamp : inc.timerStartTimestamp;
    const effectiveTimestamp = (isConcluded || !effectiveIsActive)
      ? null
      : (rawTimestamp !== undefined ? rawTimestamp : (base?.timerStartTimestamp ?? null));

    const effectiveSlotIdx = (data.currentSlotIndex !== undefined ? data.currentSlotIndex : inc.currentSlotIndex) !== undefined
      ? (data.currentSlotIndex !== undefined ? data.currentSlotIndex : inc.currentSlotIndex)!
      : (base?.currentSlotIndex ?? 0);

    const rawSeconds = data.secondsElapsed !== undefined ? data.secondsElapsed : inc.secondsElapsed;
    const effectiveSeconds = isConcluded
      ? 0
      : (rawSeconds !== undefined ? rawSeconds : (base?.secondsElapsed ?? 0));

    const isNowLive = !isConcluded && (effectiveIsActive || incomingStatus === 'live');
    const effectiveStatus = isConcluded
      ? 'concluded'
      : (isNowLive ? 'live' : (incomingStatus || base?.status || 'draft'));

    const effectiveHold = isConcluded
      ? false
      : (data.isOnHold !== undefined ? data.isOnHold : (inc.isOnHold ?? base?.isOnHold ?? false));

    const effectiveHoldMsg = isConcluded
      ? ''
      : (data.holdMessage !== undefined ? data.holdMessage : (inc.holdMessage ?? base?.holdMessage ?? ''));

    updated = {
      ...(base || {}),
      ...inc,
      id: data.id || inc.id || base?.id || targetId || 'live',
      slots: (inc.slots && inc.slots.length > 0) ? inc.slots : (base?.slots || []),
      isTimerActive: effectiveIsActive,
      timerStartTimestamp: effectiveTimestamp,
      currentSlotIndex: effectiveSlotIdx,
      secondsElapsed: effectiveSeconds,
      status: effectiveStatus as Program['status'],
      isOnHold: effectiveHold,
      holdMessage: effectiveHoldMsg,
      _syncTimestamp: syncTs,
    };
  } else if (base) {
    const incomingStatus = data.status;
    const isConcluded = incomingStatus === 'concluded';
    const effectiveIsActive = isConcluded
      ? false
      : (data.isTimerActive !== undefined ? Boolean(data.isTimerActive) : (base.isTimerActive ?? false));
    const effectiveStatus = isConcluded
      ? 'concluded'
      : (incomingStatus || (effectiveIsActive ? 'live' : base.status));
    const effectiveTimestamp = (isConcluded || !effectiveIsActive)
      ? null
      : (data.timerStartTimestamp !== undefined ? data.timerStartTimestamp : (base.timerStartTimestamp ?? null));
    const effectiveSeconds = isConcluded
      ? 0
      : (data.secondsElapsed !== undefined ? data.secondsElapsed : (base.secondsElapsed ?? 0));
    const effectiveHold = isConcluded
      ? false
      : (data.isOnHold !== undefined ? data.isOnHold : (base.isOnHold ?? false));

    updated = {
      ...base,
      ...data,
      id: data.id || base.id,
      slots: base.slots || [],
      isTimerActive: effectiveIsActive,
      timerStartTimestamp: effectiveTimestamp,
      secondsElapsed: effectiveSeconds,
      status: effectiveStatus as Program['status'],
      isOnHold: effectiveHold,
      holdMessage: isConcluded ? '' : (data.holdMessage !== undefined ? data.holdMessage : (base.holdMessage ?? '')),
      _syncTimestamp: syncTs,
    };
  }

  return updated || prev;
};

/**
 * Authoritative reconciliation between Convex query state and local BroadcastChannel/IPC/postMessage state.
 * Eliminates the broken OR-merge where a stale 'live' cache or lagging Convex snapshot permanently defeated 'concluded'.
 */
export const reconcileDisplayProgram = (params: {
  localProgram: TimestampedProgram | null;
  convexProgram: Program | null;
  localUpdatedAt?: number;
  preferLocal?: boolean;
}): Program | null => {
  const { localProgram, convexProgram, localUpdatedAt = 0, preferLocal = false } = params;

  if (!localProgram && !convexProgram) return null;

  const clampProgram = (
    base: Program,
    runtime: Program,
    slotsFallback?: Program['slots']
  ): Program => {
    const status = runtime.status || base.status || 'draft';
    const isConcluded = status === 'concluded';
    const isTimerActive = isConcluded ? false : Boolean(runtime.isTimerActive);
    const timerStartTimestamp = (isConcluded || !isTimerActive)
      ? null
      : (runtime.timerStartTimestamp ?? null);
    const secondsElapsed = isConcluded ? 0 : (runtime.secondsElapsed ?? 0);
    const isOnHold = isConcluded ? false : Boolean(runtime.isOnHold);

    return {
      ...base,
      ...runtime,
      id: runtime.id || base.id,
      slots: (runtime.slots && runtime.slots.length > 0)
        ? runtime.slots
        : (base.slots && base.slots.length > 0 ? base.slots : (slotsFallback || [])),
      status,
      isTimerActive,
      timerStartTimestamp,
      secondsElapsed,
      currentSlotIndex: runtime.currentSlotIndex ?? base.currentSlotIndex ?? 0,
      isOnHold,
      holdMessage: isConcluded ? '' : (runtime.holdMessage ?? base.holdMessage ?? ''),
    };
  };

  if (!convexProgram && localProgram) {
    return clampProgram(localProgram, localProgram);
  }
  if (!localProgram && convexProgram) {
    return clampProgram(convexProgram, convexProgram);
  }

  // Both localProgram and convexProgram exist
  const local = localProgram!;
  const convex = convexProgram!;
  const localSyncAt = Math.max(localUpdatedAt || 0, local._syncTimestamp || 0);
  const now = Date.now();
  const isFreshLocalBroadcast = localSyncAt > 0 && (now - localSyncAt < 15000);

  // 1. Local explicitly received 'concluded' while Convex still lags at 'live' (or failed/offline)
  if (local.status === 'concluded' && convex.status === 'live') {
    const convexStartedAfterLocalConclusion = Boolean(
      convex.isTimerActive &&
      convex.timerStartTimestamp &&
      localSyncAt > 0 &&
      convex.timerStartTimestamp > localSyncAt + 1500
    );
    if (!convexStartedAfterLocalConclusion) {
      return clampProgram(convex, local, convex.slots);
    }
    return clampProgram(local, convex, local.slots);
  }

  // 2. Convex explicitly reached 'concluded' while local cache is stale 'live'
  if (convex.status === 'concluded' && local.status === 'live') {
    const localStartedFreshly = Boolean(
      preferLocal ||
      (isFreshLocalBroadcast &&
        local.isTimerActive &&
        local.timerStartTimestamp &&
        local.timerStartTimestamp >= localSyncAt - 3000)
    );
    if (!localStartedFreshly) {
      return clampProgram(local, convex, local.slots);
    }
    return clampProgram(convex, local, convex.slots);
  }

  // 3. Authoritative local control mode (Booth / TestBypass / Embedded Studio Iframe / Fresh local broadcast)
  if (preferLocal || isFreshLocalBroadcast) {
    return clampProgram(convex, local, convex.slots);
  }

  // 4. Default Cloud mode: Convex is authoritative
  return clampProgram(local, convex, local.slots);
};

/**
 * Directly pushes current Studio program/timer state into a child preview iframe via window.postMessage.
 * Ensures instant 0ms synchronization in BOTH Web and packaged Electron file:// iframes.
 */
export const postSyncToIframe = (
  iframe: HTMLIFrameElement | null | undefined,
  program: Program | null | undefined
): void => {
  if (!iframe || !iframe.contentWindow || !program || !program.id) return;
  try {
    const isConcluded = program.status === 'concluded';
    const isTimerActive = isConcluded ? false : Boolean(program.isTimerActive);
    const payload: DisplaySyncPayload = {
      id: program.id,
      program: {
        ...program,
        isTimerActive,
        timerStartTimestamp: isTimerActive ? (program.timerStartTimestamp ?? null) : null,
        secondsElapsed: isConcluded ? 0 : (program.secondsElapsed ?? 0),
        isOnHold: isConcluded ? false : Boolean(program.isOnHold),
      },
      currentSlotIndex: program.currentSlotIndex ?? 0,
      isTimerActive,
      secondsElapsed: isConcluded ? 0 : (program.secondsElapsed ?? 0),
      timerStartTimestamp: isTimerActive ? (program.timerStartTimestamp ?? null) : null,
      isOnHold: isConcluded ? false : Boolean(program.isOnHold),
      holdMessage: isConcluded ? '' : (program.holdMessage || ''),
      isManualMode: Boolean(program.isManualMode),
      status: program.status,
      syncTimestamp: Date.now(),
    };
    iframe.contentWindow.postMessage({ type: KAIRON_IFRAME_SYNC_TYPE, payload }, '*');
  } catch {
    // Ignore cross-origin or detached iframe errors
  }
};
