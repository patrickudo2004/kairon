const { contextBridge, ipcRenderer } = require('electron');

const api = {
  isElectron: true,
  platform: process.platform,
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
  onTimerState: (callback) => {
    const subscription = (event, payload) => callback(payload);
    ipcRenderer.on('timer-state-push', subscription);
    return () => ipcRenderer.removeListener('timer-state-push', subscription);
  },
  // Native detached Flight Bridge window management
  openFlightBridge: () => ipcRenderer.invoke('open-flight-bridge'),
  closeFlightBridge: () => ipcRenderer.invoke('close-flight-bridge'),
  toggleFlightBridge: () => ipcRenderer.invoke('toggle-flight-bridge'),
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
  // Direct vector PDF export
  savePdf: (options) => ipcRenderer.invoke('save-pdf', options),
};

contextBridge.exposeInMainWorld('electron', api);
contextBridge.exposeInMainWorld('electronAPI', api);


