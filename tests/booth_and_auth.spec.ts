import { test, expect } from '@playwright/test';

test.describe('Booth Mode & Desktop Auth Integration Tests', () => {

  test('should boot smoothly into Booth Mode with a clean zero-hardcoded workspace', async ({ page }) => {
    // Navigate with booth mode enabled in localStorage
    await page.addInitScript(() => {
      localStorage.setItem('kairon_booth_mode', 'true');
    });

    await page.goto('/?testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    // Verify app shell loads without blank screen
    await expect(page.getByRole('heading', { name: 'My Programs' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create New' })).toBeVisible();

    // Verify ZERO hardcoded church or sample seed data exists on fresh start
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/winners chapel/i);
    await expect(page.locator('text=Sunday Celebration Service')).toHaveCount(0);
    await expect(page.locator('text=Midweek Communion Service')).toHaveCount(0);
  });

  test('should render Desktop Auth Approval view when navigating to ?desktopCode=KRN-TEST', async ({ page }) => {
    await page.goto('/?desktopCode=KRN-ABCD&testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    // Verify Desktop Auth Approval page is rendered
    await expect(page.locator('text=Authorize Desktop App').or(page.locator('text=KRN-ABCD'))).toBeVisible();
  });

  test('should render direct email and browser tabs on DesktopAuthWaiting', async ({ page }) => {
    // Simulate Electron runtime environment
    await page.addInitScript(() => {
      (window as any).electron = { isElectron: true };
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Check that tabs exist
    const browserTab = page.getByRole('button', { name: /Browser Sign-In/i });
    const emailTab = page.getByRole('button', { name: /Direct Email OTP|Email & Password/i });
    const offlineGuestBtn = page.getByRole('button', { name: /Continue Offline as Guest/i });

    await expect(browserTab).toBeVisible();
    await expect(emailTab).toBeVisible();
    await expect(offlineGuestBtn).toBeVisible();

    // Click direct email tab and check that email input appears
    await emailTab.click();
    await expect(page.getByPlaceholder(/name@organization\.com|pastor@church\.org/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign In|Create Account|Send Verification Code/i })).toBeVisible();

    // Switch back to browser tab and check that browser code appears
    await browserTab.click();
    await expect(page.getByText('Sign in with your browser')).toBeVisible();
  });

});
