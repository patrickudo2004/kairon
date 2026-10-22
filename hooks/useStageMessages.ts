import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation } from './useConvexMock';
import { api } from '../convex/_generated/api';
import { sendProPresenterStageMessage, clearProPresenterStageMessage } from '../services/proPresenterBridge';

export interface StageMessage {
    text: string;
    type: string;
    isStrobe?: boolean;
    expiresAt: number;
    programId?: string;
}

const readStoredPrompt = (programId?: string): StageMessage | null => {
    if (typeof window === 'undefined' || !programId) return null;
    try {
        const cleanId = programId.replace(/^local-/, '');
        const candidates = [
            `prompt_${programId}`,
            `prompt_${cleanId}`,
            'prompt_active'
        ];
        for (const key of candidates) {
            const raw = localStorage.getItem(key);
            if (raw) {
                const parsed: StageMessage = JSON.parse(raw);
                if (parsed && parsed.text && (!parsed.expiresAt || parsed.expiresAt > Date.now())) {
                    return parsed;
                } else if (parsed && parsed.expiresAt && parsed.expiresAt <= Date.now()) {
                    localStorage.removeItem(key);
                }
            }
        }
    } catch {}
    return null;
};

/**
 * useStageMessages Hook
 * Universal Offline & Online Stage Cue Dispatcher:
 * 1. BroadcastChannel ('kairon_stage_messages') for instant tab & iframe sync.
 * 2. Electron IPC ('stage-message-push') for cross-window multi-display sync (Screen 2 / Screen 3).
 * 3. LocalStorage persistence for instant cold-mount state.
 * 4. Convex Cloud mutation/query (non-blocking for cloud programs).
 * 5. ProPresenter 7 Network Bridge.
 */
export const useStageMessages = (programId: string | undefined) => {
    const isCloudProgram = Boolean(programId && !programId.startsWith('local-'));

    // Convex subscription when online with a cloud program ID
    const promptMessageReal = useQuery(
        api.stageMessages.getLatestMessage,
        isCloudProgram ? { programId: programId as any } : "skip"
    );

    const sendMutation = useMutation(api.stageMessages.sendMessage);
    const clearMutation = useMutation(api.stageMessages.clearMessages);

    const [localPrompt, setLocalPrompt] = useState<StageMessage | null>(() => readStoredPrompt(programId));
    const activeProgramIdRef = useRef(programId);
    activeProgramIdRef.current = programId;

    // Synchronize local storage & initial Electron cached state
    useEffect(() => {
        if (!programId) return;
        setLocalPrompt(readStoredPrompt(programId));

        const electron = typeof window !== 'undefined' ? ((window as any).electron || (window as any).electronAPI) : null;
        if (electron && typeof electron.getLastStageMessage === 'function') {
            electron.getLastStageMessage().then((cached: any) => {
                if (cached && (!cached.expiresAt || cached.expiresAt > Date.now())) {
                    const cleanPId = programId.replace(/^local-/, '');
                    const cleanMsgId = cached.programId ? String(cached.programId).replace(/^local-/, '') : '';
                    if (!cached.programId || cleanMsgId === cleanPId || cleanPId === '') {
                        setLocalPrompt(cached);
                    }
                }
            }).catch(() => {});
        }
    }, [programId]);

    // Cross-Tab & Iframe Sync via BroadcastChannel
    useEffect(() => {
        let channel: BroadcastChannel | null = null;
        try {
            channel = new BroadcastChannel('kairon_stage_messages');
            const handleMessage = (e: MessageEvent) => {
                if (!e.data) return;
                const pid = activeProgramIdRef.current;
                const cleanPId = pid ? pid.replace(/^local-/, '') : '';

                if (e.data.type === 'CLEAR') {
                    setLocalPrompt(null);
                } else if (e.data.type === 'CUE' && e.data.message) {
                    const msg: StageMessage = e.data.message;
                    const cleanMsgId = msg.programId ? String(msg.programId).replace(/^local-/, '') : '';
                    if (!msg.programId || !cleanPId || cleanMsgId === cleanPId) {
                        setLocalPrompt(msg);
                    }
                }
            };
            channel.addEventListener('message', handleMessage);
        } catch {}

        // Listen for storage events (across tabs/windows) & local prompt_update
        const handleStorage = () => {
            setLocalPrompt(readStoredPrompt(activeProgramIdRef.current));
        };
        window.addEventListener('storage', handleStorage);
        window.addEventListener('prompt_update', handleStorage);

        // Listen for Electron IPC stage messages
        let unsubIpc: (() => void) | null = null;
        const electron = typeof window !== 'undefined' ? ((window as any).electron || (window as any).electronAPI) : null;
        if (electron && typeof electron.onStageMessage === 'function') {
            unsubIpc = electron.onStageMessage((payload: any) => {
                if (!payload || payload.type === 'CLEAR') {
                    setLocalPrompt(null);
                } else if (payload.text) {
                    setLocalPrompt(payload);
                }
            });
        }

        return () => {
            if (channel) {
                channel.close();
            }
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('prompt_update', handleStorage);
            if (unsubIpc) {
                try { unsubIpc(); } catch {}
            }
        };
    }, []);

    const sendStageMessage = useCallback(async (text: string, type: string = 'alert', isStrobe: boolean = false, durationMs?: number) => {
        if (!programId || !text.trim()) return;
        const finalIsStrobe = Boolean(isStrobe || type === 'strobe');
        const cleanId = programId.replace(/^local-/, '');
        const expiresAt = Date.now() + (durationMs || (24 * 60 * 60 * 1000));

        const msg: StageMessage = {
            text: text.trim(),
            type,
            isStrobe: finalIsStrobe,
            expiresAt,
            programId
        };

        // 1. Universal local storage persistence
        try {
            localStorage.setItem(`prompt_${programId}`, JSON.stringify(msg));
            localStorage.setItem(`prompt_${cleanId}`, JSON.stringify(msg));
            localStorage.setItem('prompt_active', JSON.stringify(msg));
        } catch {}

        setLocalPrompt(msg);

        // 2. BroadcastChannel to local tabs and iframes
        try {
            const bc = new BroadcastChannel('kairon_stage_messages');
            bc.postMessage({ type: 'CUE', message: msg, programId });
            bc.close();
        } catch {}

        // 3. Electron IPC relay to secondary hardware displays (Screen 2 / Screen 3)
        const electron = typeof window !== 'undefined' ? ((window as any).electron || (window as any).electronAPI) : null;
        if (electron && typeof electron.sendStageMessage === 'function') {
            electron.sendStageMessage(msg);
        }

        // 4. In-DOM event dispatch
        try {
            window.dispatchEvent(new Event('prompt_update'));
        } catch {}

        // 5. ProPresenter 7 Network Bridge
        void sendProPresenterStageMessage(text.trim());

        // 6. Non-blocking Convex cloud sync (only if online cloud event)
        if (isCloudProgram) {
            try {
                await sendMutation({
                    programId,
                    text: text.trim(),
                    type,
                    isStrobe: finalIsStrobe,
                    durationMs
                });
            } catch (err) {
                console.warn("[Stage Messages] Cloud sync skipped/failed:", err);
            }
        }
    }, [programId, isCloudProgram, sendMutation]);

    const clearStageMessage = useCallback(async () => {
        if (!programId) return;
        const cleanId = programId.replace(/^local-/, '');

        // 1. Clear local storage
        try {
            localStorage.removeItem(`prompt_${programId}`);
            localStorage.removeItem(`prompt_${cleanId}`);
            localStorage.removeItem('prompt_active');
        } catch {}

        setLocalPrompt(null);

        // 2. BroadcastChannel clear
        try {
            const bc = new BroadcastChannel('kairon_stage_messages');
            bc.postMessage({ type: 'CLEAR', programId });
            bc.close();
        } catch {}

        // 3. Electron IPC clear
        const electron = typeof window !== 'undefined' ? ((window as any).electron || (window as any).electronAPI) : null;
        if (electron && typeof electron.sendStageMessage === 'function') {
            electron.sendStageMessage({ type: 'CLEAR', programId });
        }

        // 4. In-DOM event dispatch
        try {
            window.dispatchEvent(new Event('prompt_update'));
        } catch {}

        // 5. Clear ProPresenter 7 bridge
        void clearProPresenterStageMessage();

        // 6. Non-blocking Convex clear
        if (isCloudProgram) {
            try {
                await clearMutation({ programId });
            } catch (err) {
                console.warn("[Stage Messages] Cloud clear skipped/failed:", err);
            }
        }
    }, [programId, isCloudProgram, clearMutation]);

    const effectivePrompt = (localPrompt && (!localPrompt.expiresAt || localPrompt.expiresAt > Date.now())) 
        ? localPrompt 
        : (promptMessageReal as StageMessage | null);

    return {
        promptMessage: effectivePrompt,
        sendStageMessage,
        clearStageMessage
    };
};
