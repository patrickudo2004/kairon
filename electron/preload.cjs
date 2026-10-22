const { contextBridge, ipcRenderer } = require('electron');

const api = {
  isElectron: true,
  platform: process.platform,
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getScreens: () => ipcRenderer.invoke('get-screens'),
  openTargetScreen: (options) => ipcRenderer.invoke('open-target-screen', options),
  closeTargetScreen: (options) => ipcRenderer.invoke('close-target-screen', options),
  saveKaironFile: (options) => ipcRenderer.invoke('save-kairon-file', options),
  openKaironFile: () => ipcRenderer.invoke('open-kairon-file'),
  autoArchiveKaironFile: (options) => ipcRenderer.invoke('auto-archive-kairon-file', options),
  openExternalUrl: (url) => ipcRenderer.invoke('open-external-url', url),
  focusMainWindow: () => ipcRenderer.invoke('focus-main-window'),
  onScreensUpdated: (callback) => {
    const subscription = (event, screens) => callback(screens);
    ipcRenderer.on('screens-updated', subscription);
    return () => ipcRenderer.removeListener('screens-updated', subscription);
  },
  // Cross-window timer relay: controller → main process → all display windows
  // BroadcastChannel does NOT work across separate Electron BrowserWindow processes.
  // This IPC bridge is the fix that makes real-time timer state reach Stage/TV/Prompter windows.
  sendTimerState: (payload) => ipcRenderer.send('timer-state-relay', payload),
  getLastTimerState: () => ipcRenderer.invoke('get-last-timer-state'),
  onTimerState: (callback) => {
    const subscription = (event, payload) => callback(payload);
    ipcRenderer.on('timer-state-push', subscription);
    return () => ipcRenderer.removeListener('timer-state-push', subscription);
  },
  // Native detached Flight Bridge window management
  openFlightBridge: (opts) => ipcRenderer.invoke('open-flight-bridge', opts),
  closeFlightBridge: () => ipcRenderer.invoke('close-flight-bridge'),
  toggleFlightBridge: (opts) => ipcRenderer.invoke('toggle-flight-bridge', opts),
  recallFlightBridge: () => ipcRenderer.invoke('recall-flight-bridge'),
  onFlightBridgeClosed: (callback) => {
    const subscription = () => callback();
    ipcRenderer.on('flight-bridge-closed', subscription);
    return () => ipcRenderer.removeListener('flight-bridge-closed', subscription);
  },
  // Bidirectional timer controls: Flight Bridge → main controller window
  sendTimerControl: (payload) => ipcRenderer.send('timer-control-relay', payload),
  onTimerControl: (callback) => {
    const subscription = (event, payload) => callback(payload);
    ipcRenderer.on('timer-control-action', subscription);
    return () => ipcRenderer.removeListener('timer-control-action', subscription);
  },
  // Stage cue message relay across native multi-screen displays
  sendStageMessage: (payload) => ipcRenderer.send('stage-message-relay', payload),
  getLastStageMessage: () => ipcRenderer.invoke('get-last-stage-message'),
  onStageMessage: (callback) => {
    const subscription = (event, payload) => callback(payload);
    ipcRenderer.on('stage-message-push', subscription);
    return () => ipcRenderer.removeListener('stage-message-push', subscription);
  },
  // Direct vector PDF export
  savePdf: (options) => ipcRenderer.invoke('save-pdf', options),
  // Local Workspace Folder APIs
  chooseWorkspaceFolder: () => ipcRenderer.invoke('choose-workspace-folder'),
  readWorkspaceFolder: (folderPath) => ipcRenderer.invoke('read-workspace-folder', folderPath),
  saveWorkspaceProgram: (options) => ipcRenderer.invoke('save-workspace-program', options),
  deleteWorkspaceProgram: (options) => ipcRenderer.invoke('delete-workspace-program', options),
};

contextBridge.exposeInMainWorld('electron', api);
contextBridge.exposeInMainWorld('electronAPI', api);
