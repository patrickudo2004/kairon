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
let lastTimerStatePayload = null;
let lastStageMessagePayload = null;

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
  const cleanPath = url.split('?')[0].replace(/^\//, '');
  const query = url.includes('?') ? url.substring(url.indexOf('?')) : '';
  if (isDev) {
    const devBase = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000';
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    const targetUrl = url.startsWith('http') ? url : `${devBase}${cleanUrl}`;
    return win.loadURL(targetUrl);
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    try {
      return win.loadFile(indexPath, { hash: `/${cleanPath}${query}` });
    } catch {
      const normalizedPath = indexPath.replace(/\\/g, '/');
      return win.loadURL(`file:///${normalizedPath}#/${cleanPath}${query}`);
    }
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

// Enforce single instance across platforms (focus existing window if second launched)
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  console.log('[Kairon Main] Another instance is already running. Quitting duplicate.');
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
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
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'), { hash: '/' });
  }

  // Safely route external OAuth / documentation URLs to system browser while allowing local output windows
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('file://') && !url.toLowerCase().includes('index.html')) {
      try {
        const parsed = new URL(url);
        const rawRoute = parsed.pathname.replace(/^\/[A-Za-z]:/, '') + (parsed.search || '') + (parsed.hash || '');
        if (/^\/(stage|tv|prompter|crew|overlay|bridge|public|portal|p\/)/i.test(rawRoute)) {
          const childWin = new BrowserWindow({
            width: 1280,
            height: 720,
            title: getDeterministicWindowTitle(rawRoute),
            icon: !nativeAppIcon.isEmpty() ? nativeAppIcon : appIconPath,
            backgroundColor: '#090A0C',
            webPreferences: {
              preload: path.join(__dirname, 'preload.cjs'),
              contextIsolation: true,
              nodeIntegration: false,
              backgroundThrottling: false,
            },
          });
          loadRouteIntoWindow(childWin, rawRoute);
          return { action: 'deny' };
        }
      } catch (e) {
        console.warn('[Kairon Main] Fallback route parse failed:', e);
      }
    }
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

      if (flightBridgeWindow && !flightBridgeWindow.isDestroyed()) {
        const fbBounds = flightBridgeWindow.getBounds();
        const fbOnValid = remainingDisplays.some((d) => {
          return (
            fbBounds.x >= d.bounds.x &&
            fbBounds.x < d.bounds.x + d.bounds.width &&
            fbBounds.y >= d.bounds.y &&
            fbBounds.y < d.bounds.y + d.bounds.height
          );
        });
        if (!fbOnValid) {
          console.warn('Flight Bridge window lost display. Repositioning to primary screen.');
          const width = 380;
          const height = 580;
          flightBridgeWindow.setBounds({
            x: primary.bounds.x + primary.bounds.width - width - 30,
            y: primary.bounds.y + primary.bounds.height - height - 60,
            width,
            height,
          });
        }
      }
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
ipcMain.handle('get-app-version', () => app.getVersion());
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
      existingWin.setBounds(targetDisplay.bounds);
      await loadRouteIntoWindow(existingWin, url);
      existingWin.focus();
      return { success: true, retargeted: true };
    }

    const isDarwin = process.platform === 'darwin';
    const win = new BrowserWindow({
      x: targetDisplay.bounds.x,
      y: targetDisplay.bounds.y,
      width: targetDisplay.bounds.width,
      height: targetDisplay.bounds.height,
      fullscreen: !isDarwin,
      simpleFullscreen: isDarwin,
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
        const isFS = win.isFullScreen() || (win.isSimpleFullScreen && win.isSimpleFullScreen());
        if (isFS) {
          if (win.setSimpleFullScreen) win.setSimpleFullScreen(false);
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

    win.webContents.on('did-finish-load', () => {
      if (lastTimerStatePayload && !win.isDestroyed()) {
        try {
          win.webContents.send('timer-state-push', lastTimerStatePayload);
        } catch (e) {}
      }
      if (lastStageMessagePayload && !win.isDestroyed()) {
        try {
          if (!lastStageMessagePayload.expiresAt || lastStageMessagePayload.expiresAt > Date.now()) {
            win.webContents.send('stage-message-push', lastStageMessagePayload);
          }
        } catch (e) {}
      }
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
    const targetPath = filePath.endsWith('.kairon') || filePath.endsWith('.json') ? filePath : `${filePath}.kairon`;
    await fs.promises.writeFile(targetPath, content, 'utf-8');
    return { success: true, filePath: targetPath };
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
    return { success: true, opened: true, content, filePath: selectedPath, ext };
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

// IPC: Choose Local Workspace Folder via Native Dialog
ipcMain.handle('choose-workspace-folder', async () => {
  try {
    const defaultStart = path.join(app.getPath('documents'), 'Kairon');
    await fs.promises.mkdir(defaultStart, { recursive: true });

    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Choose Local Workspace Folder',
      defaultPath: defaultStart,
      properties: ['openDirectory', 'createDirectory'],
    });

    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    const folderPath = result.filePaths[0];
    const folderName = path.basename(folderPath) || 'Local Workspace';
    return { success: true, folderPath, folderName };
  } catch (err) {
    console.error('choose-workspace-folder failed:', err);
    return { success: false, error: err.message };
  }
});

// IPC: Read All .kairon Rundown Files in a Local Workspace Folder
ipcMain.handle('read-workspace-folder', async (event, folderPath) => {
  try {
    if (!folderPath || !fs.existsSync(folderPath)) {
      return { success: false, error: 'Folder does not exist', programs: [] };
    }

    const entries = await fs.promises.readdir(folderPath, { withFileTypes: true });
    const programs = [];

    for (const entry of entries) {
      if (entry.isFile() && (entry.name.endsWith('.kairon') || entry.name.endsWith('.json'))) {
        try {
          const fullPath = path.join(folderPath, entry.name);
          const raw = await fs.promises.readFile(fullPath, 'utf-8');
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            const actualProg = (parsed.schema === 'kairon.rundown.v1' && parsed.program) ? parsed.program : (parsed.program || parsed);
            actualProg._filePath = fullPath;
            actualProg._fileName = entry.name;
            if (!actualProg.id) {
              actualProg.id = 'local-file-' + entry.name.replace(/\.[^/.]+$/, '');
            }
            if (!actualProg.title) {
              actualProg.title = entry.name.replace(/\.[^/.]+$/, '');
            }
            if (!actualProg.date) {
              actualProg.date = new Date().toLocaleDateString('en-CA');
            }
            if (!Array.isArray(actualProg.slots)) {
              actualProg.slots = [];
            }
            programs.push(actualProg);
          }
        } catch (fileErr) {
          console.warn('Could not parse rundown file:', entry.name, fileErr.message);
        }
      }
    }

    return { success: true, programs };
  } catch (err) {
    console.error('read-workspace-folder failed:', err);
    return { success: false, error: err.message, programs: [] };
  }
});

// IPC: Save Program into Local Workspace Folder (.kairon format)
ipcMain.handle('save-workspace-program', async (event, { folderPath, program, fileName }) => {
  try {
    if (!folderPath) {
      return { success: false, error: 'No folder path provided' };
    }
    await fs.promises.mkdir(folderPath, { recursive: true });

    const safeTitle = (program.title || 'rundown').replace(/[<>:"/\\|?*]+/g, '-').trim() || 'rundown';
    const actualName = fileName || (program.slug ? (program.slug + '.kairon') : (safeTitle + '.kairon'));
    const finalName = actualName.endsWith('.kairon') ? actualName : (actualName + '.kairon');
    const fullPath = path.join(folderPath, finalName);

    const payload = {
      ...program,
      updatedAt: new Date().toISOString(),
    };

    await fs.promises.writeFile(fullPath, JSON.stringify(payload, null, 2), 'utf-8');
    return { success: true, filePath: fullPath, fileName: finalName };
  } catch (err) {
    console.error('save-workspace-program failed:', err);
    return { success: false, error: err.message };
  }
});

// IPC: Delete / Trash Program File from Local Workspace Folder
ipcMain.handle('delete-workspace-program', async (event, { filePath }) => {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      return { success: true };
    }
    if (shell.trashItem) {
      await shell.trashItem(filePath);
    } else {
      await fs.promises.unlink(filePath);
    }
    return { success: true };
  } catch (err) {
    console.error('delete-workspace-program failed:', err);
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
  lastTimerStatePayload = payload;
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

// IPC: Return latest cached timer state on demand for newly mounted secondary windows
ipcMain.handle('get-last-timer-state', () => {
  return lastTimerStatePayload;
});

// Helper: Create detached native Flight Bridge window
function createFlightBridgeWindow(programId) {
  const effectiveId = programId || lastTimerStatePayload?.id || lastTimerStatePayload?.program?.id;
  if (flightBridgeWindow && !flightBridgeWindow.isDestroyed()) {
    if (flightBridgeWindow.isMinimized()) flightBridgeWindow.restore();
    flightBridgeWindow.show();
    flightBridgeWindow.focus();
    if (effectiveId) {
      loadRouteIntoWindow(flightBridgeWindow, `/bridge?id=${encodeURIComponent(effectiveId)}`);
    }
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

  if (process.platform === 'darwin') {
    flightBridgeWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    flightBridgeWindow.setAlwaysOnTop(true, 'screen-saver', 1);
  }

  flightBridgeWindow.on('closed', () => {
    flightBridgeWindow = null;
    if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
      mainWindow.webContents.send('flight-bridge-closed');
    }
  });

  // Stage Projection Shield: Prevent Flight Bridge from settling inside active secondary projection screens
  flightBridgeWindow.on('moved', () => {
    try {
      const activeProjectionDisplays = Object.values(secondaryWindows).filter((win) => win && !win.isDestroyed());
      if (activeProjectionDisplays.length > 0 && flightBridgeWindow && !flightBridgeWindow.isDestroyed()) {
        const fbBounds = flightBridgeWindow.getBounds();
        const overlapsProjection = activeProjectionDisplays.some((secWin) => {
          const secBounds = secWin.getBounds();
          return (
            fbBounds.x < secBounds.x + secBounds.width &&
            fbBounds.x + fbBounds.width > secBounds.x &&
            fbBounds.y < secBounds.y + secBounds.height &&
            fbBounds.y + fbBounds.height > secBounds.y
          );
        });
        if (overlapsProjection) {
          console.warn('[AV Shield] Flight Bridge moved onto active projection screen. Snapping back to operator screen.');
          recallFlightBridgeToPrimary();
        }
      }
    } catch (shieldErr) {
      console.warn('[AV Shield] error checking bounds:', shieldErr);
    }
  });

  flightBridgeWindow.webContents.on('did-finish-load', () => {
    if (lastTimerStatePayload && flightBridgeWindow && !flightBridgeWindow.isDestroyed()) {
      try {
        flightBridgeWindow.webContents.send('timer-state-push', lastTimerStatePayload);
      } catch (e) {}
    }
  });

  loadRouteIntoWindow(flightBridgeWindow, effectiveId ? `/bridge?id=${encodeURIComponent(effectiveId)}` : '/bridge');
  return { success: true, open: true };
}

// IPC: Native Detached Flight Bridge management
ipcMain.handle('open-flight-bridge', (event, opts) => {
  return createFlightBridgeWindow(typeof opts === 'string' ? opts : opts?.programId);
});

ipcMain.handle('close-flight-bridge', () => {
  if (flightBridgeWindow && !flightBridgeWindow.isDestroyed()) {
    flightBridgeWindow.close();
    flightBridgeWindow = null;
    return { success: true, open: false };
  }
  return { success: false, open: false };
});

ipcMain.handle('toggle-flight-bridge', (event, opts) => {
  if (flightBridgeWindow && !flightBridgeWindow.isDestroyed()) {
    flightBridgeWindow.close();
    flightBridgeWindow = null;
    return { success: true, open: false };
  } else {
    return createFlightBridgeWindow(typeof opts === 'string' ? opts : opts?.programId);
  }
});

// Helper & IPC: Recall Flight Bridge to Primary Screen safe corner
function recallFlightBridgeToPrimary() {
  if (flightBridgeWindow && !flightBridgeWindow.isDestroyed()) {
    const primaryDisplay = screen.getPrimaryDisplay();
    const width = 380;
    const height = 580;
    const x = primaryDisplay.bounds.x + primaryDisplay.bounds.width - width - 30;
    const y = primaryDisplay.bounds.y + primaryDisplay.bounds.height - height - 60;
    flightBridgeWindow.setBounds({ x, y, width, height });
    if (flightBridgeWindow.isMinimized()) flightBridgeWindow.restore();
    flightBridgeWindow.show();
    flightBridgeWindow.focus();
    return { success: true, recalled: true };
  }
  return { success: false, open: false };
}

ipcMain.handle('recall-flight-bridge', () => {
  return recallFlightBridgeToPrimary();
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

// IPC: Stage Cue Message relay across all Electron BrowserWindows
ipcMain.on('stage-message-relay', (event, payload) => {
  lastStageMessagePayload = payload;
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents && event.sender !== mainWindow.webContents) {
    try {
      mainWindow.webContents.send('stage-message-push', payload);
    } catch {}
  }
  Object.values(secondaryWindows).forEach((win) => {
    if (win && !win.isDestroyed() && win.webContents && event.sender !== win.webContents) {
      try {
        win.webContents.send('stage-message-push', payload);
      } catch {}
    }
  });
  if (flightBridgeWindow && !flightBridgeWindow.isDestroyed() && flightBridgeWindow.webContents && event.sender !== flightBridgeWindow.webContents) {
    try {
      flightBridgeWindow.webContents.send('stage-message-push', payload);
    } catch {}
  }
});

ipcMain.handle('get-last-stage-message', () => {
  if (lastStageMessagePayload && lastStageMessagePayload.expiresAt && lastStageMessagePayload.expiresAt <= Date.now()) {
    lastStageMessagePayload = null;
  }
  return lastStageMessagePayload;
});

// IPC: Direct vector PDF generation and disk export via webContents.printToPDF
ipcMain.handle('save-pdf', async (event, { title } = {}) => {
  try {
    const targetWin = BrowserWindow.fromWebContents(event.sender) || mainWindow;
    if (!targetWin || targetWin.isDestroyed()) {
      return { success: false, error: 'No active window available' };
    }

    const cleanTitle = (title || 'Kairon_Schedule')
      .replace(/[^a-zA-Z0-9_\-\s]/g, '')
      .trim()
      .replace(/\s+/g, '_');
    const defaultPath = path.join(app.getPath('documents'), `${cleanTitle}_Rundown.pdf`);

    const { canceled, filePath } = await dialog.showSaveDialog(targetWin, {
      title: 'Save Schedule PDF',
      defaultPath,
      filters: [{ name: 'PDF Documents (*.pdf)', extensions: ['pdf'] }]
    });

    if (canceled || !filePath) {
      return { success: false, canceled: true };
    }

    const targetPath = filePath.toLowerCase().endsWith('.pdf') ? filePath : `${filePath}.pdf`;

    const pdfBuffer = await targetWin.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      landscape: false,
      margins: {
        marginType: 'printableArea'
      }
    });

    fs.writeFileSync(targetPath, pdfBuffer);
    return { success: true, filePath: targetPath };
  } catch (err) {
    console.error('[Kairon Main] save-pdf failed:', err);
    return { success: false, error: err.message };
  }
});

// IPC: Resilient update checker with fallback to GitHub Atom feed (bypasses REST API rate limiting)
ipcMain.handle('check-for-updates', async () => {
  try {
    // 1. Try standard GitHub REST API
    const apiRes = await fetch('https://api.github.com/repos/patrickudo2004/kairon/releases/latest', {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Kairon-Desktop-App'
      }
    });

    if (apiRes.ok) {
      const data = await apiRes.json();
      return { success: true, source: 'api', data };
    }

    // 2. Fallback to GitHub Releases Atom feed (unauthenticated & unthrottled)
    const atomRes = await fetch('https://github.com/patrickudo2004/kairon/releases.atom', {
      headers: { 'User-Agent': 'Kairon-Desktop-App' }
    });

    if (atomRes.ok) {
      const xml = await atomRes.text();
      const entryMatch = xml.match(/<entry>[\s\S]*?<\/entry>/);
      if (entryMatch) {
        const entry = entryMatch[0];
        const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
        const linkMatch = entry.match(/<link[^>]*href="([^"]+)"/);
        const updatedMatch = entry.match(/<updated>([^<]+)<\/updated>/);
        const contentMatch = entry.match(/<content[^>]*>([\s\S]*?)<\/content>/);

        const rawTag = titleMatch ? titleMatch[1].trim() : '';
        const tag = rawTag.startsWith('v') ? rawTag : `v${rawTag}`;
        const cleanTag = rawTag.replace(/^v/i, '');

        return {
          success: true,
          source: 'atom',
          data: {
            tag_name: tag,
            name: `Kairon ${tag}`,
            body: contentMatch ? contentMatch[1].replace(/<[^>]+>/g, '').trim() : 'Release notes available on GitHub.',
            published_at: updatedMatch ? updatedMatch[1] : new Date().toISOString(),
            html_url: linkMatch ? linkMatch[1] : `https://github.com/patrickudo2004/kairon/releases/tag/${tag}`,
            assets: [
              {
                name: `Kairon-Setup-${cleanTag}.exe`,
                browser_download_url: `https://github.com/patrickudo2004/kairon/releases/download/${tag}/Kairon-Setup-${cleanTag}.exe`
              },
              {
                name: `Kairon-${cleanTag}.dmg`,
                browser_download_url: `https://github.com/patrickudo2004/kairon/releases/download/${tag}/Kairon-${cleanTag}.dmg`
              },
              {
                name: `Kairon-${cleanTag}.AppImage`,
                browser_download_url: `https://github.com/patrickudo2004/kairon/releases/download/${tag}/Kairon-${cleanTag}.AppImage`
              }
            ]
          }
        };
      }
    }
    return { success: false, error: 'Could not fetch release from GitHub API or Atom feed' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});




