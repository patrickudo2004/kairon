# Kairon User Guide: The Ultimate Production Timer

Welcome to Kairon 2.0! This guide will walk you through everything from your first login up to running a mission-critical conference with high-speed cloud synchronization.

## 🚀 1. Getting Started: Identity & Workspaces

Kairon is built around **Organizations**. This allows you to keep your personal schedules separate from your professional agency or church events.

-   **Login**: Use Google or a simple Magic Link to sign in.
-   **Workspaces**: Use the **Workspace Switcher** in the top header to jump between different organizations.
-   **Branding**: (Pro) Go to **Workspace Settings** to upload your logo and set a custom accent color that will appear on all TV and Stage displays.

## 📅 2. The Program Editor

The Editor is where you build your run-of-show.

-   **Slots**: Add items, set their duration, and categorize them (Session, Break, Transition).
-   **AI Rebalancer**: (Pro) Click the **Sparkles** icon if your event is running late. Gemini will analyze the remaining slots and suggest a new timing strategy to get you back on track.
-   **Cost Analytics**: (Pro) Enter estimated hourly rates for your team. Kairon will show you a live "Event Cost" ticker as the timer ticks.

## 📺 3. Production Displays

Kairon offers three specialized views for different roles:

1.  **TV Mode (`/tv`)**: High-contrast, beautiful view for attendees or overflow rooms.
2.  **Stage Display (`/stage`)**: Minimalist, high-visibility view for speakers with a massive countdown.
3.  **Pro View (`/live`)**: The control center for AV technicians, showing the current slot, next slot, and full controls.

## 🎮 4. Running the Show (Manual vs. Auto)

Kairon adapts to how you work:

-   **Auto Mode**: The timer flows naturally. When a slot ends, the next one starts.
-   **Manual Mode**: You are in total control. The timer won't advance to the next item until you click **"Next"**.
-   **Overtime**: If a speaker goes over, the timer turns **Red** and starts counting up (negative), showing exactly how much time you've lost.

## 🛑 5. The Cue System (Hold/Standby)

Sometimes things don't go as planned.
-   Click **"Hold for Cue"** to pause everything. 
-   **TV & Stage displays** will immediately swap to a high-visibility **"WAITING FOR CUE"** standby screen.
-   This is perfect for weddings (waiting for the bride) or conferences (waiting for a technical fix).

## 🌐 6. Public Portal & Embedding

Want to share your schedule with the world?
-   **Custom Slugs**: Give your event a URL like `kairon.app/p/summit-2026`.
-   **Attendee Portal**: Anyone with the link can see a beautiful, mobile-friendly schedule without logging in.
-   **iFrame Embed**: Copy the provided snippet to put your Kairon schedule directly on your own website.

## 📴 7. Offline & Local LAN Sync

Kairon is built for the "No Wi-Fi" reality of hotel ballrooms and metal-roofed event spaces.
-   **PWA**: Click "Install" in your browser bar. Kairon will live in your dock/taskbar and open even without internet.
-   **Convex Sync**: Every change is instantly backed up to the cloud. If you refresh on any device, your schedule is recovered instantly.
-   **Local Sync Fallback (LAN)**: If the internet cuts out entirely, Kairon automatically switches to a local `BroadcastChannel` router. Controls (Play, Pause, Nudge, Next) on the operator screen are sent directly to local display monitors (Stage display, TV display, Teleprompter) on the same machine/LAN environment with **zero internet connection**.

## 🎛️ 8. Multi-Track Command Center

For large-scale corporate summits, multi-track conferences, or multi-venue church setups, the Command Center (`/command`) provides a unified matrix view.
-   **Concurrent Tracking**: View active rundowns and countdown timers for Track A, Track B, and Track C side-by-side.
-   **Master Controls**: Play, pause, or nudge any specific track directly from the central dashboard grid.
-   **Quick Link Cockpit**: Click the action card icon to immediately launch the dedicated control cockpit for that specific session.

## 📖 9. Stage Teleprompter Mode

The Integrated Teleprompter (`/prompter`) splits the screen, showing the speaker a high-contrast countdown clock on the left, and an auto-scrolling markdown script outline on the right.
-   **Outlines Setup**: In the Program Editor, click the chevron dropdown on a slot card. Enter outline details under **Public Details / Abstract** (or stage cues under **Internal Stage Cues**).
-   **Slot Selector Dropdown**: Speakers can untether from the live sync and manually preview any slot's outline from the dropdown in the top bar.
-   **Sync to Live**: Click the **Sync to Live** button in preview mode to instantly snap back to the running countdown timer.

## 🤖 10. Autopilot Mode (Auto-Heal)

Autopilot is a deterministic auto-heal algorithm designed for operators who want the rundown schedule to self-correct when sessions run long.
-   **Zero Token Math**: Runs fully locally on your device with no external API calls, making it completely free (zero-token) and responsive even offline.
-   **Auto-Correction**: Toggling Autopilot will automatically detect slot overruns and redistribute the delayed minutes by shaving time proportionally from subsequent flexible segments to ensure the event finishes exactly at the planned hard end-time.

## 🎨 11. Pulpit Contrast Themes

To combat intense stage spotlights, pulpit screens and teleprompters can be set to high-contrast styles:
-   **Ambient Yellow**: Matte yellow text on true black background to eliminate glare under heavy overhead spotlights.
-   **Ambient White**: Clean, modern white outlines on pitch black background for low-light stages.

---

*For a detailed breakdown of Free vs. Pro features and the product roadmap, please refer to the [Feature Strategy](file:///c:/Users/patri/Documents/kairon-main/FEATURES_PRICING.md) document.*

## 🎭 User Scenarios

### Scenario A: The High-Stress Tech Conference
*   **The Goal**: Keep 5 speakers on a strict 20-minute schedule.
*   **The Setup**: AV Manager uses **Manual Mode** on a tablet. Speaker sees the **Stage Display**. Attendees see the **Public Portal** on their phones via a QR code.
*   **The Moment**: Speaker 2 goes 5 minutes over.
*   **The Solution**: AV Manager clicks **"Service Re-balancer"**. Gemini suggests cutting 1 minute from the next 5 transitions. The Manager clicks "Apply," and the event finishes exactly on time.

### Scenario B: The Wedding Ceremony
*   **The Goal**: Smooth transitions between music, vows, and the kiss.
*   **The Setup**: The DJ uses **Hold for Cue**. 
*   **The Moment**: The Flower Girl is missing.
*   **The Solution**: The DJ toggles **"Hold"**. The TV in the hall says "WAITING FOR CUE" so guests know something is happening. Once she's found, the DJ hits "Release" and the timer kicks off perfectly.

### Scenario C: The Church Service (Poor Wi-Fi & LAN Fallback)
*   **The Goal**: Display the service schedule on pulpit and lobby screens in a building with thick concrete walls.
*   **The Setup**: Tech team installs Kairon as a **PWA app** on all display PCs.
*   **The Moment**: The external internet fiber line cuts out mid-service.
*   **The Solution**: Kairon's automatic offline fallback router engages instantly. The tech team controls the rundown on the operator console, and all local display TVs, stage monitors, and pulpit teleprompters receive updates locally, keeping the countdown ticking in perfect sync offline.

