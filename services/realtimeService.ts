import { supabase } from './supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';
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
    private channel: RealtimeChannel | null = null;
    private programId: string | null = null;

    /**
     * Subscribe to real-time updates for a specific program
     */
    subscribe(
        programId: string,
        onTimerUpdate: (state: TimerState) => void,
        onProgramUpdate?: (program: Program) => void,
        onSyncRequest?: (payload: SyncRequestPayload) => void,
        onSyncResponse?: (payload: SyncResponsePayload) => void,
        onPresenceUpdate?: (presence: any) => void
    ): () => void {
        // Unsubscribe from previous channel if exists
        if (this.channel) {
            this.unsubscribe();
        }

        this.programId = programId;

        // Create a channel for this specific program
        this.channel = supabase.channel(`program:${programId}`, {
            config: {
                broadcast: { self: false }, // Don't receive own broadcasts
                presence: { key: programId }
            },
        });

        // Listen for timer updates
        this.channel.on(
            'broadcast',
            { event: 'timer_update' },
            (payload) => {
                console.log('Received timer update:', payload);
                onTimerUpdate(payload.payload as TimerState);
            }
        );

        // Late-join sync handshake
        if (onSyncRequest) {
            this.channel.on(
                'broadcast',
                { event: 'sync_request' },
                (payload) => {
                    console.log('Received sync request:', payload);
                    onSyncRequest(payload.payload as SyncRequestPayload);
                }
            );
        }

        if (onSyncResponse) {
            this.channel.on(
                'broadcast',
                { event: 'sync_response' },
                (payload) => {
                    console.log('Received sync response:', payload);
                    onSyncResponse(payload.payload as SyncResponsePayload);
                }
            );
        }

        // Listen for program content updates
        if (onProgramUpdate) {
            this.channel.on(
                'broadcast',
                { event: 'program_update' },
                (payload) => {
                    console.log('Received program update:', payload);
                    onProgramUpdate(payload.payload as Program);
                }
            );
        }

        // Handle Presence
        this.channel.on('presence', { event: 'sync' }, () => {
            const newState = this.channel?.presenceState();
            console.log('Presence sync:', newState);
            if (onPresenceUpdate) onPresenceUpdate(newState);
        });

        this.channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
            console.log('Presence join:', key, newPresences);
            if (onPresenceUpdate) onPresenceUpdate(this.channel?.presenceState());
        });

        this.channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
            console.log('Presence leave:', key, leftPresences);
            if (onPresenceUpdate) onPresenceUpdate(this.channel?.presenceState());
        });

        // Subscribe to the channel
        this.channel.subscribe(async (status) => {
            console.log(`[Realtime: ${programId}] status: ${status}`);

            if (status === 'SUBSCRIBED') {
                // New subscribers won't receive past broadcasts; request a state sync on join.
                this.requestSync();
            }
            if (status === 'CLOSED') {
                console.warn(`[Realtime: ${programId}] connection closed`);
            }
            if (status === 'CHANNEL_ERROR') {
                console.error(`[Realtime: ${programId}] channel error occurred`);
            }
            if (status === 'TIMED_OUT') {
                console.error(`[Realtime: ${programId}] subscription timed out`);
            }
        });

        // Return unsubscribe function
        return () => this.unsubscribe();
    }

    /**
     * Start tracking presence for this user
     */
    trackPresence(role: 'admin' | 'viewer', metadata: any = {}): void {
        if (!this.channel) return;

        console.log('Tracking presence as:', role);
        this.channel.track({
            role,
            online_at: new Date().toISOString(),
            ...metadata
        });
    }

    /**
     * Broadcast timer state to all subscribers
     */
    broadcast(state: TimerState): void {
        if (!this.channel) {
            console.warn('Cannot broadcast: No active channel');
            return;
        }

        console.log('Broadcasting timer state:', state);

        this.channel.send({
            type: 'broadcast',
            event: 'timer_update',
            payload: state,
        });
    }

    /**
     * Broadcast program content updates to all subscribers
     */
    broadcastProgram(program: Program): void {
        if (!this.channel) {
            console.warn('Cannot broadcast program: No active channel');
            return;
        }

        console.log('Broadcasting program update:', program);

        this.channel.send({
            type: 'broadcast',
            event: 'program_update',
            payload: program,
        });
    }

    requestSync(): void {
        if (!this.channel || !this.programId) return;

        this.channel.send({
            type: 'broadcast',
            event: 'sync_request',
            payload: {
                requestedAt: Date.now(),
            } satisfies SyncRequestPayload,
        });
    }

    sendSyncResponse(state: TimerState): void {
        if (!this.channel || !this.programId) return;

        this.channel.send({
            type: 'broadcast',
            event: 'sync_response',
            payload: {
                respondedAt: Date.now(),
                state,
            } satisfies SyncResponsePayload,
        });
    }

    /**
     * Get the current status of the channel
     */
    getStatus(): string {
        return this.channel?.state || 'closed';
    }

    /**
     * Check if the service has an active, ready channel
     */
    isActive(): boolean {
        return this.channel !== null && this.channel.state === 'joined';
    }

    /**
     * Unsubscribe from the current channel
     */
    unsubscribe(): void {
        if (this.channel) {
            console.log('Unsubscribing from realtime channel');
            supabase.removeChannel(this.channel);
            this.channel = null;
            this.programId = null;
        }
    }
}

// We keep a secondary singleton for legacy views that don't need isolation
// but recommendation is to use `new RealtimeService()` in wrappers.
export const realtimeService = new RealtimeService();
