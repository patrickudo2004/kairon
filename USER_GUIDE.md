# Kairon User Guide: The Ultimate Production Timer

Welcome to Kairon 2.0! This guide will walk you through everything from your first login up to running a mission-critical conference with zero internet.

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

## 📴 7. Offline-First Reliability

Kairon is built for the "No Wi-Fi" reality of hotel ballrooms.
-   **PWA**: Click "Install" in your browser bar. Kairon will live in your dock/taskbar and open even without internet.
-   **Local Backup**: Every change is backed up to your device. If you refresh while the internet is down, your schedule is recovered instantly.
-   **Sync Indicator**: Watch the **"Live Sync"** badge in the header to know when your data is safely in the cloud.

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

### Scenario C: The Church Service (Poor Wi-Fi)
*   **The Goal**: Display the service schedule on foyer screens in a building with thick concrete walls.
*   **The Setup**: Tech team installs Kairon as a **PWA app** on the display PCs.
*   **The Moment**: The internet cuts out mid-service.
*   **The Solution**: Kairon doesn't blink. The **"Offline"** badge appears, but the timer keeps ticking and the foyer screens continue to show the correct local schedule.
