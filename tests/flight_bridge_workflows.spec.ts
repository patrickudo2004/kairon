import { test, expect } from '@playwright/test';

test.describe('Flight Bridge & Recall System End-to-End User Workflows', () => {

  test('should render Return to App and Snap buttons in Standalone Flight Bridge (/bridge) and handle clicks', async ({ page }) => {
    // Inject mock electron API to verify IPC handlers
    await page.addInitScript(() => {
      localStorage.setItem('kairon_booth_mode', 'true');
      localStorage.setItem('testBypass', 'true');
      (window as any).electronEvents = [];
      (window as any).electron = {
        isElectron: true,
        focusMainWindow: () => {
          (window as any).electronEvents.push('focusMainWindow');
        },
        recallFlightBridge: () => {
          (window as any).electronEvents.push('recallFlightBridge');
          return Promise.resolve({ success: true, recalled: true });
        },
        closeFlightBridge: () => {
          (window as any).electronEvents.push('closeFlightBridge');
        },
        sendTimerControl: (msg: any) => {
          (window as any).electronEvents.push({ type: 'sendTimerControl', msg });
        },
        onTimerState: () => () => {},
        getLastTimerState: () => Promise.resolve(null),
      };
    });

    await page.goto('/bridge?id=local-sunday-service&testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    // 1. Verify header title and icons exist
    await expect(page.locator('text=FLIGHT BRIDGE HUD')).toBeVisible({ timeout: 10000 });

    const returnBtn = page.locator('button[title*="Return to Main App"]').first();
    await expect(returnBtn).toBeVisible({ timeout: 5000 });

    const snapBtn = page.locator('button[title*="Snap to Primary Screen"]').first();
    await expect(snapBtn).toBeVisible({ timeout: 5000 });

    // 2. Click "Return to Main App" button
    await returnBtn.click();
    const returnEvents = await page.evaluate(() => (window as any).electronEvents);
    expect(returnEvents).toContain('focusMainWindow');

    // 3. Click "Snap to Primary Screen" button
    await snapBtn.click();
    const snapEvents = await page.evaluate(() => (window as any).electronEvents);
    expect(snapEvents).toContain('recallFlightBridge');

    // 4. Double click header drag region to verify Snap / Recall trigger
    const dragHeader = page.locator('div[title*="Double-click to snap back"]').first();
    await dragHeader.dblclick();
    const dblClickEvents = await page.evaluate(() => (window as any).electronEvents);
    const recallCount = dblClickEvents.filter((e: any) => e === 'recallFlightBridge').length;
    expect(recallCount).toBeGreaterThanOrEqual(2);
  });

  test('should open in-app Flight Bridge HUD, allow repositioning, and recall using Shift + B', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('kairon_booth_mode', 'true');
      localStorage.setItem('testBypass', 'true');
      // Simulate browser environment without Document PiP so in-app HUD opens
      try {
        delete (window as any).documentPictureInPicture;
        Object.defineProperty(window, 'documentPictureInPicture', {
          value: undefined,
          configurable: true,
          writable: true
        });
      } catch {}
    });

    await page.goto('/live?id=local-sunday-service&testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    // 1. Open Flight Bridge HUD
    const fbBtn = page.locator('button[title*="Flight Bridge"]').first();
    await expect(fbBtn).toBeVisible({ timeout: 10000 });
    await fbBtn.click();

    // 2. Verify HUD is open
    const hudHeader = page.locator('text=FLIGHT BRIDGE HUD').first();
    await expect(hudHeader).toBeVisible({ timeout: 5000 });

    // 3. Set a displaced position in localStorage and HUD state
    await page.evaluate(() => {
      localStorage.setItem('kairon_flight_bridge_pos', JSON.stringify({ x: 50, y: 50 }));
    });

    // 4. Trigger Shift + B keyboard shortcut
    await page.locator('body').click();
    await page.keyboard.press('Shift+B');
    await page.waitForTimeout(200);

    // 5. Verify localStorage position was cleared by recall
    const storedPos = await page.evaluate(() => localStorage.getItem('kairon_flight_bridge_pos'));
    expect(storedPos).toBeNull();
  });

  test('should recall Flight Bridge using right-click context menu on top bar button', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('kairon_booth_mode', 'true');
      localStorage.setItem('testBypass', 'true');
      try {
        delete (window as any).documentPictureInPicture;
        Object.defineProperty(window, 'documentPictureInPicture', {
          value: undefined,
          configurable: true,
          writable: true
        });
      } catch {}
    });

    await page.goto('/live?id=local-sunday-service&testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    // 1. Set displaced pos in localStorage
    await page.evaluate(() => {
      localStorage.setItem('kairon_flight_bridge_pos', JSON.stringify({ x: 100, y: 100 }));
    });

    // 2. Right-click Flight Bridge button in header
    const fbBtn = page.locator('button[title*="Flight Bridge"]').first();
    await expect(fbBtn).toBeVisible({ timeout: 10000 });
    await fbBtn.click({ button: 'right' });

    // 3. Verify localStorage position was cleared by right-click recall
    const storedPos = await page.evaluate(() => localStorage.getItem('kairon_flight_bridge_pos'));
    expect(storedPos).toBeNull();
  });

  test('should display Shift + B in Broadcast Keyboard Hotkeys Reference modal', async ({ page }) => {
    await page.goto('/?testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    // Open hotkeys modal by pressing '?'
    await page.locator('body').click();
    await page.keyboard.press('?');

    // Verify modal is visible
    await expect(page.locator('text=Broadcast Keyboard Hotkeys')).toBeVisible({ timeout: 5000 });

    // Verify Shift + B is documented with Recall Flight Bridge
    await expect(page.locator('text=Shift + B')).toBeVisible();
    await expect(page.locator('text=Recall Flight Bridge to Screen 1')).toBeVisible();

    // Close modal with Escape
    await page.keyboard.press('Escape');
    await expect(page.locator('text=Broadcast Keyboard Hotkeys')).not.toBeVisible();
  });

});
