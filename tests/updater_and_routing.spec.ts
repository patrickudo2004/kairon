import { test, expect } from '@playwright/test';

test.describe('Routing & In-App Auto-Update E2E Workflows', () => {

  test('should render center dashboard smoothly in simulated Electron runtime (preventing blank screen)', async ({ page }) => {
    // Simulate Electron runtime
    await page.addInitScript(() => {
      (window as any).electron = { isElectron: true, platform: 'win32' };
      localStorage.setItem('kairon_booth_mode', 'true');
    });

    await page.goto('/?testBypass=true#/');
    await page.waitForLoadState('domcontentloaded');

    // Verify Zone B center primary canvas is NOT blank
    await expect(page.getByRole('heading', { name: 'My Programs' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Sunday Celebration Service').first()).toBeVisible();
  });

  test('should redirect unknown or disk file paths to dashboard via catch-all wildcard route', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('kairon_booth_mode', 'true');
    });

    // Navigate to an unknown route
    await page.goto('/unknown-random-route?testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    // Should redirect cleanly to Dashboard
    await expect(page.getByRole('heading', { name: 'My Programs' })).toBeVisible({ timeout: 10000 });
  });

  test('should open UpdateCheckerModal from Help menu in StudioMenuBar', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('kairon_booth_mode', 'true');
    });

    await page.goto('/?testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    // Wait for header to settle
    await expect(page.getByRole('heading', { name: 'My Programs' })).toBeVisible({ timeout: 10000 });

    // Open Help dropdown menu
    const helpBtn = page.getByRole('button', { name: 'Help', exact: true });
    await expect(helpBtn).toBeVisible();
    await helpBtn.click();

    // Verify update option is visible and click it
    const updateMenuItem = page.getByRole('button', { name: /Check for Updates|Update Available/i });
    await expect(updateMenuItem).toBeVisible();
    await updateMenuItem.click();

    // Verify UpdateCheckerModal is open
    await expect(page.getByRole('heading', { name: 'Kairon Studio Updates' })).toBeVisible();
    await expect(page.locator('text=Current build: v1.0.8')).toBeVisible();
  });

  test('should display "Up to Date" when latest release matches current version', async ({ page }) => {
    // Intercept GitHub Release API to mock current version v1.0.6
    await page.route('**/repos/patrickudo2004/kairon/releases/latest', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          tag_name: 'v1.0.8',
          name: 'Kairon v1.0.8 Stable',
          body: 'Current stable release.',
          html_url: 'https://github.com/patrickudo2004/kairon/releases/tag/v1.0.8',
          published_at: new Date().toISOString(),
          assets: [],
        }),
      });
    });

    await page.addInitScript(() => {
      localStorage.setItem('kairon_booth_mode', 'true');
      localStorage.removeItem('kairon_last_update_check_time');
      localStorage.removeItem('kairon_latest_release_cache');
    });

    await page.goto('/?testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    // Open Help -> Check for updates
    await page.getByRole('button', { name: 'Help', exact: true }).click();
    await page.getByRole('button', { name: /Check for Updates|Update Available/i }).click();

    // Verify up-to-date state
    await expect(page.getByRole('heading', { name: 'Kairon Studio is Up to Date' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/You are currently running the latest production build/i)).toBeVisible();
  });

  test('should display "New Version Available" with download button when newer release exists', async ({ page }) => {
    // Intercept GitHub Release API to mock newer version v1.0.7
    await page.route('**/repos/patrickudo2004/kairon/releases/latest', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 2,
          tag_name: 'v1.0.9',
          name: 'Kairon v1.0.9 - Upcoming Reliability Update',
          body: '- Added in-app update checker\n- Fixed blank desktop canvas\n- Enhanced stage cue dispatcher',
          html_url: 'https://github.com/patrickudo2004/kairon/releases/tag/v1.0.9',
          published_at: new Date().toISOString(),
          assets: [
            {
              id: 101,
              name: 'Kairon-Setup-1.0.9.exe',
              browser_download_url: 'https://github.com/patrickudo2004/kairon/releases/download/v1.0.9/Kairon-Setup-1.0.9.exe',
              size: 85000000,
              content_type: 'application/octet-stream',
            },
          ],
        }),
      });
    });

    await page.addInitScript(() => {
      localStorage.setItem('kairon_booth_mode', 'true');
      localStorage.removeItem('kairon_last_update_check_time');
      localStorage.removeItem('kairon_latest_release_cache');
    });

    await page.goto('/?testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    // Trigger update modal
    await page.getByRole('button', { name: 'Help', exact: true }).click();
    await page.getByRole('button', { name: /Check for Updates|Update Available/i }).click();

    // Verify new version available state
    await expect(page.locator('text=New Version Available')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=v1.0.9').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Download for/i })).toBeVisible();
    await expect(page.locator('text=Enhanced stage cue dispatcher')).toBeVisible();
  });

  test('should open UpdateCheckerModal directly from StudioStatusBar version pill', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem('kairon_booth_mode', 'true');
    });

    await page.goto('/?testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    // Click version button in status bar (e.g. 'v1.0.6' or 'UPDATE v...')
    const versionBtn = page.getByRole('button', { name: /v1\.\d+\.\d+|UPDATE/i });
    await expect(versionBtn).toBeVisible({ timeout: 5000 });
    await versionBtn.click();
    await expect(page.getByRole('heading', { name: 'Kairon Studio Updates' })).toBeVisible();
  });

});
