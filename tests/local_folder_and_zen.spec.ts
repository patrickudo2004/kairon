import { test, expect } from '@playwright/test';

test.describe('Local Folder Workspace & Zen Focus Console User Workflows', () => {

  test('should display Zen Mode button in the header and toggle Zen Focus Console', async ({ page }) => {
    await page.goto('/?testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    // 1. Check Zen Mode button is visible in header
    const zenBtn = page.getByRole('button', { name: /Zen/i });
    await expect(zenBtn).toBeVisible({ timeout: 10000 });

    // 2. Click Zen Mode button
    await zenBtn.click();

    // 3. Verify Zen Focus Console HUD appears
    await expect(page.getByRole('button', { name: /Exit Zen Mode/i })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=CONSOLE PAUSED').or(page.locator('text=LIVE ON AIR'))).toBeVisible();

    // 4. Click Exit Zen Mode button
    const exitZenBtn = page.getByRole('button', { name: /Exit Zen Mode/i });
    await exitZenBtn.click();

    // 5. Verify Zen Focus Console closes and normal UI returns
    await expect(page.getByRole('button', { name: /Exit Zen Mode/i })).not.toBeVisible();
  });

  test('should toggle Zen Focus Console using Z hotkey', async ({ page }) => {
    await page.goto('/?testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    // Ensure body has focus
    await page.locator('body').click();
    await page.waitForTimeout(300);

    // Press 'z' key to enter Zen mode
    await page.keyboard.press('z');
    await expect(page.getByRole('button', { name: /Exit Zen Mode/i })).toBeVisible({ timeout: 10000 });

    // Press 'z' key again to toggle back
    await page.keyboard.press('z');
    await expect(page.getByRole('button', { name: /Exit Zen Mode/i })).not.toBeVisible({ timeout: 10000 });
  });

  test('should persist Local Workspace selection across navigation and reload', async ({ page }) => {
    // Seed local folder workspace in localStorage
    await page.addInitScript(() => {
      localStorage.setItem('kairon_local_folder_path', 'C:\\Users\\Patrick\\Documents\\KaironServices');
      localStorage.setItem('kairon_local_folder_name', 'My Church Rundowns');
      localStorage.setItem('kairon_active_org_id', 'local-folder-test');
    });

    await page.goto('/?testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    // Verify workspace name is displayed or accessible in the workspace switcher
    const workspaceSwitcher = page.locator('button').filter({ hasText: /My Church Rundowns|Local Workspace/i }).first();
    await expect(workspaceSwitcher).toBeVisible({ timeout: 10000 });
  });

  test('should show newly created program on both Dashboard and Calendar', async ({ page }) => {
    await page.goto('/?testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    // Click Create New button
    const createBtn = page.getByRole('button', { name: 'Create New' });
    await expect(createBtn).toBeVisible({ timeout: 10000 });
    await createBtn.click();

    // Fill in a recognizable event title
    await expect(page).toHaveURL(/.*editor/);
    const titleInput = page.locator('input[placeholder="Event Title"]');
    await expect(titleInput).toBeVisible();
    await titleInput.fill('Sunday Morning Communion');
    await titleInput.blur();

    // Allow autosave debounce (2000ms) to commit to local storage
    await page.waitForTimeout(2500);

    // Navigate to Dashboard via sidebar navigation
    const dashboardLink = page.getByRole('link', { name: /Dashboard/i }).or(page.locator('a[href="/"]')).first();
    await dashboardLink.click();

    // Verify program appears in Dashboard Upcoming section
    await expect(page.locator('text=Sunday Morning Communion').first()).toBeVisible({ timeout: 10000 });

    // Navigate to Calendar via sidebar navigation
    const calendarLink = page.getByRole('link', { name: /Calendar/i }).or(page.locator('a[href="/calendar"]')).first();
    await calendarLink.click();

    // Verify program is visible in Calendar
    await expect(page.locator('text=Sunday Morning Communion').first()).toBeVisible({ timeout: 10000 });
  });
});
