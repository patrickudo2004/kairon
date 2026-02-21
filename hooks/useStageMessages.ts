import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

interface StageMessage {
    text: string;
    type: string;
}

export const useStageMessages = (programId: string | undefined) => {
    const [promptMessage, setPromptMessage] = useState<StageMessage | null>(null);

    useEffect(() => {
        if (!programId) return;

        const channel = supabase.channel(`prompter:${programId}`)
            .on('broadcast', { event: 'stage_message' }, ({ payload }) => {
                setPromptMessage({ text: payload.text, type: payload.type });
                setTimeout(() => setPromptMessage(null), 5000);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [programId]);

    const sendStageMessage = async (text: string, type: string = 'alert') => {
        if (!programId) return;

        await supabase.channel(`prompter:${programId}`).send({
            type: 'broadcast',
            event: 'stage_message',
            payload: { text, type }
        });
    };

    return { promptMessage, sendStageMessage };
};
