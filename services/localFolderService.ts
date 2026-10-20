// Local Folder Workspace Service
// Manages local folder selection and .kairon file persistence on disk
import { Program, Organization } from '../types';

export interface LocalFolderWorkspace {
  id: string; // e.g. 'local-folder-c-users-documents-kairon'
  name: string; // e.g. 'Sunday Services'
  slug: string;
  folderPath: string;
  isLocalFolder: true;
  subscriptionStatus: 'enterprise';
  createdAt: string;
  createdBy: string;
}

const LOCAL_FOLDER_PATH_KEY = 'kairon_local_folder_path';
const LOCAL_FOLDER_NAME_KEY = 'kairon_local_folder_name';

export const isElectronAvailable = (): boolean => {
  return typeof window !== 'undefined' && Boolean((window as any).electron?.chooseWorkspaceFolder);
};

export const getActiveLocalFolder = (): { folderPath: string; folderName: string } | null => {
  try {
    if (typeof window === 'undefined') return null;
    const path = localStorage.getItem(LOCAL_FOLDER_PATH_KEY);
    const name = localStorage.getItem(LOCAL_FOLDER_NAME_KEY);
    if (path && name) {
      return { folderPath: path, folderName: name };
    }
    return null;
  } catch {
    return null;
  }
};

export const setActiveLocalFolder = (folderPath: string, folderName: string): LocalFolderWorkspace => {
  try {
    localStorage.setItem(LOCAL_FOLDER_PATH_KEY, folderPath);
    localStorage.setItem(LOCAL_FOLDER_NAME_KEY, folderName);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kairon_workspace_changed', { detail: { folderPath, folderName } }));
    }
  } catch (err) {
    console.warn('Could not save local folder preferences:', err);
  }
  return toLocalFolderOrg(folderPath, folderName);
};

export const clearActiveLocalFolder = () => {
  try {
    localStorage.removeItem(LOCAL_FOLDER_PATH_KEY);
    localStorage.removeItem(LOCAL_FOLDER_NAME_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('kairon_workspace_changed'));
    }
  } catch {}
};

export const toLocalFolderOrg = (folderPath: string, folderName: string): LocalFolderWorkspace => {
  const safeId = 'local-folder-' + btoa(encodeURIComponent(folderPath)).replace(/=/g, '').slice(0, 16);
  const safeSlug = folderName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return {
    id: safeId,
    name: folderName,
    slug: safeSlug,
    folderPath,
    isLocalFolder: true,
    subscriptionStatus: 'enterprise',
    createdAt: new Date().toISOString(),
    createdBy: 'local-folder',
  };
};

export const chooseLocalFolder = async (): Promise<{ success: boolean; org?: LocalFolderWorkspace; canceled?: boolean; error?: string }> => {
  if (isElectronAvailable()) {
    const res = await (window as any).electron.chooseWorkspaceFolder();
    if (res.canceled) return { success: false, canceled: true };
    if (!res.success || !res.folderPath) return { success: false, error: res.error || 'Failed to select folder' };
    const org = setActiveLocalFolder(res.folderPath, res.folderName || 'Local Workspace');
    return { success: true, org };
  }

  // Fallback for modern browser Web File System Access API
  if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
    try {
      const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      const folderName = handle.name || 'Local Workspace';
      const folderPath = `browser://${folderName}`;
      const org = setActiveLocalFolder(folderPath, folderName);
      return { success: true, org };
    } catch (err: any) {
      if (err.name === 'AbortError') return { success: false, canceled: true };
      return { success: false, error: err.message };
    }
  }

  return {
    success: false,
    error: 'Folder selection is available in the Kairon Desktop App.',
  };
};

export const readLocalFolderPrograms = async (folderPath?: string): Promise<Program[]> => {
  const targetPath = folderPath || getActiveLocalFolder()?.folderPath;
  if (!targetPath) return [];

  if (isElectronAvailable()) {
    const res = await (window as any).electron.readWorkspaceFolder(targetPath);
    if (res && res.success && Array.isArray(res.programs)) {
      return res.programs;
    }
    return [];
  }

  return [];
};

export const saveProgramToLocalFolder = async (
  program: Program,
  folderPath?: string,
  fileName?: string
): Promise<{ success: boolean; filePath?: string; error?: string }> => {
  const targetPath = folderPath || getActiveLocalFolder()?.folderPath;
  if (!targetPath) return { success: false, error: 'No local folder selected' };

  if (isElectronAvailable()) {
    const res = await (window as any).electron.saveWorkspaceProgram({
      folderPath: targetPath,
      program,
      fileName,
    });
    return res;
  }

  return { success: false, error: 'Desktop app required for direct local folder saves' };
};

export const deleteProgramFromLocalFolder = async (filePath: string): Promise<{ success: boolean; error?: string }> => {
  if (!filePath) return { success: true };

  if (isElectronAvailable()) {
    return await (window as any).electron.deleteWorkspaceProgram({ filePath });
  }

  return { success: false, error: 'Desktop app required to delete local files' };
};
