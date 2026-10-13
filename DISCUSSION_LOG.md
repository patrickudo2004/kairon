# Kairon - Discussion Log

This file serves as a persistent record of architectural decisions, feature discussions, and strategic planning for the Kairon application.

---

## 2025-12-24: Timer Synchronization & Database Persistence
**Objective**: Fix timer desync on page refresh and enable multi-device live tracking.

### Key Outcomes:
- **Local Persistence**: Implemented `localStorage` to allow instant recovery of timer state on the same device after a browser refresh.
- **Database Persistence**: Integrated Supabase `programs` table for storing `is_timer_active`, `current_slot_index`, `timer_start_timestamp`, and `seconds_elapsed`.
- **URL Management**: Updated the app to preserve the `?id=` parameter in the URL. This ensures that on refresh, the app knows which program to load, preventing the "All Done" screen (which was caused by loading an empty default program).
- **Auto-Sync**: Any tab or device joining an active program now automatically catches up to the live time based on the database timestamp.

---

## 2025-12-24: Product Vision & Scaling (Strategic Discussion)
**Objective**: Planning for "Kairon 2.0" featuring manual controls, analytics, and monetization.

### Key Concepts:
- **Manual Mode**: A proposed "Production Mode" where the timer counts into the negative (Red) until a human clicks "Next". This allows for accurate measurement of "Actual" time used vs. "Planned" time.
- **Analytics Integration**: Utilizing the `Analytics.tsx` component to provide Pastors/Conference Leads with data on schedule adherence.
- **Market Expansion**: Shifting the positioning from "Church Timer" to a "Universal Production Clock" for weddings, corporate conferences, and live events.

### Monetization Ideas:
- **Free**: Basic timer, local storage, 3 programs.
- **Pro**: Database sync, Analytics, Manual Mode, Stage Display view.
- **Enterprise/Org**: Custom branding (remove Kairon logo), Shared Workspaces, Role-based access control.

### User Management:
- **Auth Strategy**: Implementation of Supabase Auth (Google OAuth + Magic Links).
- **Security**: Transitioning to Row-Level Security (RLS) so users only see/edit their own events.

---

## 2026-02-20: Kairon 2.0 - From Timer to Production Suite
**Objective**: Scalability planning for Organizations, Roles, and Real-time Stage Management.

### Core Strategic Pillars:
1. **The Organization Model**:
    - **Shift**: Move from one-off local events to persistent Organizations.
    - **Revenue**: Organizations are free; **Branding (Logos/Themes)** and **Role-Based Access** (Operator vs Manager) are the primary paywalls.

2. **The "Killer" Production Toolset**:
    - **Prompter Messaging**: Real-time "Stage-to-Operator" messaging (Supabase Realtime) to allow AV teams to send discrete cues to speakers (flashing red text under the timer).
    - **Speaker Dashboard**: Lightweight, read-only dashboards for guests with their specific notes/scripts and personal countdown.
    - **Actual vs Planned Analysis**: Advanced reporting on schedule adherence, categorized by slot types (e.g., Worship vs Sermon).

3. **Strategic Roadmap**:
    - **Phase 1**: Identity (Supabase Auth - Google/Email).
    - **Phase 2**: Ownership (Organization structure & Branding).
    - **Phase 3**: Production (Prompter Messaging & Speaker Views).
    - **Phase 4**: Market Expansion (Reports, Ticketing investigation).

---

## 2026-10-13: Production Architecture, Offline Strategy, Mobile Projection & SaaS Monetization
**Context**: Kairon is in active live production use at Winners Chapel Manchester with praise from pastors and media crew. `main` branch is locked to protect live services (including upcoming Midweek and Sunday services). All new development, testing, and debugging moved to the dedicated `develop` branch.

### 1. Offline & Databaseless Execution Architecture
* **RAM (Execution) vs. Disk (Storage)**:
  - An offline version does not require a database server at all.
  - Runtime clock calculation operates in computer RAM via pure epoch math: `timeLeft = plannedDuration - (Date.now() - anchorTimestamp)`.
  - Data persists on disk as portable `.kairon` / `.json` files inside `Documents/Kairon/Workspaces/<OrgName>/<Year>/<Month>/`.
* **Multi-Screen Sync Without a Database**:
  - Main operator window communicates to secondary screens (Screen 2: Pulpit, Screen 3: TV) on the same machine via **Electron IPC (Inter-Process Communication)** or **`BroadcastChannel`** in memory in < 1 millisecond.
  - Optional local Wi-Fi WebSocket relay enables stage tablets (iPads/Android) to sync across the local church router even if the venue's internet drops.

### 2. Cloud vs. Local: The "Local-First Relay" Strategy
* **Maintain Convex for Identity & Global Sync**:
  - Convex remains the central cloud engine for authentication (Google OAuth, email), multi-user roles, Stripe billing status, and mobile/tablet synchronization.
  - Desktop app operates as a "Local-First Relay": executes math locally, powers HDMI outputs with 0ms latency, and asynchronously syncs slot actuals and history to Convex when online.

### 3. Mobile Device Projection (Android & iOS for Budget Venues)
* **Wired Output (USB-C to HDMI)**:
  - iOS (USB-C iPhone 15+ & modern iPads): Supports external display output and dual-screen app views (Controls on device, clean stage timer on external display).
  - Android: Devices supporting DisplayPort Alternate Mode (e.g. Samsung DeX) turn phones into full desktop operating systems with extended displays.
* **The Web-Native "No Cables" Approach (Recommended for Budget Churches)**:
  - Stage screen runs via Smart TV browser, $20 Amazon Fire Stick, or Chromecast loading `https://kairon.app/stage?id=...`.
  - The operator or pastor controls everything from their Android phone or iPhone in their hand. Zero cables, zero adapters.

### 4. Market Landscape & Pricing Model
* **Competitive Analysis**:
  - *Shoflo*: Enterprise-only, $1,000–$3,000+/year, quote-based.
  - *Stagetimer.io*: $15–$17.50/month ($180–$210/year) for Pro; $40+/mo for Premium.
  - *Rundown Studio*: $29–$49/month.
  - *Ontime*: Open-source, requires technical installation/routing.
* **Kairon's Competitive Moat**:
  - Autopilot (Deterministic schedule auto-healing protecting curfew).
  - Zero-drag 1-click multi-screen matrix routing (Screen 2 Pulpit, Screen 3 TV).
  - High-contrast Pulpit Themes (Ambient Yellow & Ambient White) penetrating stage spotlights.
  - Emergency red strobe alert and silent cue dispatcher.
* **Recommended Packaging Strategy**:
  - **Community Tier (Free)**: Web-only, single active program, "Powered by Kairon" watermark.
  - **Pro Tier ($9.99/mo or $99/yr)**: Full Desktop App (Win/Mac/Linux), 100% offline resilience, custom church branding (remove watermark), multi-screen matrix, Autopilot, cue dispatcher, teleprompter, and PDF reports.
  - **Campus / Enterprise Tier ($24.99/mo or $249/yr)**: Command Center multi-track live monitoring for multi-room/multi-campus churches, RBAC.
  - **Weekend Pass ($19 one-time)**: 7-day Pro access for one-off conferences and weddings.
* **Licensing Rule**: 14-day silent grace period; never lock out a user or disrupt a live service on a Sunday or Wednesday.

### 5. Immediate Next Steps & Workflow Order
1. **Safeguard Active Production**: Keep `main` frozen. Service prep for Wednesday Midweek and upcoming Sunday proceeds on production.
2. **Current Bug Fixes First**: Resolve existing UI/UX and timing stops within the current app on `develop` before building new offline/desktop features.
3. **Desktop Google OAuth**: Implement external browser OAuth loop via system shell to resolve Google's embedded webview block.
4. **Offline Desktop App**: Build local JSON workspace loader and IPC relay once existing app bugs are resolved.

