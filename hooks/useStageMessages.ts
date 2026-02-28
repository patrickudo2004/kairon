import { useState } from 'react';

interface StageMessage {
    text: string;
    type: string;
}

/**
 * useStageMessages Stub
 * (Supabase implementation removed. Convex implementation pending schema update.)
 */
export const useStageMessages = (programId: string | undefined) => {
    const [promptMessage] = useState<StageMessage | null>(null);

    const sendStageMessage = async (text: string, type: string = 'alert') => {
        console.warn("Stage messaging is currently disabled (Supabase gutted).", { text, type });
    };

    return { promptMessage, sendStageMessage };
};
