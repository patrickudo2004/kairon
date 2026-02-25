// Realtime Service Stub (Convex handles reactivity automatically)
import { Program } from '../types';

export interface TimerState {
    programId: string;
    isTimerActive: boolean;
    currentSlotIndex: number;
    secondsElapsed: number;
    timerStartTimestamp: number | null;
    isOnHold?: boolean;
    holdMessage?: string;
}

export interface SyncRequestPayload {
    requestedAt: number;
}

export interface SyncResponsePayload {
    respondedAt: number;
    state: TimerState;
}

export class RealtimeService {
    /**
     * Subscribe to real-time updates (Stubbed for Convex)
     */
    subscribe(
        programId: string,
        onTimerUpdate: (state: TimerState) => void,
        onProgramUpdate?: (program: Program) => void,
        onSyncRequest?: (payload: SyncRequestPayload) => void,
        onSyncResponse?: (payload: SyncResponsePayload) => void,
        onPresenceUpdate?: (presence: any) => void
    ): () => void {
        console.log(`[Convex: ${programId}] Subscription handled by reactive queries.`);
        return () => { };
    }

    trackPresence(role: 'admin' | 'viewer', metadata: any = {}): void { }
    broadcast(state: TimerState): void { }
    broadcastProgram(program: Program): void { }
    requestSync(): void { }
    sendSyncResponse(state: TimerState): void { }
    getStatus(): string { return 'joined'; }
    isActive(): boolean { return true; }
    unsubscribe(): void { }
}

export const realtimeService = new RealtimeService();
