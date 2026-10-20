import { Program } from '../types';

export const getInitialProgram = (organizationId?: string): Program => {
    const uuid = crypto.randomUUID();
    return {
        id: `local-${uuid}`,
        slug: uuid,
        isPublic: true,
        title: 'New Event',
        subtitle: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        organizationId,
        isManualMode: false,
        status: 'draft',
        slots: [
            {
                id: crypto.randomUUID(),
                title: 'Opening / Pre-Service',
                speaker: '',
                durationMinutes: 5,
                type: 'Prayer',
                productionNotes: 'Stage standby & worship team call'
            }
        ]
    };
};
