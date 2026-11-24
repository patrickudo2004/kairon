import { Program } from '../types';

/**
 * Production workspaces and offline Booth Mode always start with a clean empty slate.
 * Users can create a blank rundown or explicitly choose an optional template in the Program Editor.
 */
export const getDefaultSeedPrograms = (_organizationId: string = 'local-workspace'): Program[] => {
  return [];
};
