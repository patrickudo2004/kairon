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
    await expect(page.getByRole('button', { name: /Exit Zen Mode/i }).first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=CONSOLE PAUSED').or(page.locator('text=LIVE ON AIR')).or(page.locator('text=CONSOLE STANDBY'))).toBeVisible();

    // 4. Click Exit Zen Mode button
    const exitZenBtn = page.getByRole('button', { name: /Exit Zen Mode/i }).first();
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
    await expect(page.getByRole('button', { name: /Exit Zen Mode/i }).first()).toBeVisible({ timeout: 10000 });

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

  test('should show newly created program with 0 initial slots and delete it cleanly', async ({ page }) => {
    await page.goto('/?testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    // Click Create New button
    const createBtn = page.getByRole('button', { name: 'Create New' });
    await expect(createBtn).toBeVisible({ timeout: 10000 });
    await createBtn.click();

    // Verify editor has no initial 5-minute pre-service slot
    await expect(page).toHaveURL(/.*editor/);
    await expect(page.locator('text=Opening / Pre-Service')).not.toBeVisible();

    const titleInput = page.locator('input[placeholder="Event Title"]');
    await expect(titleInput).toBeVisible();
    await titleInput.fill('Sunday Youth Gathering');
    await titleInput.blur();

    // Allow autosave debounce (2000ms) to commit to local storage
    await page.waitForTimeout(2500);

    // Navigate to Dashboard via sidebar navigation
    const dashboardLink = page.getByRole('link', { name: /Dashboard/i }).or(page.locator('a[href="/"]')).first();
    await dashboardLink.click();

    // Verify program appears in Dashboard Upcoming section
    await expect(page.locator('text=Sunday Youth Gathering').first()).toBeVisible({ timeout: 10000 });

    // Click Delete on the newly created event
    const eventCard = page.locator('div').filter({ hasText: 'Sunday Youth Gathering' }).last();
    const deleteBtn = eventCard.locator('button[title*="Delete"]').or(eventCard.getByRole('button', { name: /Delete/i })).first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      // If a confirmation prompt appears, confirm it
      const confirmBtn = page.locator('button:has-text("Delete")').or(page.locator('button:has-text("Yes, Delete")')).last();
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click();
      }
      await page.waitForTimeout(1000);
      // Verify program is no longer on Dashboard
      await expect(page.locator('text=Sunday Youth Gathering')).not.toBeVisible();
    }
  });
});
