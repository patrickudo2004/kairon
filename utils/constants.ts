import { Program } from '../types';
import { generateUUID } from './uuid';

export const getInitialProgram = (organizationId?: string): Program => {
    const uuid = generateUUID();
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
        slots: []
    };
};
