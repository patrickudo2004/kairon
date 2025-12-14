import { supabase } from './supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Program } from '../types';

export interface TimerState {
    programId: string;
    isTimerActive: boolean;
    currentSlotIndex: number;
    secondsElapsed: number;
    timerStartTimestamp: number | null;
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
        onSyncResponse?: (payload: SyncResponsePayload) => void
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

        // Subscribe to the channel
        this.channel.subscribe((status) => {
            console.log(`Realtime subscription status: ${status}`);

            // New subscribers won't receive past broadcasts; request a state sync on join.
            if (status === 'SUBSCRIBED') {
                this.requestSync();
            }
        });

        // Return unsubscribe function
        return () => this.unsubscribe();
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

// Export a singleton instance
export const realtimeService = new RealtimeService();
