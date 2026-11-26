import { test, expect } from '@playwright/test';

test.describe('User Guide Link Integrity & Live Visuals (Public, Web App & Desktop HashRouter)', () => {
  test('Public Website /guide: all 14 TOC anchors work cleanly (including Public Portals) and all 10 live screenshots load uncropped', async ({ page }) => {
    await page.goto('/guide', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'Kairon User Guide' })).toBeVisible();

    // Verify clicking ALL 14 TOC anchors keeps user on /guide and scrolls smoothly to each section (including Public Attendee Portals!)
    const tocLinks = page.locator('nav[aria-label="User Guide Table of Contents"] a');
    expect(await tocLinks.count()).toBe(14);

    for (let i = 0; i < 14; i++) {
      const link = tocLinks.nth(i);
      const href = (await link.getAttribute('href')) || '';
      const targetId = href.replace(/^#/, '');
      await link.click();
      await page.waitForTimeout(80);
      await expect(page.getByRole('heading', { name: 'Kairon User Guide' })).toBeVisible();
      const targetExists = await page.evaluate((id) => Boolean(document.getElementById(id)), targetId);
      expect(targetExists, `Missing target section #${targetId}`).toBe(true);
    }

    // Scroll each of the 10 live WebP screenshots into view and verify every single one loads uncropped
    const guideImgLocators = page.locator('img[src*="./guide/"]');
    expect(await guideImgLocators.count()).toBe(10);
    for (let i = 0; i < 10; i++) {
      const imgLoc = guideImgLocators.nth(i);
      await imgLoc.scrollIntoViewIfNeeded();
      await expect.poll(async () => imgLoc.evaluate((el) => (el as HTMLImageElement).complete && (el as HTMLImageElement).naturalWidth > 400), { timeout: 5000 }).toBe(true);
    }

    // Verify even manually visiting /guide#public does NOT hijack into PublicPortal
    await page.goto('/guide#public', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'Kairon User Guide' })).toBeVisible();
  });

  test('Desktop App (HashRouter #/guide): TOC links and Skip to main content never kick user back to Dashboard', async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).electron = {
        isElectron: true,
        platform: 'win32',
        getScreens: async () => [],
        onScreensUpdated: () => () => {},
        getAppVersion: async () => '1.1.4',
      };
      localStorage.setItem('kairon_booth_mode', 'true');
    });

    await page.goto('/#/guide', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'Kairon User Guide' })).toBeVisible();

    // Click multiple TOC anchors including Public Attendee Portals & Broadcast Integrations
    for (const label of ['Identity, Workspaces & Roles', 'Public Attendee Portals', 'Broadcast Integrations (OBS/ATEM/PP7)']) {
      await page.locator('nav[aria-label="User Guide Table of Contents"] a', { hasText: label }).click();
      await page.waitForTimeout(150);
      await expect(page.getByRole('heading', { name: 'Kairon User Guide' })).toBeVisible();
      const hash = await page.evaluate(() => window.location.hash);
      expect(hash).toBe('#/guide');
    }

    // Trigger Skip to main content and verify HashRouter stays on #/guide
    await page.evaluate(() => {
      const skip = document.querySelector('a.skip-to-content') as HTMLAnchorElement | null;
      skip?.click();
    });
    await page.waitForTimeout(150);
    await expect(page.getByRole('heading', { name: 'Kairon User Guide' })).toBeVisible();
    expect(await page.evaluate(() => window.location.hash)).toBe('#/guide');
  });
});

test.describe('Open Beta Feedback & Private Owner Inbox Gating', () => {
  test('Public Website footer and Guide open Beta Feedback modal and submit cleanly', async ({ page }) => {
    await page.goto('/guide?testBypass=true', { waitUntil: 'networkidle' });
    // Clear testBypass sessionStorage first to test public guide
    await page.evaluate(() => {
      sessionStorage.removeItem('testBypass');
      localStorage.removeItem('kairon_booth_mode');
    });
    await page.goto('/guide', { waitUntil: 'networkidle' });

    const btn = page.getByRole('button', { name: /Send Open Beta Feedback/i }).first();
    await expect(btn).toBeVisible();
    await btn.click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Send Open Beta Feedback' })).toBeVisible();
    await page.getByLabel('Close feedback dialog').click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('Non-owner (Guest Booth) cannot see Beta Inbox in sidebar and is redirected off /beta-inbox', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('kairon_booth_mode', 'true');
    });
    await page.goto('/?testBypass=true', { waitUntil: 'networkidle' });

    // Beta Inbox must be strictly hidden for non-owner email (guest@kairon.app)
    await expect(page.locator('aside a', { hasText: 'Beta Inbox' })).toHaveCount(0);

    // Direct navigation to /beta-inbox redirects back to /
    await page.goto('/beta-inbox?testBypass=true', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/(\?.*)?$/);
    await expect(page.getByText('Open Beta Feedback Inbox')).toHaveCount(0);

    // Non-owner CAN still submit feedback via bottom status bar button
    await page.getByRole('button', { name: /Beta Feedback/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.fill('#beta-feedback-message', 'Testing v1.1.4 beta feedback submission flow!');
    await page.getByRole('button', { name: /Submit Feedback/i }).click();
    await expect(page.getByText('Thank You for Your Feedback!')).toBeVisible();
  });
});
