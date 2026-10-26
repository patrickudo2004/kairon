import { test, expect } from '@playwright/test';
import { PRODUCTION_TEMPLATES } from '../utils/rundownParser';

test.describe('Broadcast Operations Director Stress & Format Test Suite', () => {

  test('Format 1: Church Service - Winners Chapel Sunday Celebration Service (10 slots)', async ({ page }) => {
    await page.goto('/?testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    // Click on the pre-seeded Sunday Celebration Service
    const sundayCard = page.locator('text=Sunday Celebration Service').first();
    await expect(sundayCard).toBeVisible({ timeout: 10000 });
    await sundayCard.click();

    // Verify we are in the editor
    await expect(page).toHaveURL(/.*editor/);
    
    // SortableSlot renders desktop & mobile inputs (2 per slot), total 20 for 10 slots
    const slotInputs = page.locator('input[placeholder="Session Title"]');
    await expect(slotInputs).toHaveCount(20);

    // Verify slot names
    await expect(page.locator('input[value="Opening Prayer"]').first()).toBeVisible();
    await expect(page.locator('input[value="Praise & Worship"]').first()).toBeVisible();
    await expect(page.locator('input[value="Bible Reading"]').first()).toBeVisible();
    await expect(page.locator('input[value="Hymn"]').first()).toBeVisible();
    await expect(page.locator('input[value="Announcements & Testimonies"]').first()).toBeVisible();
    await expect(page.locator('input[value="First Timers"]').first()).toBeVisible();
    await expect(page.locator('input[value="Offering"]').first()).toBeVisible();
    await expect(page.locator('input[value="Choir Ministration"]').first()).toBeVisible();
    await expect(page.locator('input[value="Word / Altar Call"]').first()).toBeVisible();
    await expect(page.locator('input[value="Prophetic Blessings & Closing"]').first()).toBeVisible();
  });

  test('Format 2: Church Service - Midweek Communion Service (11 slots)', async ({ page }) => {
    await page.goto('/?testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    const midweekCard = page.locator('text=Midweek Communion Service').first();
    await expect(midweekCard).toBeVisible({ timeout: 10000 });
    await midweekCard.click();

    await expect(page).toHaveURL(/.*editor/);
    // 11 slots * 2 responsive inputs = 22 inputs
    const slotInputs = page.locator('input[placeholder="Session Title"]');
    await expect(slotInputs).toHaveCount(22);

    await expect(page.locator('input[value="Opening Prayer"]').first()).toBeVisible();
    await expect(page.locator('input[value="Praise & Worship"]').first()).toBeVisible();
    await expect(page.locator('input[value="Intercession 1–3"]').first()).toBeVisible();
    await expect(page.locator('input[value="Announcements & Testimony"]').first()).toBeVisible();
    await expect(page.locator('input[value="Intercession 4–6"]').first()).toBeVisible();
    await expect(page.locator('input[value="Personal Supplication"]').first()).toBeVisible();
    await expect(page.locator('input[value="Offering"]').first()).toBeVisible();
    await expect(page.locator('input[value="High Praise"]').first()).toBeVisible();
    await expect(page.locator('input[value="Word / Altar Call"]').first()).toBeVisible();
    await expect(page.locator('input[value="Communion & Blessing"]').first()).toBeVisible();
    await expect(page.locator('input[value="Closing Remarks"]').first()).toBeVisible();
  });

  test('Format 3: Corporate Summit & Multi-Track Templates', async ({ page }) => {
    // Verify Corporate Conference template in canonical library
    const corpTmpl = PRODUCTION_TEMPLATES.find(t => t.id === 'corporate-conference');
    expect(corpTmpl).toBeDefined();
    expect(corpTmpl?.slots.length).toBe(6);
    expect(corpTmpl?.slots[1].title).toBe('Opening Keynote Address');
    expect(corpTmpl?.slots[2].title).toBe('Executive Panel Discussion');
    expect(corpTmpl?.slots[3].title).toBe('Networking Break & Demos');
    expect(corpTmpl?.slots[4].title).toBe('Fireside Chat & Deep-Dive');

    // Verify Product Launch template in library
    const launchTmpl = PRODUCTION_TEMPLATES.find(t => t.id === 'product-book-launch');
    expect(launchTmpl).toBeDefined();
    expect(launchTmpl?.slots[3].title).toBe('Author / Founder Keynote');
    expect(launchTmpl?.slots[4].title).toBe('Official Unveiling Ceremony');
  });

  test('Stress 1: Empty / Draft Event with 0 slots renders graceful standby without crashes', async ({ page }) => {
    await page.addInitScript(() => {
      const emptyProg = {
        id: 'stress-test-empty',
        title: 'Empty Draft Service',
        status: 'draft',
        isTimerActive: false,
        currentSlotIndex: 0,
        secondsElapsed: 0,
        timerStartTimestamp: null,
        slots: []
      };
      localStorage.setItem('kairon_program', JSON.stringify(emptyProg));
      localStorage.setItem('kairon_offline_cache_stress-test-empty', JSON.stringify(emptyProg));
    });

    await page.goto('/?id=stress-test-empty&testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    // Click Zen Mode
    const zenBtn = page.getByRole('button', { name: /Zen/i });
    await expect(zenBtn).toBeVisible({ timeout: 10000 });
    await zenBtn.click();

    // Verify Zen Focus Console appears in Standby mode
    await expect(page.locator('text=CONSOLE STANDBY')).toBeVisible();
    await expect(page.locator('text=OFF-AIR • STANDBY')).toBeVisible();
    await expect(page.locator('text=No Rundown Items Loaded')).toBeVisible();
    
    // Verify no NaN or negative timer values
    const content = await page.content();
    expect(content).not.toContain('NaN');
    expect(content).not.toContain('-00:');

    // Exit Zen
    await page.getByRole('button', { name: /Exit Zen Mode/i }).first().click();
  });

  test('Stress 2: Hold for Cue (Standby Freeze) across Live Timer and Zen Mode', async ({ page }) => {
    const serviceProgram = {
      id: 'stress-test-hold',
      title: 'Sunday Celebration Live',
      status: 'live',
      currentSlotIndex: 1,
      isTimerActive: true,
      secondsElapsed: 120,
      timerStartTimestamp: Date.now() - 120000,
      isOnHold: true,
      holdMessage: 'WAITING FOR CUE',
      slots: [
        { id: 's1', title: 'Opening Prayer', durationMinutes: 5, type: 'Prayer' },
        { id: 's2', title: 'Praise & Worship', durationMinutes: 20, type: 'Worship' },
        { id: 's3', title: 'Word / Altar Call', durationMinutes: 45, type: 'Sermon' }
      ]
    };

    await page.addInitScript((prog) => {
      localStorage.setItem('kairon_program', JSON.stringify(prog));
      localStorage.setItem('kairon_offline_cache_stress-test-hold', JSON.stringify(prog));
      localStorage.setItem('kairon_offline_cache_live', JSON.stringify(prog));
    }, serviceProgram);

    await page.goto('/?id=stress-test-hold&testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    // Enter Zen mode
    const zenBtn = page.getByRole('button', { name: /Zen/i });
    await expect(zenBtn).toBeVisible({ timeout: 10000 });
    await zenBtn.click();

    // In Zen Focus Console, verify Standby Freeze and WAITING FOR CUE
    await expect(page.locator('text=STANDBY FREEZE')).toBeVisible();
    await expect(page.locator('text=WAITING FOR CUE')).toBeVisible();
    await expect(page.locator('text=RELEASE HOLD')).toBeVisible();

    // Exit Zen
    await page.getByRole('button', { name: /Exit Zen Mode/i }).first().click();
  });

  test('Stress 3: Concluded Event & Hold-to-Confirm Modal prevents accidental shutdown', async ({ page }) => {
    const liveProgram = {
      id: 'stress-test-concluded',
      title: 'High Stakes Summit',
      status: 'live',
      currentSlotIndex: 0,
      isTimerActive: false,
      secondsElapsed: 60,
      timerStartTimestamp: null,
      slots: [
        { id: 's1', title: 'Keynote', durationMinutes: 30, type: 'Talk' }
      ]
    };

    await page.addInitScript((prog) => {
      localStorage.setItem('kairon_program', JSON.stringify(prog));
      localStorage.setItem('kairon_offline_cache_stress-test-concluded', JSON.stringify(prog));
      localStorage.setItem('kairon_offline_cache_live', JSON.stringify(prog));
    }, liveProgram);

    await page.goto('/?id=stress-test-concluded&testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    // Enter Zen mode
    const zenBtn = page.getByRole('button', { name: /Zen/i });
    await expect(zenBtn).toBeVisible({ timeout: 10000 });
    await zenBtn.click();

    // Locate the Hold to Confirm END EVENT button in Zen mode
    const endEventBtn = page.locator('button', { hasText: /END EVENT/i }).first();
    await expect(endEventBtn).toBeVisible();

    // A single click should NOT conclude the event (requires 2s continuous hold)
    await endEventBtn.click();
    await page.waitForTimeout(500);

    // Verify still in active console, not concluded
    await expect(page.locator('text=SERVICE COMPLETE')).not.toBeVisible();

    // Exit Zen
    await page.getByRole('button', { name: /Exit Zen Mode/i }).first().click();
  });

  test('Stress 4: MCR Broadcast Cutoff Breach Telemetry in Live Timer view', async ({ page }) => {
    // Deterministically mock current time to 12:00 PM so 08:30 AM cutoff is always in the past regardless of CI time of day
    await page.clock.setFixedTime(new Date('2026-10-26T12:00:00'));

    const breachedProgram = {
      id: 'stress-test-mcr',
      title: 'Live TV Gala Broadcast',
      status: 'live',
      startTime: '08:00',
      endTime: '08:30',
      currentSlotIndex: 0,
      isTimerActive: true,
      secondsElapsed: 10,
      timerStartTimestamp: new Date('2026-10-26T11:59:50').getTime(),
      slots: [
        { id: 's1', title: 'Awards Segment 1', durationMinutes: 30, type: 'Talk' }
      ]
    };

    await page.addInitScript((prog) => {
      localStorage.setItem('kairon_program', JSON.stringify(prog));
      localStorage.setItem('kairon_offline_cache_stress-test-mcr', JSON.stringify(prog));
      localStorage.setItem('kairon_offline_cache_live', JSON.stringify(prog));
    }, breachedProgram);

    await page.goto('/live?id=stress-test-mcr&testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    const mcrPill = page.locator('text=MCR CUTOFF:').first();
    await expect(mcrPill).toBeVisible({ timeout: 10000 });
    await expect(mcrPill).toContainText('BREACHED');
  });

});
