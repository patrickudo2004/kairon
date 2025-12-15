import { useEffect, useCallback } from 'react';
import { TimerState } from '../services/realtimeService';
import { Program } from '../types';

const CHANNEL_NAME = 'kairon_local_sync';

type MessageType =
    | { type: 'TIMER_STATE', payload: TimerState }
    | { type: 'PROGRAM_UPDATE', payload: Program }
    | { type: 'REQUEST_SYNC' };

export const useLocalSync = (
    channelName: string = CHANNEL_NAME,
    onTimerState?: (state: TimerState) => void,
    onProgramUpdate?: (program: Program) => void,
    onRequestSync?: () => void
) => {

    const broadcastTimerState = useCallback((state: TimerState) => {
        const channel = new BroadcastChannel(channelName);
        channel.postMessage({ type: 'TIMER_STATE', payload: state });
        channel.close();
    }, [channelName]);

    const broadcastProgramUpdate = useCallback((program: Program) => {
        const channel = new BroadcastChannel(channelName);
        channel.postMessage({ type: 'PROGRAM_UPDATE', payload: program });
        channel.close();
    }, [channelName]);

    const requestSync = useCallback(() => {
        const channel = new BroadcastChannel(channelName);
        channel.postMessage({ type: 'REQUEST_SYNC' });
        channel.close();
    }, [channelName]);

    useEffect(() => {
        const channel = new BroadcastChannel(channelName);

        channel.onmessage = (event: MessageEvent<MessageType>) => {
            const { type, payload } = event.data as any; // Type assertion helps if discriminated union check fails slightly

            switch (type) {
                case 'TIMER_STATE':
                    onTimerState?.(payload);
                    break;
                case 'PROGRAM_UPDATE':
                    onProgramUpdate?.(payload);
                    break;
                case 'REQUEST_SYNC':
                    onRequestSync?.();
                    break;
            }
        };

        return () => {
            channel.close();
        };
    }, [channelName, onTimerState, onProgramUpdate, onRequestSync]);

    return {
        broadcastTimerState,
        broadcastProgramUpdate,
        requestSync
    };
};
