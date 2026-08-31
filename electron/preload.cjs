const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  isElectron: true,
  platform: process.platform,
  getScreens: () => ipcRenderer.invoke('get-screens'),
  openTargetScreen: (options) => ipcRenderer.invoke('open-target-screen', options),
  closeTargetScreen: (options) => ipcRenderer.invoke('close-target-screen', options),
});
