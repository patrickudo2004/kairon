# Kairon — Broadcast Stage & Rundown Engine

**Kairon** is a professional, cloud-synchronized live production rundown engine and multi-display stage timer designed for church media booths, conference coordinators, broadcast engineers, and speakers.

Powered by **React 19**, **Convex Real-Time Database**, and **Electron**, Kairon bridges live scheduling with zero-latency stage and confidence monitor projection across multiple physical displays.

---

## 🌟 Key Capabilities

### 1. 🖥️ Native Cross-Platform Desktop App
* **Windows, macOS & Linux**: Packaged as a dedicated standalone desktop application (`.exe` installer & portable, `.dmg`, `.AppImage`, and `.deb`).
* **Broadcast Power Management**: Native wake-lock prevents operator laptops and pulpit monitors from dimming or going to sleep during long sermons and live services.
* **Global Real-Time Cloud Sync**: Seamlessly synchronize across booth PCs, pastor MacBooks, sound engineering iPads, and attendee mobile devices.

### 2. 📺 Multi-Screen Matrix Routing
* **Hardware Display Detection**: Automatically identifies all connected physical monitors (HDMI, DisplayPort, USB-C, USB tablets, or Wireless Miracast/AirPlay).
* **1-Click Targeted Projection**: Route the **Stage & Pulpit Display to Screen 2** and the **TV / Overflow Screen to Screen 3** simultaneously with zero window dragging and zero browser pop-up prompts.

### 3. ⚡ Stage Cue Dispatcher & Emergency Strobe
* **Standard Banner Mode**: Dispatches polite, high-contrast prompt banners directly to the speaker's pulpit display.
* **Emergency Flashing Strobe Mode**: Triggers a high-visibility, full-screen red emergency strobe alert when a speaker urgently needs to wrap up.
* **1:1 Exact Matching**: Button cues (*"WRAP UP IN 1 MINUTE"*, *"STOP IMMEDIATELY"*, *"ADJUST MIC CLOSER"*, *"SPEED UP TEMPO"*) reflect identically on the pulpit screen.
* **Operator Hold**: Cues remain active on screen until explicitly dismissed using the *Clear Stage Overlay* button.

### 4. ⏱️ Live Event Execution & Autopilot
* **Smart Live Timer**: Ultra-high contrast count-up and countdown timer with over-budget negative counters.
* **Autopilot (Auto-Advance & Auto-Heal)**: Automatically transitions segments at zero, dynamically shaving overruns off remaining slots to protect hard curfews.
* **Tactical Controls**: Instant pause, resume, manual mode toggle, and live ±1 minute nudge adjustments.
* **Protected End Event Dialog**: Safety confirmation modal prevents accidental broadcast termination.

### 5. 📡 Collaborative Display Fleet
* **Stage & Pulpit Display (`/stage`)**: Clean, distraction-free oversized timer with tally borders and operator cue overlays.
* **TV / Overflow Screen (`/tv`)**: Left-hand live rundown schedule + right-hand on-air broadcast clock.
* **Crew Tactical HUD (`/crew`)**: Technical booth overview with sound/video readiness toggles and stage feedback.
* **Public Attendee Portal (`/public`)**: Mobile-optimized schedule preview for audience members with persistent access on concluded events.
* **Teleprompter (`/prompter`)**: Auto-scrolling dynamic outline synced directly to slot duration.

### 6. 👥 Dual-Engine Workspaces & Role-Based Access Control (RBAC)
* **Dual-Engine Architecture**:
  * **Local Workspace (This PC)**: Saves events directly as human-readable `.kairon` files on your hard drive. 100% offline, zero cloud calls, zero cloud tokens. The user operating the local PC is **always the Administrator (Local Owner)**.
  * **Cloud Workspaces (Convex)**: Real-time multi-device hub for team collaboration, stage synchronization, and public attendee QR access.
* **Workspace-Scoped Role Hierarchy**:
  * **🔴 Administrator (`admin`)**: Media Directors & Lead Pastors. Full authority over branding, team roles, billing, rundown creation, live controls, and hardware matrix outputs.
  * **🔵 Manager (`manager`)**: Show Callers & Service Coordinators. Full authority to construct rundowns and direct live shows; cannot alter billing or delete the organization.
  * **🟢 Operator (`operator`)**: Sound, Video, Lighting, and Prompter Crew. Operates live timers and acknowledges cues in the Tactical Crew HUD. Locked / read-only in Program Editor to prevent show-time errors.
  * **🟡 Speaker (`speaker`)**: Pastors, Preachers, and Guest Ministers. Clean, distraction-free pulpit display, auto-scrolling teleprompter, and notes view. All technical controls are hidden.

---

## 🚀 Quick Start & Development

### Web Development
```bash
# Install dependencies
npm install

# Start Vite dev server (http://localhost:3000)
npm run dev

# Run automated end-to-end tests
npx playwright test tests/scenarios.spec.ts --workers=1
```

### Desktop App Development
```bash
# Launch Kairon in desktop mode (Vite + Electron concurrently)
npm run electron:dev
```

---

## 📦 Building Native Desktop Installers

Kairon includes pre-configured cross-platform build scripts via `electron-builder`:

| Target Platform | Command | Generated Artifacts |
| :--- | :--- | :--- |
| **Windows** | `npm run electron:build:win` | `release/Kairon Setup 0.0.0.exe` & `release/Kairon 0.0.0.exe` (Portable) |
| **macOS** | `npm run electron:build:mac` | `release/Kairon.dmg` & `release/Kairon.zip` (Universal Apple Silicon & Intel) |
| **Linux** | `npm run electron:build:linux` | `release/Kairon.AppImage` & `release/kairon.deb` |

---

## 🤖 Automated CI/CD Releases (GitHub Actions)

Kairon includes an automated multi-OS release workflow (`.github/workflows/release.yml`).

To build and publish installers to your **GitHub Releases** page:
1. Tag a release commit:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
2. GitHub Actions will automatically spin up Windows, macOS, and Linux runners in parallel, package all three installer formats, and publish them to your GitHub Releases page for 1-click download.

---

## 🛠 Tech Stack

* **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons
* **Desktop Runtime**: Electron 44, Electron-Builder
* **Cloud & Real-Time Sync**: Convex Cloud Database & Serverless Functions
* **Testing & QA**: Playwright E2E Test Suite
* **AI Scheduling**: Google Gemini 2.0 Flash API

---

## 📄 License
Private & Proprietary — Developed for live production and church ministry broadcast environments.
