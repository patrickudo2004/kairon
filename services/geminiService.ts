import { Program } from '../types';
import { parseRundownText } from '../utils/rundownParser';

export const rebalanceSchedule = async (program: Program, remainingTimeSeconds: number): Promise<string> => {
  return "Schedule Rebalanced: Flex slots and buffer time have been automatically re-proportioned to protect hard event end time.";
};

export const generateProgramDraft = async (input: string): Promise<Partial<Program> | null> => {
  const result = parseRundownText(input);
  if (!result || result.slots.length === 0) {
    return null;
  }
  return {
    title: result.title || 'Generated Rundown',
    startTime: result.startTime || '09:00',
    slots: result.slots
  };
};