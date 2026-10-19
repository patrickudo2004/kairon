const electron = require('electron');
if (!electron || typeof electron !== 'object' || !electron.app) {
  console.error('\n[Kairon Studio] ERROR: electron/main.cjs must be executed by the Electron runtime, not plain Node.js.');
  console.error('Run: npm run electron:dev\n');
  process.exit(1);
}
const { app, BrowserWindow, ipcMain, screen, powerSaveBlocker, dialog, shell, nativeImage } = electron;
const path = require('path');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
let mainWindow = null;
let flightBridgeWindow = null;
const secondaryWindows = {};
let powerBlockerId = null;

function getDeterministicWindowTitle(urlStr = '', winKey = '') {
  const lower = `${urlStr} ${winKey}`.toLowerCase();
  if (lower.includes('prompter')) return 'Kairon Output [PROMPTER]';
  if (lower.includes('tv')) return 'Kairon Output [TV]';
  if (lower.includes('overlay')) return 'Kairon Output [OVERLAY]';
  if (lower.includes('crew')) return 'Kairon Output [CREW]';
  if (lower.includes('bridge')) return 'Kairon Flight Bridge';
  return 'Kairon Output [STAGE]';
}

function loadRouteIntoWindow(win, url) {
  if (isDev) {
    const devBase = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000';
    const targetUrl = url.startsWith('http') ? url : `${devBase}${url.startsWith('/') ? '' : '/'}${url}`;
    return win.loadURL(targetUrl);
  } else {
    const cleanPath = url.split('?')[0].replace(/^\//, '');
    const query = url.includes('?') ? url.substring(url.indexOf('?')) : '';
    return win.loadFile(path.join(__dirname, '../dist/index.html'), {
      hash: cleanPath,
      search: query,
    });
  }
}

process.on('uncaughtException', (err) => {
  console.error('[Kairon Main] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Kairon Main] Unhandled Rejection:', reason);
});

if (process.platform === 'win32') {
  app.setAppUserModelId('com.kairon.studio');
}

const appIconIco = path.join(__dirname, '../public/icon.ico');
const appIconPng = path.join(__dirname, '../public/kairon-logo.png');
const appIconPath = (process.platform === 'win32' && fs.existsSync(appIconIco)) ? appIconIco : appIconPng;
const nativeAppIcon = nativeImage.createFromPath(appIconPath);

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 840,
    minWidth: 1024,
    minHeight: 700,
    title: 'Kairon Studio — Broadcast Stage & Rundown Engine',
    icon: !nativeAppIcon.isEmpty() ? nativeAppIcon : appIconPath,
    show: false,
    center: true,
    backgroundColor: '#090A0C',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });

  if (process.platform === 'win32') {
    try {
      if (!nativeAppIcon.isEmpty()) {
        mainWindow.setIcon(nativeAppIcon);
      } else {
        mainWindow.setIcon(appIconPath);
      }
    } catch (e) {
      console.warn('[Kairon Main] Could not set window icon:', e);
    }
  }

  const showAndFocus = () => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      mainWindow.show();
      mainWindow.focus();
      const bounds = mainWindow.getBounds();
      console.log(`[Kairon Studio] Native desktop window visible: ${bounds.width}x${bounds.height} at (${bounds.x}, ${bounds.y})`);
    }
  };

  mainWindow.once('ready-to-show', () => {
    showAndFocus();
  });

  // Fallback to guarantee window visibility even if ready-to-show takes longer
  setTimeout(showAndFocus, 1500);

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[Kairon Studio] Frontend UI loaded successfully.');
    showAndFocus();
  });

  mainWindow.webContents.on('render-process-gone', (evt, details) => {
    console.error('[Kairon Studio] Renderer process gone:', details);
  });

  mainWindow.webContents.on('did-fail-load', (evt, errCode, errDesc, validatedUrl) => {
    console.error(`[Kairon Studio] Failed to load ${validatedUrl}: ${errDesc} (${errCode})`);
  });

  if (isDev) {
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000';
    console.log(`[Kairon Studio] Loading Vite dev server: ${devUrl}`);
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Safely route external OAuth / documentation URLs to system browser while allowing local output windows
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const isLocalRoute =
      url.startsWith('http://localhost') ||
      url.startsWith('file://') ||
      url.includes('/stage') ||
      url.includes('/tv') ||
      url.includes('/prompter') ||
      url.includes('/crew') ||
      url.includes('/overlay') ||
      url.includes('/bridge') ||
      url.includes('/p/');

    if (!isLocalRoute && (url.startsWith('https://') || url.startsWith('http://'))) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        backgroundColor: '#090A0C',
        webPreferences: {
          preload: path.join(__dirname, 'preload.cjs'),
          contextIsolation: true,
          nodeIntegration: false,
          backgroundThrottling: false,
        },
      },
    };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (flightBridgeWindow && !flightBridgeWindow.isDestroyed()) {
      flightBridgeWindow.close();
      flightBridgeWindow = null;
    }
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
  try {
    powerBlockerId = powerSaveBlocker.start('prevent-display-sleep');
  } catch (err) {
    console.warn('Could not start powerSaveBlocker:', err);
  }

  screen.on('display-added', (event, newDisplay) => {
    console.log('Hardware display connected:', newDisplay.id);
    broadcastScreenUpdates();
  });

  screen.on('display-removed', (event, oldDisplay) => {
    console.log('Hardware display disconnected:', oldDisplay.id);
    broadcastScreenUpdates();

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

// IPC: Open or dynamically re-target secondary display window at exact monitor bounds
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
    const deterministicTitle = getDeterministicWindowTitle(url, winKey);
    const isTransparentOverlay = url && url.includes('bg=transparent');

    // Dynamic Re-Targeting: If window is already open, update its route/bounds and focus
    if (secondaryWindows[winKey] && !secondaryWindows[winKey].isDestroyed()) {
      const existingWin = secondaryWindows[winKey];
      existingWin.setTitle(deterministicTitle);
      await loadRouteIntoWindow(existingWin, url);
      existingWin.focus();
      return { success: true, retargeted: true };
    }

    const win = new BrowserWindow({
      x: targetDisplay.bounds.x,
      y: targetDisplay.bounds.y,
      width: targetDisplay.bounds.width,
      height: targetDisplay.bounds.height,
      fullscreen: true,
      frame: false,
      transparent: Boolean(isTransparentOverlay),
      alwaysOnTop: false,
      title: deterministicTitle,
      icon: !nativeAppIcon.isEmpty() ? nativeAppIcon : appIconPath,
      backgroundColor: isTransparentOverlay ? '#00000000' : '#090A0C',
      webPreferences: {
        preload: path.join(__dirname, 'preload.cjs'),
        contextIsolation: true,
        nodeIntegration: false,
        backgroundThrottling: false,
      },
    });

    // Escape key safety: Exit fullscreen or close secondary window cleanly
    win.webContents.on('before-input-event', (evt, input) => {
      if (input.type === 'keyDown' && input.key === 'Escape') {
        if (win.isFullScreen()) {
          win.setFullScreen(false);
        } else {
          win.close();
        }
      }
    });

    secondaryWindows[winKey] = win;
    win.on('closed', () => {
      delete secondaryWindows[winKey];
    });

    await loadRouteIntoWindow(win, url);
    win.setTitle(deterministicTitle);

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

// Helper: Resolve Documents/Kairon/Workspaces/<OrgName>/<Year>/<Month>
function getWorkspaceArchiveDir(organizationName = 'Winners Chapel Manchester', dateStr = '') {
  const safeOrg = (organizationName || 'Kairon Workspace').replace(/[<>:"/\\|?*]+/g, '').trim() || 'Workspace';
  const parsedDate = dateStr ? new Date(dateStr) : new Date();
  const year = !isNaN(parsedDate.getTime()) ? String(parsedDate.getFullYear()) : String(new Date().getFullYear());
  const month = !isNaN(parsedDate.getTime())
    ? parsedDate.toLocaleString('en-GB', { month: '2-digit' }) + '-' + parsedDate.toLocaleString('en-GB', { month: 'short' })
    : '01-Jan';

  return path.join(app.getPath('documents'), 'Kairon', 'Workspaces', safeOrg, year, month);
}

// IPC: Save .kairon File via Native Save Dialog
ipcMain.handle('save-kairon-file', async (event, { content, defaultFileName, organizationName, date }) => {
  try {
    const archiveDir = getWorkspaceArchiveDir(organizationName, date);
    await fs.promises.mkdir(archiveDir, { recursive: true });

    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Kairon Broadcast Rundown (.kairon)',
      defaultPath: path.join(archiveDir, defaultFileName || 'rundown.kairon'),
      filters: [
        { name: 'Kairon Broadcast Rundown', extensions: ['kairon'] },
        { name: 'JSON File', extensions: ['json'] },
      ],
    });

    if (canceled || !filePath) return { success: false, canceled: true };
    await fs.promises.writeFile(filePath, content, 'utf-8');
    return { success: true, filePath };
  } catch (err) {
    console.error('save-kairon-file failed:', err);
    return { success: false, error: err.message };
  }
});

// IPC: Open .kairon or .csv File via Native Open Dialog
ipcMain.handle('open-kairon-file', async () => {
  try {
    const baseDir = path.join(app.getPath('documents'), 'Kairon', 'Workspaces');
    await fs.promises.mkdir(baseDir, { recursive: true });

    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Open Kairon Rundown (.kairon or .csv)',
      defaultPath: baseDir,
      properties: ['openFile'],
      filters: [
        { name: 'Kairon & CSV Rundowns', extensions: ['kairon', 'csv', 'json'] },
      ],
    });

    if (canceled || !filePaths || filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    const selectedPath = filePaths[0];
    const content = await fs.promises.readFile(selectedPath, 'utf-8');
    const ext = path.extname(selectedPath).toLowerCase().replace('.', '');
    return { success: true, content, filePath: selectedPath, ext };
  } catch (err) {
    console.error('open-kairon-file failed:', err);
    return { success: false, error: err.message };
  }
});

// IPC: Silent Background Auto-Archive to Documents/Kairon/Workspaces/<Org>/<Year>/<Month>/
ipcMain.handle('auto-archive-kairon-file', async (event, { content, fileName, organizationName, date }) => {
  try {
    const archiveDir = getWorkspaceArchiveDir(organizationName, date);
    await fs.promises.mkdir(archiveDir, { recursive: true });
    const targetPath = path.join(archiveDir, fileName || 'rundown.kairon');
    await fs.promises.writeFile(targetPath, content, 'utf-8');
    return { success: true, filePath: targetPath };
  } catch (err) {
    console.warn('auto-archive-kairon-file failed:', err);
    return { success: false, error: err.message };
  }
});

// IPC: Open external URL in user's default browser
ipcMain.handle('open-external-url', async (event, url) => {
  if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
    shell.openExternal(url);
    return { success: true };
  }
  return { success: false, error: 'Invalid URL' };
});

// IPC: Focus main desktop window
ipcMain.handle('focus-main-window', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
    return { success: true };
  }
  return { success: false };
});

// IPC: Cross-window timer state relay
// BroadcastChannel does NOT work across separate Electron BrowserWindow processes.
// When the controller window sends timer state, we fan it out to ALL open windows
// so that Stage, TV, Prompter, Crew etc. receive live timer ticks in real-time.
ipcMain.on('timer-state-relay', (event, payload) => {
  const allWindows = BrowserWindow.getAllWindows();
  allWindows.forEach((win) => {
    if (!win.isDestroyed() && win.webContents) {
      // Send to every window including the sender — renderer filters its own echo
      try {
        win.webContents.send('timer-state-push', payload);
      } catch (e) {
        // Window may be closing — ignore
      }
    }
  });
});

// Helper: Create detached native Flight Bridge window
function createFlightBridgeWindow() {
  if (flightBridgeWindow && !flightBridgeWindow.isDestroyed()) {
    if (flightBridgeWindow.isMinimized()) flightBridgeWindow.restore();
    flightBridgeWindow.show();
    flightBridgeWindow.focus();
    return { success: true, open: true };
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const width = 380;
  const height = 580;
  // Position bottom-right of primary screen with offset
  const x = primaryDisplay.bounds.x + primaryDisplay.bounds.width - width - 30;
  const y = primaryDisplay.bounds.y + primaryDisplay.bounds.height - height - 60;

  flightBridgeWindow = new BrowserWindow({
    x,
    y,
    width,
    height,
    minWidth: 320,
    minHeight: 460,
    alwaysOnTop: true,
    frame: false,
    resizable: true,
    skipTaskbar: false,
    title: 'Kairon Flight Bridge',
    icon: !nativeAppIcon.isEmpty() ? nativeAppIcon : appIconPath,
    backgroundColor: '#090A0C',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });

  flightBridgeWindow.on('closed', () => {
    flightBridgeWindow = null;
    if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
      mainWindow.webContents.send('flight-bridge-closed');
    }
  });

  loadRouteIntoWindow(flightBridgeWindow, '/bridge');
  return { success: true, open: true };
}

// IPC: Native Detached Flight Bridge management
ipcMain.handle('open-flight-bridge', () => {
  return createFlightBridgeWindow();
});

ipcMain.handle('close-flight-bridge', () => {
  if (flightBridgeWindow && !flightBridgeWindow.isDestroyed()) {
    flightBridgeWindow.close();
    flightBridgeWindow = null;
    return { success: true, open: false };
  }
  return { success: false, open: false };
});

ipcMain.handle('toggle-flight-bridge', () => {
  if (flightBridgeWindow && !flightBridgeWindow.isDestroyed()) {
    flightBridgeWindow.close();
    flightBridgeWindow = null;
    return { success: true, open: false };
  } else {
    return createFlightBridgeWindow();
  }
});

// IPC: Bidirectional timer control relay from secondary windows (e.g. Flight Bridge) to main window
ipcMain.on('timer-control-relay', (event, payload) => {
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
    try {
      mainWindow.webContents.send('timer-control-action', payload);
    } catch (e) {
      console.warn('[Kairon Main] Failed to relay timer control to mainWindow:', e);
    }
  }
});


