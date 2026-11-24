import { test, expect } from '@playwright/test';
import { seedTestWorkspace, TEST_SUNDAY_PROGRAM } from './testFixtures';

test.describe('Public Website, Legal/GDPR Shield, Incognito Isolation & WCAG 2.1 AA Regression Suite', () => {
  test('Unauthenticated Web / renders Dark Glassmorphism Landing Page with zero Incognito leaks or hotkey bypasses', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Hero & Open Beta Founding Partner messaging
    await expect(page).toHaveTitle(/Kairon Studio/i);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Free Open Beta/i).first()).toBeVisible();

    // ZERO Incognito Studio Top-Bar Leaks
    await expect(page.getByRole('button', { name: /^Zen$/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Report$/i })).toHaveCount(0);
    await expect(page.locator('button[title*="Flight Bridge"]')).toHaveCount(0);

    // Pressing studio hotkeys ('z' or Ctrl+K) while logged out MUST NOT open Zen Console or Command Palette
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    await page.keyboard.press('z');
    await page.waitForTimeout(250);
    await expect(page.getByRole('button', { name: /Exit Zen Mode/i })).toHaveCount(0);

    await page.keyboard.press('Control+k');
    await page.waitForTimeout(250);
    await expect(page.locator('input[placeholder*="Search commands"]')).toHaveCount(0);

    // ZERO hardcoded Winners Chapel references anywhere on public homepage
    const text = await page.locator('body').innerText();
    expect(text).not.toMatch(/winners chapel/i);

    // Embedded 1080p showcase video + WebVTT captions + accessible collapsible transcript
    const video = page.locator('video').first();
    await expect(video).toBeVisible();
    const track = video.locator('track[kind="captions"]');
    await expect(track).toHaveAttribute('src', /kairon-showcase-draft\.vtt/);

    const transcriptBtn = page.getByRole('button', { name: /Transcript/i }).first();
    await expect(transcriptBtn).toBeVisible();
    await transcriptBtn.click();
    await expect(page.getByText(/00:00 [–—-] 00:10/i).first()).toBeVisible();

    // Interactive 4-Format Universal Event Simulator switches cleanly
    const weddingsTab = page.getByRole('tab', { name: /Weddings & Galas/i }).or(page.getByRole('button', { name: /Weddings & Galas/i })).first();
    await weddingsTab.click();
    await expect(page.getByText(/Bridal Party|Reception|Ballroom/i).first()).toBeVisible();

    // Legal Footer links present with confirmed contact email
    await expect(page.getByRole('link', { name: /Privacy Policy/i }).first()).toHaveAttribute('href', '/privacy');
    await expect(page.getByRole('link', { name: /Terms of Service/i }).first()).toHaveAttribute('href', '/terms');
    await expect(page.getByRole('link', { name: /Cookie.*Notice/i }).first()).toHaveAttribute('href', '/cookies');
    await expect(page.getByRole('link', { name: /Accessibility/i }).first()).toHaveAttribute('href', '/accessibility');

    expect(errors).toHaveLength(0);
  });

  test('Public Guide (/guide) and Legal Suite (/privacy, /terms, /cookies, /accessibility, /login) load cleanly across Desktop, Tablet & Mobile with zero raw Markdown or overflow', async ({ page }) => {
    const viewports = [
      { name: 'Desktop', width: 1440, height: 900 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 812 },
    ];
    const routes = [
      { path: '/', expectedText: /Precision Stage Timing|Kairon Studio/i },
      { path: '/guide', expectedText: /User Guide|Quick-Start/i },
      { path: '/privacy', expectedText: /Privacy Policy/i },
      { path: '/terms', expectedText: /Terms of Service/i },
      { path: '/cookies', expectedText: /Cookie/i },
      { path: '/accessibility', expectedText: /Accessibility Statement/i },
      { path: '/login', expectedText: /Sign In|Create|Offline/i },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      for (const route of routes) {
        const pageErrors: string[] = [];
        const onPageError = (err: Error) => pageErrors.push(err.message);
        page.on('pageerror', onPageError);

        await page.goto(route.path);
        await page.waitForLoadState('domcontentloaded');
        await expect(page.locator('body')).toContainText(route.expectedText, { timeout: 10000 });

        // Verify ZERO hardcoded Winners Chapel strings
        const bodyText = await page.locator('body').innerText();
        expect(bodyText, `${vp.name} ${route.path} leaked hardcoded church data`).not.toMatch(/winners chapel/i);

        // Verify ZERO unrendered raw Markdown syntax in User Guide prose (excluding inline <code> syntax examples)
        if (route.path === '/guide') {
          const proseWithoutCode = await page.evaluate(() => {
            const clone = document.body.cloneNode(true) as HTMLElement;
            clone.querySelectorAll('code, pre').forEach((el) => el.remove());
            return clone.innerText || clone.textContent || '';
          });
          expect(proseWithoutCode).not.toContain('**');
        }

        // Verify ZERO severe horizontal overflow (> 6px tolerance for scrollbars)
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, `${vp.name} ${route.path} overflowed horizontally by ${overflow}px`).toBeLessThanOrEqual(6);

        expect(pageErrors, `${vp.name} ${route.path} threw page errors`).toHaveLength(0);
        page.off('pageerror', onPageError);
      }
    }
  });

  test('Invite link (?inviteId=...) on / routes directly to Auth instead of Landing Page, and Electron / routes to DesktopAuthWaiting', async ({ page }) => {
    // 1. Web invite link
    await page.goto('/?inviteId=test-invite-123&orgId=local-workspace');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByPlaceholder(/you@example\.com|name@organization\.com|email/i).first()).toBeVisible({ timeout: 10000 });

    // 2. Simulated Electron runtime on /
    await page.addInitScript(() => {
      (window as any).electron = { isElectron: true, platform: 'win32' };
    });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('button', { name: /Browser Sign-In/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /Continue Offline as Guest/i })).toBeVisible();
  });

  test('WCAG 2.1 AA: Skip-to-content link, Modal dialog ARIA & Escape dismiss, Crew HUD accessible buttons, and Safe Stage Emergency Alert (< 1 Hz & Reduced Motion)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // 1. Skip-to-content link is hidden until focused, and snaps onscreen when focused
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const skipLink = page.locator('a.skip-to-content').first();
    await expect(skipLink).toBeAttached();
    const hiddenOpacity = await skipLink.evaluate((el) => getComputedStyle(el).opacity);
    expect(parseFloat(hiddenOpacity)).toBe(0);
    await skipLink.focus();
    await expect.poll(async () => parseFloat(await skipLink.evaluate((el) => getComputedStyle(el).opacity))).toBeGreaterThan(0.9);

    // 2. Modal dialog ARIA role="dialog", aria-modal="true", Escape dismissal
    await page.goto('/?testBypass=true');
    await page.waitForLoadState('domcontentloaded');
    await page.locator('body').click();
    await page.keyboard.press('?');
    const dialog = page.locator('[role="dialog"][aria-modal="true"]').first();
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();

    // 3. Crew HUD Standby has zero unnamed buttons
    await page.addInitScript(() => {
      const emptyProg = {
        id: 'a11y-crew-standby',
        title: 'Standby Summit',
        status: 'draft',
        isTimerActive: false,
        currentSlotIndex: 0,
        secondsElapsed: 0,
        timerStartTimestamp: null,
        slots: [],
      };
      localStorage.setItem('kairon_offline_cache_a11y-crew-standby', JSON.stringify(emptyProg));
      localStorage.setItem('kairon_program', JSON.stringify(emptyProg));
    });
    await page.goto('/crew?id=a11y-crew-standby&testBypass=true');
    await page.waitForLoadState('domcontentloaded');
    const unnamedButtons = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns
        .filter((b) => {
          const text = (b.textContent || '').trim();
          const aria = (b.getAttribute('aria-label') || '').trim();
          const title = (b.getAttribute('title') || '').trim();
          return !text && !aria && !title;
        })
        .map((b) => b.outerHTML.slice(0, 120));
    });
    expect(unnamedButtons, 'Found unnamed icon-only buttons in Crew HUD').toHaveLength(0);

    // 4. StageDisplay Emergency Alert obeys WCAG 2.3.1 (< 1 Hz pulse, NOT 5 Hz red strobe) & disables under prefers-reduced-motion
    await seedTestWorkspace(page);
    await page.addInitScript((prog) => {
      const liveProg = { ...prog, status: 'live', isTimerActive: true, timerStartTimestamp: Date.now() - 5000, secondsElapsed: 5 };
      localStorage.setItem('kairon_program', JSON.stringify(liveProg));
      localStorage.setItem(`kairon_offline_cache_${prog.id}`, JSON.stringify(liveProg));
      localStorage.setItem('kairon_offline_cache_live', JSON.stringify(liveProg));
      localStorage.setItem(
        `prompt_${prog.id}`,
        JSON.stringify({
          text: 'URGENT STAGE ALERT',
          type: 'urgent',
          isStrobe: true,
          timestamp: Date.now(),
          expiresAt: Date.now() + 120000,
        })
      );
    }, TEST_SUNDAY_PROGRAM);

    await page.goto(`/stage?id=${TEST_SUNDAY_PROGRAM.id}&testBypass=true`);
    await page.waitForLoadState('domcontentloaded');
    const emergencyEl = page.locator('[data-testid="stage-emergency-alert"]');
    await expect(emergencyEl).toBeVisible({ timeout: 10000 });
    await expect(emergencyEl).toHaveAttribute('role', 'alert');

    // Verify safe pulse duration >= 1.0s (frequency <= 1 Hz, strictly below WCAG 3 Hz flash threshold)
    const normalAnimDuration = await emergencyEl.evaluate((el) => parseFloat(getComputedStyle(el).animationDuration) || 0);
    expect(normalAnimDuration).toBeGreaterThanOrEqual(1.0);

    // Verify prefers-reduced-motion removes flashing/pulsing completely
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(100);
    const reducedAnimDuration = await emergencyEl.evaluate((el) => parseFloat(getComputedStyle(el).animationDuration) || 0);
    expect(reducedAnimDuration).toBeLessThanOrEqual(0.05);
  });

  test('Operator Fixes: Dashboard "Manage Live" does NOT pause active timer, and handleToggleTimer never jumps to /editor', async ({ page }) => {
    const liveProg = {
      ...TEST_SUNDAY_PROGRAM,
      id: 'local-live-guard-test',
      status: 'live',
      isTimerActive: true,
      currentSlotIndex: 0,
      secondsElapsed: 15,
      timerStartTimestamp: Date.now() - 15000,
    };
    await seedTestWorkspace(page, [liveProg]);
    await page.addInitScript((prog) => {
      localStorage.setItem('kairon_offline_cache_live', JSON.stringify(prog));
    }, liveProg);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    // Click "Manage Live" on Dashboard card
    const manageLiveBtn = page.getByRole('button', { name: /Manage Live/i }).first();
    await expect(manageLiveBtn).toBeVisible({ timeout: 10000 });
    await manageLiveBtn.click();

    // Must navigate to /live AND remain active (NOT paused!)
    await expect(page).toHaveURL(/\/live/);
    await page.waitForTimeout(300);
    const storedAfterManage = await page.evaluate(() => {
      const raw = localStorage.getItem('kairon_offline_cache_local-live-guard-test') || localStorage.getItem('kairon_program');
      return raw ? JSON.parse(raw) : null;
    });
    expect(storedAfterManage?.isTimerActive).toBe(true);

    // Toggle timer from /monitors — must STAY on /monitors, NEVER jump to /editor
    await page.goto(`/monitors?id=${liveProg.id}&testBypass=true`);
    await page.waitForLoadState('domcontentloaded');
    const topTransportBtn = page.locator('header button[title*="Pause"], header button[title*="Play"], header button[title*="Start"]').first();
    if (await topTransportBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await topTransportBtn.click();
      await page.waitForTimeout(300);
      await expect(page).toHaveURL(/\/monitors/);
      expect(page.url()).not.toContain('/editor');
    }
  });

  test('UK GDPR & Open Beta AdminPanel: Free JSON Data Export & Self-Service Account Deletion present with zero simulated Stripe paywalls', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/admin?testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    // Verify Open Beta Founding Partner badge & zero broken Stripe checkout buttons
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/Upgrade to Pro — \$/i);
    expect(bodyText).not.toMatch(/winners chapel/i);

    // Check Account / Privacy GDPR controls inside AdminPanel
    const accountTab = page.getByRole('button', { name: /My Profile & Account/i }).first();
    await expect(accountTab).toBeVisible({ timeout: 10000 });
    await accountTab.click();
    await expect(page.getByRole('button', { name: /Download My Data|Export.*JSON/i }).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Delete My Account|Delete Account/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('Non-HTTPS LAN Mobile/Tablet Compatibility: loads / and creates programs cleanly when crypto.randomUUID is unavailable', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      try {
        Object.defineProperty(window.crypto, 'randomUUID', {
          value: undefined,
          configurable: true,
          writable: true,
        });
      } catch {}
    });

    // 1. Public Landing Page must render cleanly without ErrorBoundary
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Something interrupted Kairon Studio/i)).toHaveCount(0);

    // 2. Booth Mode Create New + Add Session Slot must also work cleanly without crypto.randomUUID
    await page.goto('/?testBypass=true');
    await page.waitForLoadState('domcontentloaded');
    await page.getByRole('button', { name: 'Create New' }).click();
    await expect(page).toHaveURL(/\/editor/);
    await page.getByText('Add Session Slot').click();
    await expect(page.locator('input[placeholder="Session Title"]:visible').first()).toBeVisible();

    expect(errors).toHaveLength(0);
  });
});
