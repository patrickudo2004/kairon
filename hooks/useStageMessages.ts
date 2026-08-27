import { useState, useEffect } from 'react';
import { useQuery, useMutation } from './useConvexMock';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';

interface StageMessage {
    text: string;
    type: string;
    isStrobe?: boolean;
    expiresAt: number;
}

const isTestBypass = () => {
    try {
        return typeof window !== 'undefined' && (window.location.search.includes('testBypass=true') || localStorage.getItem('testBypass') === 'true');
    } catch {
        return false;
    }
};

/**
 * useStageMessages Hook
 * Uses Convex for persistent, reactive stage cues.
 */
export const useStageMessages = (programId: string | undefined) => {
    const testMode = isTestBypass();

    // Stage display views call this to get the latest message
    const promptMessageReal = useQuery(
        api.stageMessages.getLatestMessage,
        programId && !testMode ? { programId } : "skip"
    );

    const sendMutation = useMutation(api.stageMessages.sendMessage);
    const clearMutation = useMutation(api.stageMessages.clearMessages);

    const [localPrompt, setLocalPrompt] = useState<StageMessage | null>(() => {
        if (!testMode || !programId) return null;
        const localMsg = localStorage.getItem(`prompt_${programId}`);
        return localMsg ? JSON.parse(localMsg) : null;
    });

    useEffect(() => {
        if (!testMode || !programId) return;
        const handleStorage = () => {
            const localMsg = localStorage.getItem(`prompt_${programId}`);
            setLocalPrompt(localMsg ? JSON.parse(localMsg) : null);
        };
        window.addEventListener('storage', handleStorage);
        window.addEventListener('prompt_update', handleStorage);
        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('prompt_update', handleStorage);
        };
    }, [programId, testMode]);

    const sendStageMessage = async (text: string, type: string = 'alert', isStrobe: boolean = false, durationMs?: number) => {
        if (!programId) return;
        if (testMode) {
            const msg: StageMessage = {
                text,
                type,
                isStrobe,
                expiresAt: Date.now() + (durationMs || (24 * 60 * 60 * 1000))
            };
            localStorage.setItem(`prompt_${programId}`, JSON.stringify(msg));
            window.dispatchEvent(new Event('prompt_update'));
            return;
        }
        try {
            await sendMutation({
                programId,
                text,
                type,
                isStrobe,
                durationMs
            });
        } catch (err) {
            console.error("Failed to send stage message:", err);
        }
    };

    const clearStageMessage = async () => {
        if (!programId) return;
        if (testMode) {
            localStorage.removeItem(`prompt_${programId}`);
            window.dispatchEvent(new Event('prompt_update'));
            return;
        }
        try {
            await clearMutation({ programId });
        } catch (err) {
            console.error("Failed to clear stage messages:", err);
        }
    };

    return {
        promptMessage: testMode ? localPrompt : promptMessageReal,
        sendStageMessage,
        clearStageMessage
    };
};
