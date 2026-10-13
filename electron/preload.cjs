const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  isElectron: true,
  platform: process.platform,
  getScreens: () => ipcRenderer.invoke('get-screens'),
  openTargetScreen: (options) => ipcRenderer.invoke('open-target-screen', options),
  closeTargetScreen: (options) => ipcRenderer.invoke('close-target-screen', options),
  onScreensUpdated: (callback) => {
    const subscription = (event, screens) => callback(screens);
    ipcRenderer.on('screens-updated', subscription);
    return () => ipcRenderer.removeListener('screens-updated', subscription);
  },
});
