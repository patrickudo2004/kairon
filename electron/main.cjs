const { app, BrowserWindow, ipcMain, screen, powerSaveBlocker } = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
let mainWindow = null;
const secondaryWindows = {};
let powerBlockerId = null;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Kairon - Broadcast Stage & Rundown Engine',
    show: false,
    backgroundColor: '#090A0C',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev) {
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000';
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    // Close secondary windows when main window closes
    Object.values(secondaryWindows).forEach((win) => {
      if (win && !win.isDestroyed()) win.close();
    });
  });
}

function getScreenList() {
  const displays = screen.getAllDisplays();
  const primaryDisplay = screen.getPrimaryDisplay();

  return displays.map((d, idx) => {
    const isPrimary = d.id === primaryDisplay.id;
    return {
      id: d.id.toString(),
      index: idx + 1,
      isPrimary,
      isInternal: d.internal ?? false,
      width: d.bounds.width,
      height: d.bounds.height,
      availLeft: d.bounds.x,
      availTop: d.bounds.y,
      availWidth: d.bounds.width,
      availHeight: d.bounds.height,
      left: d.bounds.x,
      top: d.bounds.y,
      label: d.label || (isPrimary ? 'Primary Display (Display 1)' : `External Display ${idx + 1}`),
    };
  });
}

function broadcastScreenUpdates() {
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
    mainWindow.webContents.send('screens-updated', getScreenList());
  }
}

app.whenReady().then(() => {
  // Prevent OS from sleeping during live church broadcasts
  try {
    powerBlockerId = powerSaveBlocker.start('prevent-display-sleep');
  } catch (err) {
    console.warn('Could not start powerSaveBlocker:', err);
  }

  // Setup dynamic hardware display plug/unplug listeners
  screen.on('display-added', (event, newDisplay) => {
    console.log('Hardware display connected:', newDisplay.id);
    broadcastScreenUpdates();
  });

  screen.on('display-removed', (event, oldDisplay) => {
    console.log('Hardware display disconnected:', oldDisplay.id);
    broadcastScreenUpdates();

    // Safety: If an external display was unplugged (e.g. HDMI pull),
    // reposition any stranded secondary windows to the primary display to prevent orphans
    try {
      const remainingDisplays = screen.getAllDisplays();
      const primary = screen.getPrimaryDisplay();
      Object.entries(secondaryWindows).forEach(([key, win]) => {
        if (win && !win.isDestroyed()) {
          const bounds = win.getBounds();
          const isOnValidDisplay = remainingDisplays.some((d) => {
            return (
              bounds.x >= d.bounds.x &&
              bounds.x < d.bounds.x + d.bounds.width &&
              bounds.y >= d.bounds.y &&
              bounds.y < d.bounds.y + d.bounds.height
            );
          });
          if (!isOnValidDisplay) {
            console.warn(`Secondary window [${key}] lost display. Repositioning to primary screen.`);
            win.setFullScreen(false);
            win.setBounds({
              x: primary.bounds.x + 60,
              y: primary.bounds.y + 60,
              width: Math.min(1280, primary.bounds.width - 120),
              height: Math.min(720, primary.bounds.height - 120),
            });
          }
        }
      });
    } catch (repositionErr) {
      console.warn('Error repositioning disconnected windows:', repositionErr);
    }
  });

  screen.on('display-metrics-changed', () => {
    broadcastScreenUpdates();
  });

  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (powerBlockerId !== null && powerSaveBlocker.isStarted(powerBlockerId)) {
    powerSaveBlocker.stop(powerBlockerId);
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC: Return all connected hardware screens
ipcMain.handle('get-screens', () => {
  return getScreenList();
});

// IPC: Open targeted secondary display window at exact monitor bounds
ipcMain.handle('open-target-screen', async (event, { url, screenIndex, windowId }) => {
  try {
    const displays = screen.getAllDisplays();
    let targetDisplay = null;

    if (typeof screenIndex === 'number') {
      targetDisplay = displays[screenIndex - 1] || displays[screenIndex];
    }
    if (!targetDisplay) {
      targetDisplay = displays.find((d) => d.bounds.x !== 0 || d.bounds.y !== 0) || displays[0];
    }

    const winKey = windowId || `display_${screenIndex || 2}`;
    if (secondaryWindows[winKey] && !secondaryWindows[winKey].isDestroyed()) {
      secondaryWindows[winKey].focus();
      return { success: true };
    }

    const win = new BrowserWindow({
      x: targetDisplay.bounds.x,
      y: targetDisplay.bounds.y,
      width: targetDisplay.bounds.width,
      height: targetDisplay.bounds.height,
      fullscreen: true,
      frame: false,
      alwaysOnTop: false,
      backgroundColor: '#090A0C',
      webPreferences: {
        preload: path.join(__dirname, 'preload.cjs'),
        contextIsolation: true,
        nodeIntegration: false,
        backgroundThrottling: false,
      },
    });

    secondaryWindows[winKey] = win;
    win.on('closed', () => {
      delete secondaryWindows[winKey];
    });

    if (isDev) {
      const devBase = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000';
      const targetUrl = url.startsWith('http') ? url : `${devBase}${url.startsWith('/') ? '' : '/'}${url}`;
      await win.loadURL(targetUrl);
    } else {
      const cleanPath = url.split('?')[0].replace(/^\//, '');
      const query = url.includes('?') ? url.substring(url.indexOf('?')) : '';
      await win.loadFile(path.join(__dirname, '../dist/index.html'), {
        hash: cleanPath,
        search: query,
      });
    }

    return { success: true };
  } catch (err) {
    console.error('Failed to open secondary display window:', err);
    return { success: false, error: err.message };
  }
});

// IPC: Close secondary display window
ipcMain.handle('close-target-screen', async (event, { windowId }) => {
  if (windowId && secondaryWindows[windowId] && !secondaryWindows[windowId].isDestroyed()) {
    secondaryWindows[windowId].close();
    delete secondaryWindows[windowId];
    return { success: true };
  }
  return { success: false };
});
