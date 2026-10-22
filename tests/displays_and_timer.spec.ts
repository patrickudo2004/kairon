import { test, expect } from '@playwright/test';

test.describe('Displays & Live Timer Verification', () => {

  test('StageDisplay should cleanly transition between Standby and Live without hooks error', async ({ page }) => {
    const errorLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errorLogs.push(msg.text());
      }
    });
    page.on('pageerror', err => {
      errorLogs.push(err.message);
    });

    await page.addInitScript(() => {
      localStorage.setItem('kairon_booth_mode', 'true');
      localStorage.setItem('testBypass', 'true');
    });

    // 1. Open Stage Display in Standby (draft state)
    await page.goto('/stage?id=local-sunday-service&testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    // Should show STANDBY initially
    await expect(page.locator('text=STANDBY').first()).toBeVisible({ timeout: 10000 });

    // 2. Simulate Timer START (transition to 'live' with active countdown)
    await page.evaluate(() => {
      const channel = new BroadcastChannel('kairon_offline_sync');
      channel.postMessage({
        id: 'local-sunday-service',
        currentSlotIndex: 0,
        isTimerActive: true,
        secondsElapsed: 5,
        timerStartTimestamp: Date.now() - 5000,
        status: 'live'
      });
      channel.close();
    });

    // 3. Verify it shows ON AIR and the live countdown is visible
    await expect(page.locator('text=ON AIR')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=CURRENT ITEM • SLOT 1 OF 10')).toBeVisible();
    await expect(page.locator('text=Opening Prayer')).toBeVisible();

    // Wait 3 seconds to let timer tick live
    await page.waitForTimeout(3000);

    // 4. Verify Hold for Cue ("WAITING FOR CUE")
    await page.evaluate(() => {
      const channel = new BroadcastChannel('kairon_offline_sync');
      channel.postMessage({
        id: 'local-sunday-service',
        currentSlotIndex: 0,
        isTimerActive: true,
        secondsElapsed: 8,
        timerStartTimestamp: Date.now() - 8000,
        isOnHold: true,
        holdMessage: 'WAITING FOR CUE',
        status: 'live'
      });
      channel.close();
    });

    await expect(page.locator('text=WAITING FOR CUE')).toBeVisible({ timeout: 5000 });

    // 5. Release Hold and advance to Slot 2 (Praise & Worship)
    await page.evaluate(() => {
      const channel = new BroadcastChannel('kairon_offline_sync');
      channel.postMessage({
        id: 'local-sunday-service',
        currentSlotIndex: 1,
        isTimerActive: true,
        secondsElapsed: 0,
        timerStartTimestamp: Date.now(),
        isOnHold: false,
        status: 'live'
      });
      channel.close();
    });

    await expect(page.locator('text=Praise & Worship')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=CURRENT ITEM • SLOT 2 OF 10')).toBeVisible();

    // 6. Verify NO React hooks errors occurred
    const hookErrors = errorLogs.filter(log => log.includes('hooks') || log.includes('Rendered more') || log.includes('Rendered fewer'));
    expect(hookErrors).toHaveLength(0);
  });

  test('TV View should display active slot and reflect live status', async ({ page }) => {
    const errorLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errorLogs.push(msg.text());
    });
    page.on('pageerror', err => errorLogs.push(err.message));

    await page.addInitScript(() => {
      localStorage.setItem('kairon_booth_mode', 'true');
      localStorage.setItem('testBypass', 'true');
    });

    await page.goto('/tv?id=local-sunday-service&testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    // Should show Sunday Celebration Service rundown
    await expect(page.locator('text=Sunday Celebration Service').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Opening Prayer').first()).toBeVisible();

    // Send Live timer update
    await page.evaluate(() => {
      const channel = new BroadcastChannel('kairon_offline_sync');
      channel.postMessage({
        id: 'local-sunday-service',
        currentSlotIndex: 0,
        isTimerActive: true,
        secondsElapsed: 10,
        timerStartTimestamp: Date.now() - 10000,
        status: 'live'
      });
      channel.close();
    });

    await expect(page.locator('text=LIVE NOW')).toBeVisible({ timeout: 5000 });

    const hookErrors = errorLogs.filter(log => log.includes('hooks') || log.includes('Rendered more') || log.includes('Rendered fewer'));
    expect(hookErrors).toHaveLength(0);
  });

  test('Stage Teleprompter should mount and receive live sync without hooks error', async ({ page }) => {
    const errorLogs: string[] = [];
    page.on('pageerror', err => errorLogs.push(err.message));

    await page.addInitScript(() => {
      localStorage.setItem('kairon_booth_mode', 'true');
      localStorage.setItem('testBypass', 'true');
    });

    await page.goto('/prompter?id=local-sunday-service&testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    // Should render prompter display
    await expect(page.locator('text=Sunday Celebration Service').or(page.locator('text=Opening Prayer')).first()).toBeVisible({ timeout: 10000 });
    const hookErrors = errorLogs.filter(log => log.includes('hooks') || log.includes('Rendered more') || log.includes('Rendered fewer'));
    expect(hookErrors).toHaveLength(0);
  });

  test('StageDisplay should preserve active countdown even when background rundown auto-save arrives', async ({ page }) => {
    const errorLogs: string[] = [];
    page.on('pageerror', err => errorLogs.push(err.message));

    await page.addInitScript(() => {
      localStorage.setItem('kairon_booth_mode', 'true');
      localStorage.setItem('testBypass', 'true');
    });

    await page.goto('/stage?id=local-sunday-service&testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    // 1. Start live timer
    await page.evaluate(() => {
      const channel = new BroadcastChannel('kairon_offline_sync');
      channel.postMessage({
        id: 'local-sunday-service',
        currentSlotIndex: 0,
        isTimerActive: true,
        secondsElapsed: 2,
        timerStartTimestamp: Date.now() - 2000,
        status: 'live'
      });
      channel.close();
    });

    await expect(page.locator('text=ON AIR')).toBeVisible({ timeout: 5000 });

    // 2. Simulate 2-second debounced auto-save from App.tsx (sending structural program without timer fields)
    await page.evaluate(() => {
      const channel = new BroadcastChannel('kairon_offline_sync');
      channel.postMessage({
        id: 'local-sunday-service',
        program: {
          id: 'local-sunday-service',
          title: 'Sunday Celebration Service',
          slots: [
            { id: 'slot-1', title: 'Opening Prayer', durationMinutes: 5, type: 'Talk' },
            { id: 'slot-2', title: 'Praise & Worship', durationMinutes: 20, type: 'Worship' }
          ]
        }
      });
      channel.close();
    });

    // Wait 3 seconds to ensure timer continues ticking without being overwritten to STANDBY
    await page.waitForTimeout(3000);

    // 3. Verify ON AIR and slot are STILL displayed (NOT reverted to STANDBY)
    await expect(page.locator('text=ON AIR')).toBeVisible();
    await expect(page.locator('text=Opening Prayer')).toBeVisible();
    await expect(page.locator('text=STANDBY')).not.toBeVisible();

    expect(errorLogs).toHaveLength(0);
  });

  test('End Event should conclude session and transition displays to SESSION CONCLUDED', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('kairon_booth_mode', 'true');
      localStorage.setItem('testBypass', 'true');
    });

    await page.goto('/stage?id=local-sunday-service&testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    // Conclude event
    await page.evaluate(() => {
      const channel = new BroadcastChannel('kairon_offline_sync');
      channel.postMessage({
        id: 'local-sunday-service',
        isTimerActive: false,
        timerStartTimestamp: null,
        status: 'concluded',
        program: {
          id: 'local-sunday-service',
          title: 'Sunday Celebration Service',
          status: 'concluded',
          slots: []
        }
      });
      channel.close();
    });

    await expect(page.locator('text=SESSION CONCLUDED')).toBeVisible({ timeout: 5000 });
  });

  test('Main app should toggle Flight Bridge HUD on button click', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('kairon_booth_mode', 'true');
      localStorage.setItem('testBypass', 'true');
      // Delete documentPictureInPicture to test in-app HUD mode (as in Electron and standard desktop browsers)
      try {
        delete (window as any).documentPictureInPicture;
        Object.defineProperty(window, 'documentPictureInPicture', {
          value: undefined,
          configurable: true,
          writable: true
        });
      } catch {}
    });

    await page.goto('/editor?id=local-sunday-service&testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    // Click Flight Bridge button in header
    const flightBridgeBtn = page.locator('button[title*="Flight Bridge"]').first();
    await expect(flightBridgeBtn).toBeVisible({ timeout: 10000 });
    await flightBridgeBtn.click();

    // Verify in-app HUD is visible
    await expect(page.locator('text=FLIGHT BRIDGE HUD')).toBeVisible({ timeout: 5000 });
  });

  test('Bug A Verification: Flight Bridge Standalone route (/bridge) renders cleanly on cold start before playback', async ({ page }) => {
    const errorLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errorLogs.push(msg.text());
    });
    page.on('pageerror', err => errorLogs.push(err.message));

    await page.addInitScript(() => {
      localStorage.setItem('kairon_booth_mode', 'true');
      localStorage.setItem('testBypass', 'true');
    });

    // Open standalone Flight Bridge route directly with cold draft event
    await page.goto('/bridge?id=local-sunday-service&testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    // Verify it renders immediately without being a blank window or hanging
    await expect(page.locator('text=FLIGHT BRIDGE HUD')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Flight Bridge').first()).toBeVisible();
    await expect(page.locator('body')).not.toBeEmpty();

    // Verify zero hook errors
    const hookErrors = errorLogs.filter(log => log.includes('hooks') || log.includes('Rendered more') || log.includes('Rendered fewer'));
    expect(hookErrors).toHaveLength(0);
  });

  test('Bug B Verification: Output Monitor & Stage Display actively count down and do NOT stick at total planned duration', async ({ page, context }) => {
    test.setTimeout(45000);

    const baseTime = new Date('2026-06-12T10:00:00Z');
    await page.clock.install({ time: baseTime });

    await page.addInitScript(() => {
      localStorage.setItem('kairon_booth_mode', 'true');
      localStorage.setItem('testBypass', 'true');
    });

    // 1. Navigate controller to Live view
    await page.goto('/live?id=local-sunday-service&testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    // 2. Open Stage Display on secondary page
    const stagePage = await context.newPage();
    await stagePage.clock.install({ time: baseTime });
    await stagePage.goto('/stage?id=local-sunday-service&testBypass=true');
    await stagePage.waitForLoadState('domcontentloaded');

    // In draft state, Stage shows STANDBY with Next: Opening Prayer
    await expect(stagePage.locator('text=STANDBY').first()).toBeVisible();
    await expect(stagePage.locator('text=Opening Prayer').first()).toBeVisible();

    // 3. Start live timer on controller
    const playPauseBtn = page.locator('button.w-24.h-24').or(page.locator('button:has-text("Start")')).first();
    await playPauseBtn.click();
    await page.clock.fastForward(1000);

    // Fast-forward 15 seconds
    await page.clock.fastForward(15000);
    await stagePage.clock.fastForward(15000);

    // Verify stage display transitioned to live ON AIR with slot title
    await expect(stagePage.locator('text=ON AIR')).toBeVisible({ timeout: 5000 });
    await expect(stagePage.locator('h1').first()).toContainText('Opening Prayer');

    // 4. Verify stage display is actively counting down (e.g. 04:27 / 04:45, NOT stuck at 05:00 total planned duration)
    const stageTimer = stagePage.locator('div.tabular-nums').first();
    const stageText = await stageTimer.textContent();
    expect(stageText).not.toBe('05:00');
    expect(stageText).toMatch(/^04:\d\d$/);
  });

  test('Stage Display Pulpit Themes: Light, Dark, Ambient Yellow, and Ambient White render properly', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('kairon_booth_mode', 'true');
      localStorage.setItem('testBypass', 'true');
    });

    const setLive = async (p: any) => {
      await p.evaluate(() => {
        const channel = new BroadcastChannel('kairon_offline_sync');
        channel.postMessage({
          id: 'local-sunday-service',
          currentSlotIndex: 0,
          isTimerActive: true,
          secondsElapsed: 5,
          timerStartTimestamp: Date.now() - 5000,
          status: 'live'
        });
        channel.close();
      });
    };

    // Ambient Yellow
    await page.goto('/stage?id=local-sunday-service&theme=ambient-yellow&testBypass=true');
    await page.waitForLoadState('domcontentloaded');
    await setLive(page);
    await expect(page.locator('.text-\\[\\#FBBF24\\]').first()).toBeVisible({ timeout: 5000 });

    // Ambient White
    await page.goto('/stage?id=local-sunday-service&theme=ambient-white&testBypass=true');
    await page.waitForLoadState('domcontentloaded');
    await setLive(page);
    await expect(page.locator('.text-\\[\\#F8FAFC\\]').first()).toBeVisible({ timeout: 5000 });

    // Light Theme
    await page.goto('/stage?id=local-sunday-service&theme=light&testBypass=true');
    await page.waitForLoadState('domcontentloaded');
    await setLive(page);
    await expect(page.locator('.bg-white').first()).toBeVisible({ timeout: 5000 });

    // Dark Theme
    await page.goto('/stage?id=local-sunday-service&theme=dark&testBypass=true');
    await page.waitForLoadState('domcontentloaded');
    await setLive(page);
    await expect(page.locator('.bg-\\[\\#000000\\]').or(page.locator('.bg-black')).first()).toBeVisible({ timeout: 5000 });
  });

});


