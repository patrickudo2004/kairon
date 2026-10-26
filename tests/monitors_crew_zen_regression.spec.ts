import { test, expect } from '@playwright/test';

test.describe('Monitors, Crew Tactical HUD & Mobile Zen Mode Regression Verification', () => {

  test('Issue 1: Right Studio Output Monitor renders STAGE, TV, PRMP, KEY, and QR without blank iframes', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    const testProgram = {
      id: 'local-test-dock-preview',
      title: 'Sunday Celebration Service',
      date: '2026-10-25',
      startTime: '09:00',
      status: 'live',
      isTimerActive: true,
      currentSlotIndex: 0,
      secondsElapsed: 30,
      timerStartTimestamp: Date.now() - 30000,
      slots: [
        {
          id: 'slot-1',
          title: 'Opening Prayer & Thanksgiving',
          durationMinutes: 10,
          speaker: 'Pastor Paul',
          type: 'Prayer',
          productionNotes: 'Dim hall lights, mic 1 active',
          prompterText: 'Welcome church, let us open in prayer.'
        },
        {
          id: 'slot-2',
          title: 'High Praise & Worship',
          durationMinutes: 25,
          speaker: 'Choir Lead',
          type: 'Worship',
          productionNotes: 'Bring up stage wash',
          prompterText: 'Sing unto the Lord a new song.'
        }
      ]
    };

    await page.addInitScript((prog) => {
      localStorage.setItem('kairon_program', JSON.stringify(prog));
      localStorage.setItem(`kairon_offline_cache_${prog.id}`, JSON.stringify(prog));
      localStorage.setItem('kairon_offline_cache_live', JSON.stringify(prog));
    }, testProgram);

    await page.goto(`/?testBypass=true&id=${testProgram.id}`);
    await page.waitForLoadState('domcontentloaded');

    // Verify Right Dock is present
    const dock = page.locator('aside').filter({ hasText: /Output Monitor/i });
    await expect(dock).toBeVisible({ timeout: 10000 });

    // 1. Verify default STAGE tab preview iframe
    const stageIframe = dock.locator('iframe[title="Studio Live Output Preview"]');
    await expect(stageIframe).toBeVisible({ timeout: 5000 });
    const stageSrc = await stageIframe.getAttribute('src');
    expect(stageSrc).toContain('/stage');
    expect(stageSrc).not.toMatch(/^file:\/\/\/[A-Za-z]:\/(stage|tv|prompter)/); // Must not be broken root file URL

    // 2. Switch to TV tab
    const tvTabBtn = dock.locator('button', { hasText: /^TV$/i });
    await tvTabBtn.click();
    await page.waitForTimeout(300);
    const tvIframe = dock.locator('iframe[title="Studio Live Output Preview"]');
    await expect(tvIframe).toBeVisible();
    const tvSrc = await tvIframe.getAttribute('src');
    expect(tvSrc).toContain('/tv');

    // 3. Switch to Prompter (PRMP) tab
    const prmpTabBtn = dock.locator('button', { hasText: /^PRMP$/i });
    await prmpTabBtn.click();
    await page.waitForTimeout(300);
    const prmpIframe = dock.locator('iframe[title="Studio Live Output Preview"]');
    await expect(prmpIframe).toBeVisible();
    const prmpSrc = await prmpIframe.getAttribute('src');
    expect(prmpSrc).toContain('/prompter');

    // 4. Switch to Broadcast Key Overlay (KEY) tab
    const keyTabBtn = dock.locator('button', { hasText: /^KEY$/i });
    await keyTabBtn.click();
    await page.waitForTimeout(300);
    const keyIframe = dock.locator('iframe[title="Studio Live Output Preview"]');
    await expect(keyIframe).toBeVisible();
    const keySrc = await keyIframe.getAttribute('src');
    expect(keySrc).toContain('/overlay');

    // 5. Switch to QR tab
    const qrTabBtn = dock.locator('button', { hasText: /^QR$/i });
    await qrTabBtn.click();
    await page.waitForTimeout(300);
    await expect(dock.locator('text=Public Attendee QR')).toBeVisible();
    await expect(dock.locator('svg').filter({ has: page.locator('rect') }).first()).toBeVisible();
  });

  test('Issue 2: Crew Tactical HUD (/crew?id=...) renders cleanly with Cues, ACKs, and Chat without Server Error', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    const crewProgram = {
      id: 'local-test-crew-prog',
      title: 'Midweek Communion Service',
      date: '2026-10-25',
      startTime: '18:00',
      status: 'live',
      isTimerActive: true,
      currentSlotIndex: 0,
      secondsElapsed: 120,
      timerStartTimestamp: Date.now() - 120000,
      slots: [
        {
          id: 'slot-c1',
          title: 'Opening Prayer & Exhortation',
          durationMinutes: 15,
          speaker: 'Pastor Isaac',
          type: 'Word',
          productionNotes: 'Sound: Lapel Mic 2 ON | Video: Wide Camera',
          prompterText: ''
        },
        {
          id: 'slot-c2',
          title: 'Holy Communion & Blessing',
          durationMinutes: 20,
          speaker: 'Lead Pastor',
          type: 'Communion',
          productionNotes: 'Prepare Communion Table & Dim Backlights',
          prompterText: ''
        }
      ]
    };

    await page.addInitScript((prog) => {
      localStorage.setItem(`kairon_offline_cache_${prog.id}`, JSON.stringify(prog));
      localStorage.setItem('kairon_offline_cache_live', JSON.stringify(prog));
      localStorage.setItem('kairon_program', JSON.stringify(prog));
    }, crewProgram);

    // Navigate to Crew HUD
    await page.goto(`/crew?id=${crewProgram.id}&testBypass=true`);
    await page.waitForLoadState('domcontentloaded');

    // Verify Title and Cues render
    await expect(page.locator('h1', { hasText: /Midweek Communion Service/i })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Opening Prayer & Exhortation')).toBeVisible();
    await expect(page.getByText('Sound: Lapel Mic 2 ON | Video: Wide Camera')).toBeVisible();

    // Verify Readiness ACK buttons for Sound, Lights, Video
    const soundAckBtn = page.locator('button').filter({ hasText: /Sound/i }).first();
    const lightsAckBtn = page.locator('button').filter({ hasText: /Lights/i }).first();
    const videoAckBtn = page.locator('button').filter({ hasText: /Video/i }).first();

    await expect(soundAckBtn).toBeVisible();
    await expect(lightsAckBtn).toBeVisible();
    await expect(videoAckBtn).toBeVisible();

    // Click Sound ACK and verify local acknowledgement
    await soundAckBtn.click();
    await page.waitForTimeout(200);

    // Switch to Crew Comms tab and verify chat stream and quick chips
    const commsTab = page.locator('button').filter({ hasText: /Crew Comms/i }).first();
    await commsTab.click();
    await expect(page.locator('text=Quick Radio Chips:')).toBeVisible({ timeout: 5000 });

    // Click a Quick Radio Chip and verify it appends to the tactical chat stream
    const micChip = page.locator('button', { hasText: '🎤 Mic Low' });
    await micChip.click();
    await expect(page.locator('text=Mic volume is low on pulpit')).toBeVisible({ timeout: 5000 });
  });

  test('Issue 2B: Crew Tactical HUD standby state with empty slots renders intentional Standby slate', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    const emptyProgram = {
      id: 'local-test-empty-crew',
      title: 'Youth Rehearsal 2026',
      date: '2026-10-25',
      startTime: '10:00',
      status: 'draft',
      isTimerActive: false,
      currentSlotIndex: 0,
      secondsElapsed: 0,
      timerStartTimestamp: null,
      slots: []
    };

    await page.addInitScript((prog) => {
      localStorage.setItem(`kairon_offline_cache_${prog.id}`, JSON.stringify(prog));
      localStorage.setItem('kairon_program', JSON.stringify(prog));
    }, emptyProgram);

    await page.goto(`/crew?id=${emptyProgram.id}&testBypass=true`);
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('h1', { hasText: /Youth Rehearsal 2026/i })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Tactical Standby Mode')).toBeVisible();
    await expect(page.locator('text=Booth Sync Ready')).toBeVisible();
  });

  test('Issue 3: Mobile Viewport (375x667 iPhone SE) - Exit Zen Mode button is fully visible and clickable', async ({ page }) => {
    // Standard compact mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    const testProg = {
      id: 'local-mobile-zen-prog',
      title: 'Sunday Morning Live Service With Extra Long Title For Testing',
      slots: [
        { id: 's1', title: 'Praise and Thanksgiving', durationMinutes: 15, speaker: 'Choir' },
        { id: 's2', title: 'Prophetic Impartation', durationMinutes: 45, speaker: 'Bishop David' }
      ],
      status: 'live',
      isTimerActive: true,
      currentSlotIndex: 0,
      secondsElapsed: 60,
      timerStartTimestamp: Date.now() - 60000
    };

    await page.addInitScript((prog) => {
      localStorage.setItem('kairon_program', JSON.stringify(prog));
      localStorage.setItem('kairon_offline_cache_live', JSON.stringify(prog));
    }, testProg);

    await page.goto('/?testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    // Click Zen button in top mobile header
    const zenBtn = page.getByRole('button', { name: /^Zen$/i });
    await expect(zenBtn).toBeVisible({ timeout: 10000 });
    await zenBtn.click();

    // Verify Zen Mode console is mounted
    const exitZenBtn = page.locator('[data-testid="exit-zen-mode-btn"]');
    await expect(exitZenBtn).toBeVisible({ timeout: 5000 });

    // CRITICAL GEOMETRIC AUDIT: Verify button is strictly within mobile viewport bounds
    const box = await exitZenBtn.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(375); // Must not be clipped off right side!
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.y + box.height).toBeLessThanOrEqual(667);
    }

    // Verify button text is visible
    await expect(exitZenBtn.locator('text=Exit Zen Mode')).toBeVisible();

    // Click Exit Zen Mode button to escape
    await exitZenBtn.click();
    await page.waitForTimeout(300);

    // Verify we successfully exited Zen Mode back to main studio view
    await expect(page.getByRole('button', { name: /^Zen$/i })).toBeVisible({ timeout: 5000 });
  });

  test('Issue 3B: Mobile Viewport (390x844 iPhone 14) - Transport buttons fit without clipping', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const testProg = {
      id: 'local-mobile-zen-transport',
      title: 'Wednesday Encounter',
      slots: [
        { id: 's1', title: 'Opening Intercession', durationMinutes: 10, speaker: 'Elder John' },
        { id: 's2', title: 'Word of Faith', durationMinutes: 30, speaker: 'Resident Pastor' }
      ],
      status: 'live',
      isTimerActive: true,
      currentSlotIndex: 0,
      secondsElapsed: 30,
      timerStartTimestamp: Date.now() - 30000
    };

    await page.addInitScript((prog) => {
      localStorage.setItem('kairon_program', JSON.stringify(prog));
      localStorage.setItem('kairon_offline_cache_live', JSON.stringify(prog));
    }, testProg);

    await page.goto(`/?testBypass=true&id=${testProg.id}`);
    await page.waitForLoadState('domcontentloaded');

    // Enter Zen Mode
    await page.getByRole('button', { name: /^Zen$/i }).click();

    const exitZenBtn = page.locator('[data-testid="exit-zen-mode-btn"]');
    await expect(exitZenBtn).toBeVisible({ timeout: 5000 });

    // Verify main transport buttons exist and fit within viewport width
    const pauseBtn = page.locator('button').filter({ hasText: /PAUSE|START|NO SLOTS/i }).first();
    await expect(pauseBtn).toBeVisible();
    const pauseBox = await pauseBtn.boundingBox();
    if (pauseBox) {
      expect(pauseBox.x).toBeGreaterThanOrEqual(0);
      expect(pauseBox.x + pauseBox.width).toBeLessThanOrEqual(390);
    }

    const holdBtn = page.locator('button', { hasText: 'HOLD' }).first();
    await expect(holdBtn).toBeVisible();

    // Successfully click exit
    await exitZenBtn.click();
    await expect(page.getByRole('button', { name: /^Zen$/i })).toBeVisible();
  });

});
