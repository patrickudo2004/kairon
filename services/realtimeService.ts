import { supabase } from './supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface TimerState {
    programId: string;
    isTimerActive: boolean;
    currentSlotIndex: number;
    secondsElapsed: number;
    timerStartTimestamp: number | null;
}

export class RealtimeService {
    private channel: RealtimeChannel | null = null;
    private programId: string | null = null;

    /**
     * Subscribe to real-time updates for a specific program
     */
    subscribe(
        programId: string,
        onUpdate: (state: TimerState) => void
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
                onUpdate(payload.payload as TimerState);
            }
        );

        // Subscribe to the channel
        this.channel.subscribe((status) => {
            console.log(`Realtime subscription status: ${status}`);
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
