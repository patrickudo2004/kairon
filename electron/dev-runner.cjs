const { spawn } = require('child_process');
const electronPath = require('electron');

// Ensure ELECTRON_RUN_AS_NODE is completely deleted from env
// (In Electron's C++ core, getenv("ELECTRON_RUN_AS_NODE") is checked for nullptr;
// setting it to "" is still truthy and forces Node CLI mode instead of GUI mode)
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

console.log('[Kairon Studio] Launching native Electron desktop window...');

const child = spawn(electronPath, ['.', '--enable-logging'], {
  stdio: 'inherit',
  env,
  windowsHide: false,
});

child.on('close', (code) => {
  process.exit(code || 0);
});

child.on('error', (err) => {
  console.error('[Kairon Studio] Failed to start Electron:', err);
  process.exit(1);
});
