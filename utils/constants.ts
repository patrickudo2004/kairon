import { Program } from '../types';

export const INITIAL_PROGRAM: Program = {
    id: crypto.randomUUID(),
    title: 'New Event',
    subtitle: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    isManualMode: false,
    slots: []
};
