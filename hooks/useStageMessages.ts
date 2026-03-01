import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';

interface StageMessage {
    text: string;
    type: string;
}

/**
 * useStageMessages Hook
 * Uses Convex for persistent, reactive stage cues.
 */
export const useStageMessages = (programId: string | undefined) => {
    // Stage display views call this to get the latest message
    const promptMessage = useQuery(
        api.stageMessages.getLatestMessage,
        programId ? { programId } : "skip"
    );

    const sendMutation = useMutation(api.stageMessages.sendMessage);

    const sendStageMessage = async (text: string, type: string = 'alert', durationMs?: number) => {
        if (!programId) return;
        try {
            await sendMutation({
                programId,
                text,
                type,
                durationMs
            });
        } catch (err) {
            console.error("Failed to send stage message:", err);
        }
    };

    return { promptMessage, sendStageMessage };
};
