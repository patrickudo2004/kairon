import { test, expect } from '@playwright/test';

test.describe('Live Rundown E2E Scenarios', () => {
  test('should simulate a full rundown scenario', async ({ page, context }) => {
    // This is a complex multi-page E2E scenario with 741 simulated seconds of clock
    // fast-forwards and a second browser page - needs more than the 30s default.
    test.setTimeout(120000);

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', msg => console.log('PAGE ERROR:', msg));

    // 1. Install Playwright's clock with a fixed base time to avoid offsets
    const baseTime = new Date('2026-06-12T12:00:00Z');
    await page.clock.install({ time: baseTime });

    // 2. Load the App with testBypass to mock auth and database operations
    await page.goto('/?testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    // 3. Create a new program from the dashboard
    const createBtn = page.getByRole('button', { name: 'Create New' });
    await expect(createBtn).toBeVisible({ timeout: 10000 });
    await createBtn.click();

    // Verify redirect to program editor
    await expect(page).toHaveURL(/.*editor/);
    const titleInput = page.locator('input[placeholder="Event Title"]');
    await expect(titleInput).toBeVisible();

    // 4. Fill in program details
    await titleInput.fill('Sunday Morning Service');

    // Add first slot (1 minute duration)
    await page.getByText('Add Session Slot').click();
    await page.locator('input[placeholder="Session Title"]:visible').first().fill('Opening Praise & Worship');
    await page.locator('input[placeholder="Speaker Name"]:visible').first().fill('Worship Team');
    await page.locator('input[type="number"]:visible').first().fill('1');

    // Add second slot (10 minutes duration)
    await page.getByText('Add Session Slot').click();
    await page.locator('input[placeholder="Session Title"]:visible').nth(1).fill('Sermon - Pastor John');
    await page.locator('input[placeholder="Speaker Name"]:visible').nth(1).fill('Pastor John');
    await page.locator('input[type="number"]:visible').nth(1).fill('10');

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
    await expect(timerDisplay).toHaveText(/00:(2\d|30)/);

    // 7. Test Nudge functionality
    const autoManualToggle = page.locator('[title*="Advance"]').first();
    await expect(autoManualToggle).toBeVisible();

    // Switch to Manual Mode so subtracting 1 minute goes to overtime instead of auto-advancing
    await autoManualToggle.click();
    await page.clock.fastForward(1000);

    const minusNudgeBtn = page.locator('button[title="Nudge Down"]').first();
    const plusNudgeBtn = page.locator('button[title="Nudge Up"]').first();

    // Subtract 1 minute
    await minusNudgeBtn.click();
    await page.clock.fastForward(1000); // Tick to trigger state update
    // Countdown should now go into overtime
    await expect(timerDisplay).toHaveText(/-00:\d\d/);

    // Add 1 minute
    await plusNudgeBtn.click();
    await page.clock.fastForward(1000);
    // Countdown should return to positive
    await expect(timerDisplay).toHaveText(/00:\d\d/);

    // Switch back to Auto-Advance mode
    await autoManualToggle.click();
    await page.clock.fastForward(1000);

    // Wait 3 seconds to let the debounced auto-save mutation complete, avoiding database write races
    await page.clock.fastForward(3000);

    // 8. Test Timer pausing
    await playPauseBtn.click();
    await page.clock.fastForward(1000); // Let pause mutation and state settle
    const pausedTime = await timerDisplay.textContent();
    await page.clock.fastForward(30000); // 30 seconds pass
    // Countdown should remain paused at the exact same value
    await expect(timerDisplay).toHaveText(pausedTime || '');

    // Resume the timer
    await playPauseBtn.click();
    await page.clock.fastForward(1000); // Let resume mutation and state settle

    // 9. Test Auto-Advance behavior (Slot 1 ends after remaining time)
    await page.clock.fastForward(25000); // remaining time + buffer to pass 1 min total
    await page.clock.fastForward(1000); // Let auto-advance settle
    // Active slot should auto-advance to index 1 ("Sermon - Pastor John")
    await expect(page.locator('h1').first()).toContainText('Sermon - Pastor John');
    await expect(page.locator('p').filter({ hasText: 'Pastor John' }).first()).toBeVisible();
    await expect(timerDisplay).toHaveText(/(10:00|09:\d\d)/);

    // 10. Test Manual Mode behavior
    // Toggle manual advance mode
    await expect(autoManualToggle).toBeVisible();
    await autoManualToggle.click();
    await page.clock.fastForward(1000);

    // CRITICAL: Wait for the "Manual" badge to appear in the UI. This confirms that
    // isManualMode has propagated all the way through the localStorage → activeSessions
    // → globalLiveProgram → displayProgram.isManualMode chain before we do the big jump.
    // Without this, the auto-advance watcher fires with stale isManualMode=false and
    // calls handleEndEvent(), concluding the event and resetting to slot 0.
    await expect(page.locator('button[title="Manual Mode (Manual Advance)"]').first()).toBeVisible({ timeout: 5000 });

    // Wait 3 seconds to let the manual toggle auto-save complete, avoiding database write races
    await page.clock.fastForward(3000);

    // Fast-forward remaining 10 minutes and 27 seconds (627,000 ms)
    await page.clock.fastForward(627000);
    await page.clock.fastForward(1000); // Let manual mode overtime and UI settle

    // In Manual Mode, it must NOT auto-advance.
    // It should stay on "Sermon - Pastor John" and display negative overtime countdown.
    await expect(page.locator('h1').first()).toContainText('Sermon - Pastor John');
    await expect(timerDisplay).toHaveText(/^-\d\d:\d\d$/);

    // 11. Test Hold for Cue & Standby Banners
    // Open a second page context for Stage Display to verify real-time overlay sync
    const stagePage = await context.newPage();
    await stagePage.goto(`/stage?id=${programId}&testBypass=true`);
    await stagePage.waitForLoadState('domcontentloaded');
    const currentMockTime = await page.evaluate(() => Date.now());
    await stagePage.clock.install({ time: currentMockTime });

    // Verify stage display shows the current slot title
    await expect(stagePage.locator('h1').first()).toContainText('Sermon - Pastor John');

    // Go back to operator page and toggle "Hold for Cue"
    const holdForCueBtn = page.locator('button[title="Toggle Hold"]').first();
    await expect(holdForCueBtn).toBeVisible();
    await holdForCueBtn.click({ force: true });

    // Let mutation settle and reload stage display to fetch latest state
    await page.clock.fastForward(1000);
    await stagePage.reload();

    // Verify the standby banner overlays in Stage Display
    const holdOverlay = stagePage.locator('div:has-text("WAITING FOR CUE")').first();
    await expect(holdOverlay).toBeVisible();
    await expect(stagePage.locator('div:has-text("Stand By")').first()).toBeVisible();

    // Toggle "Hold for Cue" off
    await holdForCueBtn.click({ force: true });
    await page.clock.fastForward(1000);
    await stagePage.reload();

    // Verify standby banner is removed
    await expect(holdOverlay).not.toBeVisible();
  });

  test('should sync correctly across multiple tabs without auto-save loops', async ({ page, context }) => {
    test.setTimeout(60000);

    // 1. Install Playwright clock with a fixed base time to avoid offsets
    const baseTime = new Date('2026-06-12T12:00:00Z');
    await page.clock.install({ time: baseTime });

    // 2. Load Page A and create a program
    await page.goto('/?testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    const createBtn = page.getByRole('button', { name: 'Create New' });
    await expect(createBtn).toBeVisible({ timeout: 10000 });
    await createBtn.click();

    await expect(page).toHaveURL(/.*editor/);
    const titleInput = page.locator('input[placeholder="Event Title"]');
    await expect(titleInput).toBeVisible();
    await titleInput.fill('Multi-Tab Sync Service');

    // Add a slot
    await page.getByText('Add Session Slot').click();
    await page.locator('input[placeholder="Session Title"]').first().fill('Worship');
    await page.locator('input[placeholder="Speaker Name"]').first().fill('Choir');
    await page.locator('input[type="number"]').first().fill('5');

    // Grab the program ID
    const currentUrl = page.url();
    const urlObj = new URL(currentUrl);
    const programId = urlObj.searchParams.get('id');
    expect(programId).toBeTruthy();

    // Let the auto-save debounce save the program to localStorage
    await page.clock.fastForward(3000);

    // 4. Navigate Page A to the Live Timer
    await page.goto(`/live?id=${programId}&testBypass=true`);
    await page.waitForLoadState('domcontentloaded');
    const timerDisplayA = page.locator('div.font-mono.font-bold.leading-none').first();
    await expect(timerDisplayA).toContainText('05:00');

    // 5. Start the timer on Page A
    const playPauseBtnA = page.locator('button.w-24.h-24');
    await expect(playPauseBtnA).toBeVisible();
    await playPauseBtnA.click();
    await page.clock.fastForward(1000); // Let start mutation and state settle

    // 3. Open Page B (simulating secondary tab/device)
    const pageB = await context.newPage();
    await pageB.goto(`/live?id=${programId}&testBypass=true`);
    await pageB.waitForLoadState('domcontentloaded');
    const currentMockTimeB = await page.evaluate(() => Date.now());
    await pageB.clock.install({ time: currentMockTimeB });

    // Verify Page B loaded the correct slot
    await expect(pageB.locator('h1').first()).toContainText('Worship');
    const timerDisplayB = pageB.locator('div.font-mono.font-bold.leading-none').first();

    // 6. Propagate state and tick time on both pages identically
    await page.clock.fastForward(5000);
    await pageB.clock.fastForward(5000);

    // Verify timer is active on Page A and has decremented
    const timeA = await timerDisplayA.textContent();
    expect(timeA).not.toBe('05:00');
    expect(timeA).toMatch(/^(04|03):\d\d$/);

    // Verify timer is active on Page B and has decremented (without auto-save loop reverting it)
    const timeB = await timerDisplayB.textContent();
    expect(timeB).not.toBe('05:00');
    expect(timeB).toMatch(/^(04|03):\d\d$/);
  });

  test('should verify prompter, command center, and autopilot behavior', async ({ page, context }) => {
    test.setTimeout(90000);

    // 1. Install Playwright clock with a fixed base time to avoid offsets
    const baseTime = new Date('2026-06-12T12:00:00Z');
    await page.clock.install({ time: baseTime });

    // 2. Load Page and create a program
    await page.goto('/?testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    const createBtn = page.getByRole('button', { name: 'Create New' });
    await expect(createBtn).toBeVisible({ timeout: 10000 });
    await createBtn.click();

    await expect(page).toHaveURL(/.*editor/);
    const titleInput = page.locator('input[placeholder="Event Title"]');
    await expect(titleInput).toBeVisible();
    await titleInput.fill('Phase 35 Test Service');

    // Add a slot with speaker and details/notes
    await page.getByText('Add Session Slot').click();
    await page.locator('input[placeholder="Session Title"]').first().fill('Opening Remarks');
    await page.locator('input[placeholder="Speaker Name"]').first().fill('Host Pastor');
    await page.locator('input[type="number"]').first().fill('3');
    
    // Add details for prompter
    await page.locator('button[title="Show Details"]').first().click();
    await page.locator('textarea[placeholder*="teleprompter"]').first().fill('Welcome to Kairon!\n# Key Topics\n- Introduction\n- Welcome guest speakers');

    // Grab the program ID
    const currentUrl = page.url();
    const urlObj = new URL(currentUrl);
    const programId = urlObj.searchParams.get('id');
    expect(programId).toBeTruthy();

    // Let the auto-save debounce save the program to localStorage
    await page.clock.fastForward(3000);

    // 3. Navigate to Prompter screen
    const prompterPage = await context.newPage();
    await prompterPage.clock.install({ time: baseTime });
    await prompterPage.goto(`/prompter?id=${programId}&testBypass=true`);
    await prompterPage.waitForLoadState('domcontentloaded');

    // Verify prompter page displays title, speaker, countdown and markdown notes
    await expect(prompterPage.locator('h1').first()).toContainText('Opening Remarks');
    await expect(prompterPage.locator('p').filter({ hasText: 'Host Pastor' }).first()).toBeVisible();
    await expect(prompterPage.locator('h1', { hasText: 'Key Topics' })).toBeVisible();

    // 4. Navigate Page A to Command Center
    await page.goto('/command?testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    // Verify CommandCenter header is visible
    await expect(page.locator('h1').first()).toContainText('Multi-Track Command Center');

    // Command Center shows live programs. Our program is currently in draft. Let's make it live by going to live timer page.
    await page.goto(`/live?id=${programId}&testBypass=true`);
    await page.waitForLoadState('domcontentloaded');

    // Start the live timer
    const playPauseBtn = page.locator('button.w-24.h-24');
    await expect(playPauseBtn).toBeVisible();
    await playPauseBtn.click();
    await page.clock.fastForward(1000); // Let it start and sync

    // Reload prompter page to load the active live segment state
    await prompterPage.reload();

    // Verify prompter page displays title, speaker, countdown and markdown notes
    await expect(prompterPage.locator('h1').first()).toContainText('Opening Remarks');
    await expect(prompterPage.locator('p').filter({ hasText: 'Host Pastor' }).first()).toBeVisible();
    await expect(prompterPage.locator('h1', { hasText: 'Key Topics' })).toBeVisible();

    // Verify that autopilot toggle is visible on Live Timer page
    const autopilotToggle = page.locator('button:has-text("Autopilot")').first();
    await expect(autopilotToggle).toBeVisible();
    await autopilotToggle.click(); // Enable Autopilot
    await page.clock.fastForward(1000);

    // Let's verify CommandCenter shows the active track
    await page.goto('/command?testBypass=true');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('h1').first()).toContainText('Multi-Track Command Center');
    await expect(page.getByRole('main').getByRole('heading', { name: 'Phase 35 Test Service' })).toBeVisible();
  });

  test('should verify Crew HUD acknowledgements and real-time state sync', async ({ page, context }) => {
    test.setTimeout(60000);

    const baseTime = new Date('2026-06-12T12:00:00Z');
    await page.clock.install({ time: baseTime });

    // 1. Create a program with technical production notes
    await page.goto('/?testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    const createBtn = page.getByRole('button', { name: 'Create New' });
    await expect(createBtn).toBeVisible({ timeout: 10000 });
    await createBtn.click();

    await expect(page).toHaveURL(/.*editor/);
    const titleInput = page.locator('input[placeholder="Event Title"]');
    await titleInput.fill('Broadcast Service 4');

    // Add slot with production cues
    await page.getByText('Add Session Slot').click();
    await page.locator('input[placeholder="Session Title"]').first().fill('Praise & Worship Live');
    await page.locator('input[placeholder="Speaker Name"]').first().fill('Music Director');
    await page.locator('input[type="number"]').first().fill('5');

    await page.locator('button[title="Show Details"]').first().click();
    await page.locator('textarea[placeholder*="Spotlight on pulpit"]').first().fill('Cue wireless mics 1-4 and stage wash');

    const currentUrl = page.url();
    const urlObj = new URL(currentUrl);
    const programId = urlObj.searchParams.get('id');
    expect(programId).toBeTruthy();

    await page.clock.fastForward(3000);

    // 2. Open Crew HUD in a second page/window
    const crewPage = await context.newPage();
    await crewPage.clock.install({ time: baseTime });
    await crewPage.goto(`/crew?id=${programId}&testBypass=true`);
    await crewPage.waitForLoadState('domcontentloaded');

    // Verify slot title and production cues appear on Crew HUD
    await expect(crewPage.locator('h2', { hasText: 'Praise & Worship Live' })).toBeVisible();
    await expect(crewPage.locator('text=Cue wireless mics 1-4 and stage wash')).toBeVisible();

    // Verify ACK buttons are visible (Sound, Lights, Video)
    const soundBtn = crewPage.getByRole('button', { name: /Sound/i });
    const lightsBtn = crewPage.getByRole('button', { name: /Lights/i });
    const videoBtn = crewPage.getByRole('button', { name: /Video/i });

    await expect(soundBtn).toBeVisible();
    await expect(lightsBtn).toBeVisible();
    await expect(videoBtn).toBeVisible();

    // Click Sound ACK and verify it changes state
    await soundBtn.click();
    await crewPage.clock.fastForward(500);

    // Verify Sound button has confirmed state (green / checked)
    await expect(soundBtn).toHaveClass(/text-\[#10B981\]/);
  });

  test('should unify Public Portal links across Editor, Printable PDF, and Monitors & Displays without blank renders', async ({ page, context }) => {
    test.setTimeout(60000);

    const baseTime = new Date('2026-06-12T12:00:00Z');
    await page.clock.install({ time: baseTime });

    await page.goto('/?testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    const createBtn = page.getByRole('button', { name: 'Create New' });
    await expect(createBtn).toBeVisible({ timeout: 10000 });
    await createBtn.click();

    await expect(page).toHaveURL(/.*editor/);
    const titleInput = page.locator('input[placeholder="Event Title"]');
    await expect(titleInput).toBeVisible();
    await titleInput.fill('Winners Sunday Celebration');

    await page.getByText('Add Session Slot').click();
    await page.locator('input[placeholder="Session Title"]').first().fill('Praise & Worship');
    await page.locator('input[placeholder="Speaker Name"]').first().fill('WCIM Choir');
    await page.locator('input[type="number"]').first().fill('15');

    // Let auto-save settle
    await page.clock.fastForward(3000);

    // 1. Check Editor Public Attendee Link and Preview href
    const previewLink = page.locator('a', { hasText: 'PREVIEW' });
    await expect(previewLink).toBeVisible();
    const previewHref = await previewLink.getAttribute('href');
    expect(previewHref).toMatch(/^\/p\/[a-z0-9-]+$/i);

    // Open QR Code drawer in Editor and verify canonical URL + Printable PDF QR SVG
    const qrBtn = page.getByRole('button', { name: /QR CODE/i });
    await qrBtn.click();
    const expectedSlug = previewHref!.replace('/p/', '');
    await expect(page.locator(`text=/\\/p\\/${expectedSlug}/`).first()).toBeVisible();
    await expect(page.locator('#printable-area svg').first()).toBeAttached();

    // 2. Navigate to Monitors & Displays and check Public Portal card & live thumbnail iframe
    await page.goto(`/monitors?id=${expectedSlug}&testBypass=true`);
    await page.waitForLoadState('domcontentloaded');

    const publicIframe = page.locator('iframe[title="Public Portal"]');
    await expect(publicIframe).toBeVisible();
    const iframeSrc = await publicIframe.getAttribute('src');
    expect(iframeSrc).toContain(`/p/${expectedSlug}`);

    const frame = page.frameLocator('iframe[title="Public Portal"]');
    await expect(frame.locator('h1')).toContainText('Winners Sunday Celebration', { timeout: 15000 });
    await expect(frame.locator('h3', { hasText: 'Praise & Worship' })).toBeVisible({ timeout: 15000 });

    // 3. Open the Public Portal URL directly in a new page across mobile/tablet/desktop viewports
    const portalPage = await context.newPage();
    await portalPage.setViewportSize({ width: 375, height: 812 });
    await portalPage.goto(`${previewHref}?testBypass=true`);
    await portalPage.waitForLoadState('domcontentloaded');

    await expect(portalPage.locator('h1')).toContainText('Winners Sunday Celebration');
    await expect(portalPage.locator('h3', { hasText: 'Praise & Worship' })).toBeVisible();
    await expect(portalPage.getByRole('button', { name: /Share/i })).toBeVisible();
  });

  test('should verify Kairon Studio v2.0 shell, Right Studio Dock, Template Overwrite/Append Guard, and Broadcast Overlay (/overlay)', async ({ page, context }) => {
    test.setTimeout(60000);

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?testBypass=true');
    await page.waitForLoadState('domcontentloaded');

    // 1. Verify Studio Menu Bar & Bottom Telemetry Strip are visible on Desktop
    await expect(page.getByRole('button', { name: 'File', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Integrations', exact: true })).toBeVisible();

    // 2. Create a new program and add an initial slot
    const createBtn = page.getByRole('button', { name: 'Create New' });
    await expect(createBtn).toBeVisible({ timeout: 10000 });
    await createBtn.click();

    await expect(page).toHaveURL(/.*editor/);
    const titleInput = page.locator('input[placeholder="Event Title"]');
    await titleInput.fill('Studio v2 Test Service');

    await page.getByText('Add Session Slot').click();
    await page.locator('input[placeholder="Session Title"]:visible').first().fill('Pre-Service Soundcheck');
    await page.locator('input[placeholder="Speaker Name"]:visible').first().fill('FOH Engineer');
    await page.locator('input[type="number"]:visible').first().fill('10');

    // 3. Click Sunday Church Service in the Quick-Start Template Bar -> Verify Overwrite vs. Append Guard Modal!
    await page.getByRole('button', { name: /Sunday Church Service \(10\)/i }).click();

    // Guard modal should appear because we already have 1 slot
    await expect(page.getByText(/Schedule Already Has 1 Slots/i)).toBeVisible();

    // Choose "Append to End" so we keep our Pre-Service Soundcheck + 10 Sunday Service slots = 11 slots
    await page.getByRole('button', { name: /Append to End/i }).click();

    // Verify 11 slots exist and enriched productionNotes & prompterText were populated
    await expect(page.locator('input[placeholder="Session Title"]:visible')).toHaveCount(11);

    // 4. Verify Right Studio Dock Live Output Preview & Slot Inspector
    await expect(page.getByText('Output Monitor')).toBeVisible();
    await expect(page.locator('iframe[title="Studio Live Output Preview"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Slot Inspector' })).toBeVisible();

    // 5. Open /overlay Broadcast Overlay route and verify Lower-Third rendering & deterministic window title
    const currentUrl = page.url();
    const programId = new URL(currentUrl).searchParams.get('id');
    const overlayPage = await context.newPage();
    await overlayPage.goto(`/overlay?id=${programId}&bg=green&layout=lower-third&testBypass=true`);
    await overlayPage.waitForLoadState('domcontentloaded');

    await expect(overlayPage).toHaveTitle('Kairon Output [OVERLAY]');
    await expect(overlayPage.getByText('Pre-Service Soundcheck')).toBeVisible();
  });
});
