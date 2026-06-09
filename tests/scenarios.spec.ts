import { test, expect } from '@playwright/test';

test.describe('Live Rundown E2E Scenarios', () => {
  test('should simulate a full rundown scenario', async ({ page, context }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', msg => console.log('PAGE ERROR:', msg));

    // 1. Install Playwright's clock to mock system time and interval execution
    await page.clock.install();

    // 2. Load the App with testBypass to mock auth and database operations
    await page.goto('/?testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    // 3. Create a new program from the dashboard
    const createBtn = page.getByRole('button', { name: 'Create New' });
    await expect(createBtn).toBeVisible({ timeout: 10000 });
    await createBtn.click();

    // Verify redirect to program editor
    await expect(page).toHaveURL(/.*editor/);
    const titleInput = page.locator('input').first();
    await expect(titleInput).toBeVisible();

    // 4. Fill in program details
    await titleInput.fill('Sunday Morning Service');

    // Add first slot (1 minute duration)
    await page.getByText('Add Session Slot').click();
    await page.locator('input[placeholder="Session Title"]').first().fill('Opening Praise & Worship');
    await page.locator('input[placeholder="Speaker Name"]').first().fill('Worship Team');
    await page.locator('input[type="number"]').first().fill('1');

    // Add second slot (10 minutes duration)
    await page.getByText('Add Session Slot').click();
    await page.locator('input[placeholder="Session Title"]').nth(1).fill('Sermon - Pastor John');
    await page.locator('input[placeholder="Speaker Name"]').nth(1).fill('Pastor John');
    await page.locator('input[type="number"]').nth(1).fill('10');

    // Grab the program ID from the URL
    const currentUrl = page.url();
    const urlObj = new URL(currentUrl);
    const programId = urlObj.searchParams.get('id');
    expect(programId).toBeTruthy();

    // Wait 2.5 seconds to let the autosave debounce trigger and persist the program to localStorage
    await page.clock.fastForward(3000);

    // 5. Navigate to the Live Timer view
    await page.goto(`/live?id=${programId}&testBypass=true`);
    await page.waitForLoadState('domcontentloaded');

    // Verify first slot detail display
    await expect(page.locator('h1').first()).toContainText('Opening Praise & Worship');
    await expect(page.locator('p').filter({ hasText: 'Worship Team' }).first()).toBeVisible();
    
    const timerDisplay = page.locator('div.font-mono.font-bold.leading-none').first();
    await expect(timerDisplay).toContainText('01:00');

    // 6. Start the live timer
    const playPauseBtn = page.locator('button.w-24.h-24');
    await expect(playPauseBtn).toBeVisible();
    await playPauseBtn.click();

    // Wait 30 seconds
    await page.clock.fastForward(30000);
    await expect(timerDisplay).toContainText('00:30');

    // 7. Test Nudge functionality
    const minusNudgeBtn = page.locator('button[title="Nudge Down"]').first();
    const plusNudgeBtn = page.locator('button[title="Nudge Up"]').first();

    // Subtract 1 minute
    await minusNudgeBtn.click();
    await page.clock.fastForward(100); // Small tick to trigger state update
    // Countdown should now go into overtime
    await expect(timerDisplay).toHaveText(/-00:\d\d/);

    // Add 1 minute
    await plusNudgeBtn.click();
    await page.clock.fastForward(100);
    // Countdown should return to positive
    await expect(timerDisplay).toHaveText(/00:\d\d/);

    // 8. Test Timer pausing
    const pausedTime = await timerDisplay.textContent();
    await playPauseBtn.click();
    await page.clock.fastForward(30000); // 30 seconds pass
    // Countdown should remain paused at the exact same value
    await expect(timerDisplay).toHaveText(pausedTime || '');

    // Resume the timer
    await playPauseBtn.click();
    await page.clock.fastForward(100);

    // 9. Test Auto-Advance behavior (Slot 1 ends after remaining time)
    await page.clock.fastForward(35000); // 35 seconds
    // Active slot should auto-advance to index 1 ("Sermon - Pastor John")
    await expect(page.locator('h1').first()).toContainText('Sermon - Pastor John');
    await expect(page.locator('p').filter({ hasText: 'Pastor John' }).first()).toBeVisible();
    await expect(timerDisplay).toHaveText(/(10:00|09:\d\d)/);

    // 10. Test Manual Mode behavior
    // Toggle manual advance mode
    const autoManualToggle = page.locator('[title*="Advance"]').first();
    await expect(autoManualToggle).toBeVisible();
    await autoManualToggle.click();
    await page.clock.fastForward(100);

    // Fast-forward 10 minutes and 30 seconds (630,000 ms)
    await page.clock.fastForward(630000);

    // In Manual Mode, it must NOT auto-advance.
    // It should stay on "Sermon - Pastor John" and display negative overtime countdown.
    await expect(page.locator('h1').first()).toContainText('Sermon - Pastor John');
    await expect(timerDisplay).toHaveText(/-00:\d\d/);

    // 11. Test Hold for Cue & Standby Banners
    // Open a second page context for Stage Display to verify real-time overlay sync
    const stagePage = await context.newPage();
    // Enable fake clock on the stage page too
    await stagePage.clock.install();
    await stagePage.goto(`/stage?id=${programId}&testBypass=true`);
    await stagePage.waitForLoadState('domcontentloaded');

    // Verify stage display shows the current slot title
    await expect(stagePage.locator('h1').first()).toContainText('Sermon - Pastor John');

    // Go back to operator page and toggle "Hold for Cue"
    const holdForCueBtn = page.locator('button:has-text("Hold for Cue")');
    await expect(holdForCueBtn).toBeVisible();
    await holdForCueBtn.click();

    // Wait 1 second to propagate via localStorage sync event
    await page.clock.fastForward(1000);
    await stagePage.clock.fastForward(1000);

    // Verify the standby banner overlays in Stage Display
    const holdOverlay = stagePage.locator('div:has-text("WAITING FOR CUE")').first();
    await expect(holdOverlay).toBeVisible();
    await expect(stagePage.locator('div:has-text("Stand By")').first()).toBeVisible();

    // Toggle "Hold for Cue" off
    await holdForCueBtn.click();
    await page.clock.fastForward(1000);
    await stagePage.clock.fastForward(1000);

    // Verify standby banner is removed
    await expect(holdOverlay).not.toBeVisible();
  });
});
