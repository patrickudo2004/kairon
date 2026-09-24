# Kairon Project Context & Rules

## Project Overview
- **App:** Kairon — a church broadcast stage & rundown engine for live services
- **Church:** Winners Chapel Manchester
- **Local project path:** `c:\Users\patri\Documents\kairon-main`
- **GitHub repo:** `https://github.com/patrickudo2004/kairon`
- **Live Convex backend URL:** `https://majestic-gecko-369.convex.cloud`
- **Current version:** `v1.0.1`

## Tech Stack
- **Frontend:** React + TypeScript + Vite + TailwindCSS + Lucide React
- **Backend:** Convex (real-time database + serverless functions)
- **Desktop app:** Electron — files MUST use `.cjs` extension (`electron/main.cjs`, `electron/preload.cjs`) because `package.json` has `"type": "module"`
- **CI/CD:** GitHub Actions (`.github/workflows/release.yml`) — builds Windows `.exe`, macOS `.dmg`, Linux `.AppImage` on version tag push

## Key Features Implemented
- **QA & Verification:** Comprehensive Playwright test suite (`tests/scenarios.spec.ts`) verifying timer, auto-advance, manual mode, overtime, and hold-for-cue states.
- **Autopilot Mode:** Deterministic local math to rebalance remaining slots when overrunning, protecting hard end-time. Zero cloud tokens, fully offline.
- **Stage Teleprompter:** Prompter view with automatic scroll tracking active countdown timer.
- **Pulpit Contrast Themes:** High-contrast Ambient Yellow and Ambient White themes against stage spotlight wash.
- **Stage Cue Dispatcher:** Silent communication from media booth to stage screen (Standard Banner & Emergency Flashing Strobe).
- **Hold for Cue:** Instant standby freeze showing "WAITING FOR CUE".
- **Multi-Screen Matrix:** Hardware display detection (HDMI, DisplayPort, USB-C, Wireless) with one-click projection to Screen 2 (Pulpit) and Screen 3 (TV/Overflow).
- **Native Desktop App:** Electron packaging with power save blocker / display sleep lock.
- **In-App User Guide:** `UserGuide.tsx` documentation (12 full sections).
- **WhatsApp Operational Guides:** Guides for Media Team (Sunday & Midweek), Pastors, and Congregation Leaders.

## Critical Technical Guidelines & Invariants
- `VITE_CONVEX_URL` must be injected at **build time** — `.env.local` is gitignored and unavailable on GitHub runners; pass as env var in workflow.
- Force-pushing an existing git tag does NOT retrigger GitHub Actions — always create a new tag (e.g. `v1.0.2`).
- `electron-builder` 26.x: `maintainer`, `desktopName`, `syncDesktopName` are NOT valid under the `linux` config block.
- `services/convexClient.ts` hardcodes `https://majestic-gecko-369.convex.cloud` as fallback for the desktop app.
- If internet drops mid-service, do NOT refresh the browser — Kairon runs offline and auto-reconnects.

## Service Rundown Templates (Winners Chapel Manchester)
- **Sunday Service:**
  1. Opening Prayer
  2. Praise & Worship
  3. Bible Reading
  4. Hymn
  5. Announcements & Testimonies
  6. First Timers
  7. Offering
  8. Choir Ministration
  9. Word / Altar Call
  10. Prophetic Blessings & Closing

- **Midweek Service (Wednesday):**
  1. Opening Prayer
  2. Praise & Worship
  3. Intercession 1–3
  4. Announcements & Testimony
  5. Intercession 4–6
  6. Personal Supplication
  7. Offering
  8. High Praise
  9. Word / Altar Call
  10. Communion & Blessing
  11. Closing Remarks
