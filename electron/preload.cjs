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
};

contextBridge.exposeInMainWorld('electron', api);
contextBridge.exposeInMainWorld('electronAPI', api);

