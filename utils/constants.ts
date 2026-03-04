import { Program } from '../types';

export const getInitialProgram = (organizationId?: string): Program => ({
    id: crypto.randomUUID(),
    title: 'New Event',
    subtitle: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    organizationId,
    isManualMode: false,
    slots: []
});
