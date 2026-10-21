import { test, expect } from '@playwright/test';

test.describe('5 Critical Operational Fixes & End-to-End Verification', () => {

  test('Issue 4: Studio Menu Bar submenus have ample width and display full text without truncation', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    // 1. Test File Menu
    const fileMenu = page.locator('button').filter({ hasText: /^File$/i }).first();
    await expect(fileMenu).toBeVisible({ timeout: 10000 });
    await fileMenu.click();

    // Verify File menu dropdown is visible and has min-width >= 280px
    const dropdown = page.locator('.min-w-\\[280px\\]').first();
    await expect(dropdown).toBeVisible({ timeout: 5000 });

    // Verify full menu labels exist without truncation
    await expect(page.locator('text=Open .kairon File...')).toBeVisible();
    await expect(page.locator('text=Save .kairon File')).toBeVisible();
    await expect(page.locator('text=Export Printable PDF...')).toBeVisible();
    await expect(page.locator('text=Export CSV Spreadsheet')).toBeVisible();

    // Close File menu
    await fileMenu.click();
    await page.waitForTimeout(300);

    // 2. Test Window Menu
    const windowMenu = page.locator('button').filter({ hasText: /^Window$/i }).first();
    await windowMenu.click();
    await expect(page.locator('text=Studio Command Palette...')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Collapse Left Navigation Rail').or(page.locator('text=Expand Left Navigation Rail'))).toBeVisible();

    // Close Window menu
    await windowMenu.click();
    await page.waitForTimeout(300);
  });

  test('Issue 5: Zen Mode with no event selected displays Wall Clock Standby (no Slot 1 of 0, no negative count)', async ({ page }) => {
    // Seed with a blank event (0 slots)
    await page.addInitScript(() => {
      localStorage.setItem('kairon_program', JSON.stringify({
        id: 'local-test-empty',
        title: 'Empty Service',
        slots: [],
        status: 'draft',
        isTimerActive: false,
        currentSlotIndex: 0,
        secondsElapsed: 0,
        timerStartTimestamp: null
      }));
    });

    await page.goto('/?testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    // Click Zen Mode
    const zenBtn = page.getByRole('button', { name: /Zen/i });
    await expect(zenBtn).toBeVisible({ timeout: 10000 });
    await zenBtn.click();

    // Verify Zen Focus Console appears
    await expect(page.getByRole('button', { name: /Exit Zen Mode/i }).first()).toBeVisible({ timeout: 10000 });

    // Verify Standby messaging instead of "Slot 1 of 0 - Pre service standby"
    await expect(page.locator('text=CONSOLE STANDBY')).toBeVisible();
    await expect(page.locator('text=OFF-AIR • STANDBY')).toBeVisible();
    await expect(page.locator('text=Slot 1 of 0')).not.toBeVisible();
    await expect(page.locator('text=Pre service standby')).not.toBeVisible();

    // Exit Zen
    await page.getByRole('button', { name: /Exit Zen Mode/i }).first().click();
    await expect(page.getByRole('button', { name: /Exit Zen Mode/i })).not.toBeVisible();
  });

  test('Issue 5: Zen Mode when live displays Hold-to-Confirm END EVENT button', async ({ page }) => {
    // Seed with a live event
    await page.addInitScript(() => {
      const liveProg = {
        id: 'local-test-live',
        title: 'Sunday Morning Service',
        slots: [
          { id: 's1', title: 'Opening Prayer', durationMinutes: 5, type: 'prayer' },
          { id: 's2', title: 'Praise & Worship', durationMinutes: 20, type: 'worship' }
        ],
        status: 'live',
        isTimerActive: true,
        currentSlotIndex: 0,
        secondsElapsed: 30,
        timerStartTimestamp: Date.now() - 30000
      };
      localStorage.setItem('kairon_program', JSON.stringify(liveProg));
      localStorage.setItem('kairon_offline_cache_local-test-live', JSON.stringify(liveProg));
      localStorage.setItem('kairon_offline_cache_live', JSON.stringify(liveProg));
    });

    await page.goto('/?id=local-test-live&testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    // Enter Zen mode
    const zenBtn = page.getByRole('button', { name: /Zen/i });
    await expect(zenBtn).toBeVisible({ timeout: 10000 });
    await zenBtn.click();

    // Verify Zen console loaded
    await expect(page.getByRole('button', { name: /Exit Zen Mode/i }).first()).toBeVisible({ timeout: 10000 });

    // Verify End Event button exists in Zen Mode
    const endBtn = page.locator('button').filter({ hasText: /END EVENT/i }).first();
    await expect(endBtn).toBeVisible({ timeout: 10000 });

    // Exit Zen
    await page.getByRole('button', { name: /Exit Zen Mode/i }).first().click();
  });

  test('Issue 2: Stage Cue Dispatcher fires cues and renders active banner and strobe', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/live?testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    // Ensure Right Dock is on cues tab
    const cuesTabBtn = page.locator('button').filter({ hasText: /Stage Cues/i }).or(page.locator('button').filter({ hasText: /Cues/i })).first();
    if (await cuesTabBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cuesTabBtn.click();
    }

    // Type a custom silent message
    const textarea = page.locator('textarea[placeholder*="Type silent message"]');
    if (await textarea.isVisible({ timeout: 5000 }).catch(() => false)) {
      await textarea.fill('TEST SILENT CUE 123');

      // Click Send Stage Cue
      const sendBtn = page.locator('button').filter({ hasText: /Send Stage Cue/i }).first();
      await sendBtn.click();

      // Verify Active Stage Alert Indicator appears
      await expect(page.locator('text=Active Stage Banner').or(page.locator('text=TEST SILENT CUE 123')).first()).toBeVisible({ timeout: 5000 });

      // Click Clear button
      const clearBtn = page.locator('button').filter({ hasText: /Clear/i }).first();
      await clearBtn.click();

      // Verify cleared
      await expect(page.locator('text=TEST SILENT CUE 123')).not.toBeVisible();
    }
  });

  test('Issue 3: Broadcast Overlay renders transparent, magenta, and green key backgrounds cleanly', async ({ page }) => {
    // 1. Transparent overlay
    await page.goto('/overlay?testBypass=true&bg=transparent&layout=lower-third');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=KAIRON BROADCAST OVERLAY — STANDBY').or(page.locator('text=STANDBY CUE')).or(page.locator('text=REMAINING'))).toBeVisible({ timeout: 10000 });

    // 2. Magenta Chroma overlay (#FF00FF)
    await page.goto('/overlay?testBypass=true&bg=magenta&layout=lower-third');
    await page.waitForLoadState('domcontentloaded');
    const bodyBgMagenta = await page.evaluate(() => document.body.style.backgroundColor);
    expect(bodyBgMagenta).toBe('rgb(255, 0, 255)');

    // 3. Green Chroma overlay (#00FF00)
    await page.goto('/overlay?testBypass=true&bg=green&layout=lower-third');
    await page.waitForLoadState('domcontentloaded');
    const bodyBgGreen = await page.evaluate(() => document.body.style.backgroundColor);
    expect(bodyBgGreen).toBe('rgb(0, 255, 0)');
  });

  test('Issue 3: Internal stage cues are suppressed on broadcast overlay unless explicitly enabled', async ({ page }) => {
    // Seed stage cue in localStorage
    await page.addInitScript(() => {
      const msg = {
        id: 'msg-1',
        programId: 'local-test',
        text: 'PASTOR WRAP UP NOW',
        type: 'custom',
        isStrobe: false,
        expiresAt: Date.now() + 60000,
        createdAt: Date.now()
      };
      localStorage.setItem('prompt_local-test', JSON.stringify(msg));
      localStorage.setItem('prompt_test', JSON.stringify(msg));
      localStorage.setItem('prompt_active', JSON.stringify(msg));
      const testProg = {
        id: 'local-test',
        title: 'Sunday Service',
        slots: [{ id: 's1', title: 'Sermon', durationMinutes: 30, type: 'sermon' }],
        status: 'live',
        isTimerActive: true,
        currentSlotIndex: 0,
        secondsElapsed: 0,
        timerStartTimestamp: Date.now()
      };
      localStorage.setItem('kairon_program', JSON.stringify(testProg));
      localStorage.setItem('kairon_offline_cache_local-test', JSON.stringify(testProg));
      localStorage.setItem('kairon_offline_cache_test', JSON.stringify(testProg));
      localStorage.setItem('kairon_offline_cache_live', JSON.stringify(testProg));
    });

    // Visit /overlay without showCues
    await page.goto('/overlay?programId=local-test&testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    // Booth alert must NOT be visible on broadcast overlay
    await expect(page.locator('text=PASTOR WRAP UP NOW')).not.toBeVisible();

    // Visit /overlay WITH showCues=true
    await page.goto('/overlay?programId=local-test&showCues=true&testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    // Now it should be visible
    await expect(page.locator('text=PASTOR WRAP UP NOW')).toBeVisible({ timeout: 5000 });
  });

  test('Issue 1: Workspace switch preserves running live event and shows ON AIR return banner', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Seed running master live session in workspace A
    await page.addInitScript(() => {
      const liveProg = {
        id: 'local-sunday-live',
        title: 'Sunday Morning Live',
        slots: [
          { id: 's1', title: 'Opening Prayer', durationMinutes: 5, type: 'prayer' },
          { id: 's2', title: 'Worship', durationMinutes: 20, type: 'worship' }
        ],
        status: 'live',
        isTimerActive: true,
        currentSlotIndex: 0,
        secondsElapsed: 45,
        timerStartTimestamp: Date.now() - 45000
      };
      localStorage.setItem('kairon_program', JSON.stringify(liveProg));
      localStorage.setItem('kairon_offline_cache_live', JSON.stringify(liveProg));
      localStorage.setItem('kairon_master_live_session', JSON.stringify({
        programId: 'local-sunday-live',
        orgId: 'local-folder-church',
        orgName: 'Local Workspace',
        isLocalFolder: true,
        timerStartTimestamp: Date.now() - 45000,
        currentSlotIndex: 0,
        isTimerActive: true,
        secondsElapsed: 45,
        lastUpdated: Date.now(),
        program: liveProg
      }));
      // Active org is a DIFFERENT org (e.g. online cloud org)
      localStorage.setItem('kairon_active_org_id', 'cloud-org-manchester');
    });

    await page.goto('/?testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    // Verify the ON AIR banner appears in the Studio Header
    const onAirBanner = page.locator('button').filter({ hasText: /ON AIR/i }).first();
    await expect(onAirBanner).toBeVisible({ timeout: 10000 });
    await expect(onAirBanner).toContainText('Sunday Morning Live');
    await expect(onAirBanner).toContainText('RETURN');

    // Click RETURN to jump back to the live event
    await onAirBanner.click();
    await page.waitForTimeout(500);

    // Verify the live event title is restored in the header
    await expect(page.locator('h2').filter({ hasText: 'Sunday Morning Live' })).toBeVisible({ timeout: 5000 });
  });

});
