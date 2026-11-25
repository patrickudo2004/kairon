import { test, expect } from '@playwright/test';

const buildLiveProgram = (id: string, slug: string, title = 'End-Event Display Sync Summit') => ({
  id,
  slug,
  title,
  subtitle: 'Main Hall — Live Sync Test',
  date: '2026-11-25',
  startTime: '09:00',
  endTime: '11:00',
  organizationId: 'local-workspace',
  isPublic: true,
  status: 'live' as const,
  isManualMode: false,
  isOnHold: false,
  currentSlotIndex: 0,
  isTimerActive: true,
  timerStartTimestamp: Date.now() - 30_000, // 04:30 remaining on a 5m slot
  secondsElapsed: 30,
  slots: [
    { id: 'slot-1', title: 'Opening Prayer', speaker: 'Host Alpha', durationMinutes: 5, type: 'Prayer', productionNotes: 'Mic 1 live' },
    { id: 'slot-2', title: 'Keynote Session', speaker: 'Speaker Beta', durationMinutes: 20, type: 'Keynote', productionNotes: 'HDMI + Slides' },
    { id: 'slot-3', title: 'Closing Blessing', speaker: 'Host Gamma', durationMinutes: 5, type: 'Closing' },
  ],
});

test.describe('End Event -> Monitors & Displays Complete Synchronization Suite', () => {
  test('1. Holding 1.2s End Event concludes Live Control, Top Bar, Right Output Dock, ALL 6 Monitors & Displays iframes, and never corrupts localStorage with phantom New Event', async ({ page }) => {
    const prog = buildLiveProgram('local-end-sync-all', 'end-sync-all');
    await page.addInitScript((p) => {
      if (localStorage.getItem('__kairon_e2e_seeded_t1')) return;
      localStorage.setItem('__kairon_e2e_seeded_t1', '1');
      localStorage.setItem('theme', 'dark');
      localStorage.setItem('kairon_booth_mode', 'true');
      localStorage.setItem('test_programs', JSON.stringify([p]));
      localStorage.setItem('kairon_offline_programs', JSON.stringify([p]));
      localStorage.setItem('kairon_program', JSON.stringify(p));
      localStorage.setItem('kairon_offline_cache_live', JSON.stringify(p));
      localStorage.setItem(`kairon_offline_cache_${p.id}`, JSON.stringify(p));
    }, prog);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/live?id=${prog.id}&testBypass=true`);
    await page.waitForLoadState('domcontentloaded');

    // Confirm active countdown on Live Control
    const endBtn = page.locator('main').getByRole('button', { name: /END EVENT/i }).first();
    await expect(endBtn).toBeVisible({ timeout: 10000 });

    // Hold END EVENT for 1.4s
    const box = await endBtn.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(1400);
    await page.mouse.up();

    // Live Control & Top Bar conclude cleanly
    await expect(page.getByText('Session Concluded')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('header').getByText('CONCLUDED')).toBeVisible();

    // Right Output Monitor Dock iframe (STAGE) must immediately show SESSION CONCLUDED
    const dockFrame = page.frameLocator('iframe[title="Studio Live Output Preview"]');
    await expect(dockFrame.getByText(/SESSION CONCLUDED/i)).toBeVisible({ timeout: 5000 });

    // Navigate to Monitors & Displays (/monitors)
    await page.getByRole('link', { name: /Monitors & Displays/i }).click();
    await expect(page.getByRole('heading', { name: /Monitors & Live Cues/i })).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1200);

    // Verify ALL 6 monitor thumbnails show concluded states with zero active countdowns
    await expect(page.frameLocator('iframe[title="Stage & Pulpit Display"]').getByText(/SESSION CONCLUDED/i)).toBeVisible({ timeout: 8000 });
    await expect(page.frameLocator('iframe[title="TV / Overflow Screen"]').getByText(/Session Concluded/i).first()).toBeVisible({ timeout: 8000 });
    await expect(page.frameLocator('iframe[title="Integrated Teleprompter"]').getByText(/SESSION CONCLUDED|STAND BY/i).first()).toBeVisible({ timeout: 8000 });
    await expect(page.frameLocator('iframe[title="Crew Tactical HUD"]').getByText(/Session Concluded/i).first()).toBeVisible({ timeout: 8000 });
    await expect(page.frameLocator('iframe[title="Public Portal"]').getByText(/EVENT CONCLUDED|Session Concluded/i).first()).toBeVisible({ timeout: 8000 });
    await expect(page.frameLocator('iframe[title="OBS / vMix / ATEM Overlay"]').getByText(/SESSION CONCLUDED/i)).toBeVisible({ timeout: 8000 });

    // Confirm Public Portal iframe (/p/:slug) did NOT boot <AppContent /> or corrupt localStorage to phantom "New Event"
    const cacheCheck = await page.evaluate(() => {
      const liveRaw = localStorage.getItem('kairon_offline_cache_live');
      const progRaw = localStorage.getItem('kairon_program');
      return {
        live: liveRaw ? JSON.parse(liveRaw) : null,
        prog: progRaw ? JSON.parse(progRaw) : null,
      };
    });
    expect(cacheCheck.live?.title).toBe(prog.title);
    expect(cacheCheck.live?.status).toBe('concluded');
    expect(cacheCheck.live?.isTimerActive).toBe(false);
    expect(cacheCheck.prog?.title).toBe(prog.title);
    expect(cacheCheck.prog?.status).toBe('concluded');
  });

  test('2. Already-open standalone tabs (/stage, /tv, /prompter, /crew, /overlay, and global /stage without ?id=) all stop & conclude immediately on End Event', async ({ context }) => {
    const prog = buildLiveProgram('local-open-tabs-sync', 'open-tabs-sync');
    await context.addInitScript((p) => {
      localStorage.setItem('theme', 'dark');
      localStorage.setItem('kairon_booth_mode', 'true');
      localStorage.setItem('test_programs', JSON.stringify([p]));
      localStorage.setItem('kairon_offline_programs', JSON.stringify([p]));
      localStorage.setItem('kairon_program', JSON.stringify(p));
      localStorage.setItem('kairon_offline_cache_live', JSON.stringify(p));
      localStorage.setItem(`kairon_offline_cache_${p.id}`, JSON.stringify(p));
    }, prog);

    const livePage = await context.newPage();
    const stagePage = await context.newPage();
    const globalStagePage = await context.newPage();
    const tvPage = await context.newPage();
    const prompterPage = await context.newPage();
    const crewPage = await context.newPage();
    const overlayPage = await context.newPage();

    await livePage.setViewportSize({ width: 1440, height: 900 });
    await Promise.all([
      livePage.goto(`/live?id=${prog.id}&testBypass=true`),
      stagePage.goto(`/stage?id=${prog.id}&testBypass=true`),
      globalStagePage.goto(`/stage?testBypass=true`),
      tvPage.goto(`/tv?id=${prog.id}&testBypass=true`),
      prompterPage.goto(`/prompter?id=${prog.id}&testBypass=true`),
      crewPage.goto(`/crew?id=${prog.id}&testBypass=true`),
      overlayPage.goto(`/overlay?id=${prog.id}&bg=black&testBypass=true`),
    ]);

    // Verify displays start actively live
    await expect(stagePage.getByText(/ON AIR/i)).toBeVisible({ timeout: 10000 });
    await expect(globalStagePage.getByText(/ON AIR/i)).toBeVisible({ timeout: 10000 });
    await expect(tvPage.getByText(/LIVE NOW/i)).toBeVisible({ timeout: 10000 });
    await expect(crewPage.getByText(/ON AIR/i)).toBeVisible({ timeout: 10000 });
    await expect(overlayPage.getByText(/REMAINING/i)).toBeVisible({ timeout: 10000 });

    // Hold 1.2s End Event in Live Control
    const endBtn = livePage.locator('main').getByRole('button', { name: /END EVENT/i }).first();
    await expect(endBtn).toBeVisible();
    const box = await endBtn.boundingBox();
    await livePage.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await livePage.mouse.down();
    await livePage.waitForTimeout(1400);
    await livePage.mouse.up();

    // Every single already-open display tab (including global /stage without ?id=) must transition to concluded
    await expect(livePage.getByText('Session Concluded')).toBeVisible({ timeout: 5000 });
    await expect(stagePage.getByText(/SESSION CONCLUDED/i)).toBeVisible({ timeout: 5000 });
    await expect(globalStagePage.getByText(/SESSION CONCLUDED/i)).toBeVisible({ timeout: 5000 });
    await expect(tvPage.getByText(/Session Concluded/i).first()).toBeVisible({ timeout: 5000 });
    await expect(prompterPage.getByText(/SESSION CONCLUDED|STAND BY/i).first()).toBeVisible({ timeout: 5000 });
    await expect(crewPage.getByText(/Session Concluded/i).first()).toBeVisible({ timeout: 5000 });
    await expect(overlayPage.getByText(/SESSION CONCLUDED/i)).toBeVisible({ timeout: 5000 });

    // Wait 2.2s and confirm NONE reverted back to ON AIR / LIVE NOW
    await livePage.waitForTimeout(2200);
    await expect(stagePage.getByText(/ON AIR/i)).toHaveCount(0);
    await expect(globalStagePage.getByText(/ON AIR/i)).toHaveCount(0);
    await expect(tvPage.getByText(/LIVE NOW/i)).toHaveCount(0);
    await expect(crewPage.getByText(/ON AIR/i)).toHaveCount(0);
  });

  test('3. Cloud-lag resilience: lagging live Convex snapshot NEVER defeats local BroadcastChannel or postMessage End Event across /stage, /tv, /crew, and /overlay', async ({ context }) => {
    // Non-local Convex-style ID; test_programs (mock Convex backend) remains STUCK at status='live', isTimerActive=true!
    const cloudId = 'jh74x8k2m9p3q1r5s6t7u8v9w0';
    const liveCloudProg = buildLiveProgram(cloudId, 'cloud-lag-test', 'Cloud Lag Resilience Service');

    await context.addInitScript((p) => {
      // Simulates cloud mode (NO kairon_booth_mode) where Convex mock still returns status='live'
      sessionStorage.setItem('testBypass', 'true');
      localStorage.setItem('test_programs', JSON.stringify([p]));
      localStorage.setItem('kairon_offline_programs', JSON.stringify([p]));
      localStorage.setItem(`kairon_offline_cache_${p.id}`, JSON.stringify(p));
      localStorage.setItem('kairon_offline_cache_live', JSON.stringify(p));
    }, liveCloudProg);

    const stagePage = await context.newPage();
    const tvPage = await context.newPage();
    const crewPage = await context.newPage();
    const overlayPage = await context.newPage();

    await Promise.all([
      stagePage.goto(`/stage?id=${cloudId}`),
      tvPage.goto(`/tv?id=${cloudId}`),
      crewPage.goto(`/crew?id=${cloudId}`),
      overlayPage.goto(`/overlay?id=${cloudId}&bg=black`),
    ]);

    await expect(stagePage.getByText(/ON AIR/i)).toBeVisible({ timeout: 10000 });
    await expect(tvPage.getByText(/LIVE NOW/i)).toBeVisible({ timeout: 10000 });
    await expect(crewPage.getByText(/ON AIR/i)).toBeVisible({ timeout: 10000 });
    await expect(overlayPage.getByText(/REMAINING/i)).toBeVisible({ timeout: 10000 });

    // Deliver concluded broadcast (while Convex mock in test_programs STILL says status='live', isTimerActive=true!)
    const concludedPayload = {
      id: cloudId,
      program: {
        ...liveCloudProg,
        status: 'concluded',
        isTimerActive: false,
        timerStartTimestamp: null,
        secondsElapsed: 0,
        isOnHold: false,
      },
      status: 'concluded',
      isTimerActive: false,
      timerStartTimestamp: null,
      secondsElapsed: 0,
      isOnHold: false,
      syncTimestamp: Date.now(),
    };

    // Test BroadcastChannel on Stage/TV/Crew and direct postMessage on Overlay (proving both channels defeat lagging Convex)
    await stagePage.evaluate((payload) => {
      const ch = new BroadcastChannel('kairon_offline_sync');
      ch.postMessage(payload);
      ch.close();
      window.postMessage({ type: 'KAIRON_TIMER_SYNC', payload }, '*');
    }, concludedPayload);
    await overlayPage.evaluate((payload) => {
      window.postMessage({ type: 'KAIRON_TIMER_SYNC', payload }, '*');
    }, concludedPayload);

    await expect(stagePage.getByText(/SESSION CONCLUDED/i)).toBeVisible({ timeout: 5000 });
    await expect(tvPage.getByText(/Session Concluded/i).first()).toBeVisible({ timeout: 5000 });
    await expect(crewPage.getByText(/Session Concluded/i).first()).toBeVisible({ timeout: 5000 });
    await expect(overlayPage.getByText(/SESSION CONCLUDED/i)).toBeVisible({ timeout: 5000 });

    // Confirm NONE resurrect to countdown after 2.2s even though mock Convex still holds status='live'
    await stagePage.waitForTimeout(2200);
    await expect(stagePage.getByText(/SESSION CONCLUDED/i)).toBeVisible();
    await expect(tvPage.getByText(/Session Concluded/i).first()).toBeVisible();
    await expect(crewPage.getByText(/Session Concluded/i).first()).toBeVisible();
    await expect(overlayPage.getByText(/SESSION CONCLUDED/i)).toBeVisible();
  });

  test('4. Real Guest Booth Mode (kairon_offline_programs ONLY, no test_programs) preserves programs and resets secondsElapsed on End Event', async ({ page }) => {
    const prog = buildLiveProgram('local-guest-booth-only', 'guest-booth-only', 'Guest Booth Real Service');
    await page.addInitScript((p) => {
      localStorage.setItem('theme', 'dark');
      localStorage.setItem('kairon_booth_mode', 'true');
      localStorage.removeItem('test_programs');
      localStorage.setItem('kairon_offline_programs', JSON.stringify([p]));
      localStorage.setItem('kairon_program', JSON.stringify(p));
      localStorage.setItem('kairon_offline_cache_live', JSON.stringify(p));
      localStorage.setItem(`kairon_offline_cache_${p.id}`, JSON.stringify(p));
    }, prog);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/live?id=${prog.id}`);
    await page.waitForLoadState('domcontentloaded');

    const endBtn = page.locator('main').getByRole('button', { name: /END EVENT/i }).first();
    await expect(endBtn).toBeVisible({ timeout: 10000 });
    const box = await endBtn.boundingBox();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(1400);
    await page.mouse.up();

    await expect(page.getByText('Session Concluded')).toBeVisible({ timeout: 5000 });

    const stored = await page.evaluate(() => {
      const raw = localStorage.getItem('kairon_offline_programs');
      return raw ? JSON.parse(raw) : [];
    });
    expect(Array.isArray(stored)).toBe(true);
    expect(stored.length).toBeGreaterThanOrEqual(1);
    const ended = stored.find((p: any) => p.id === prog.id);
    expect(ended).toBeTruthy();
    expect(ended.status).toBe('concluded');
    expect(ended.isTimerActive).toBe(false);
    expect(ended.secondsElapsed).toBe(0);
    expect(ended.timerStartTimestamp).toBeNull();
  });
});
