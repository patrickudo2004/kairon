# Kairon - Project Architecture (Phase 35)

## Project Overview
Kairon is a high-precision, real-time event management and countdown platform designed for churches, conferences, and live productions. It allows organizers to draft schedules, manage them live, and project them to viewers synchronously across multiple displays.

---

## Tech Stack
- **Frontend**: React 19 (Vite)
- **Backend & Real-time**: Convex (Cloud Functions, Real-time Database, Auth)
- **State Management**: Zustand (UI Store), React Query (Data Mutations), Convex Hooks (Data Fetching/Sync)
- **Styling**: Vanilla CSS (Premium "Glassmorphic" UI)
- **Icons**: Lucide React
- **AI Integration**: Google Gemini (via Convex Actions) for generating program drafts.
- **Utilities**: `react-qr-code`
- **Heavy Packages (Code-Split)**: `@react-pdf/renderer` and `recharts` are split into lazy-loaded chunks to optimize initial bundle sizes.

---

## Core Application Structure

### 1. Data Model (Convex Schema)
- **`organizations`**: Stores workspace details, including name, logo URL, and brand color.
- **`programs`**: Stores event details, status ('draft', 'live', 'concluded'), timer state, current slot index, and autopilot/auto-heal status.
- **`slots`**: Array within the program or linked documents for individual schedule items (title, speaker, duration, script details, etc.).
- **`stageMessages`**: Ephemeral messages for stage prompts and technical cues.

### 2. Live Synchronization Workflow
1. **Source of Truth**: All state (timer, current slot, hold status) is stored in Convex.
2. **Reactivity**: Components use `useQuery` (Convex) to subscribe to the program state. Any change made in the Admin Editor is instantly pushed to TV, Stage, Prompter, and Public displays.
3. **Timer Logic**: High-precision countdown is derived from `startTime` and `secondsElapsed` to ensure all devices show the exact same second regardless of network jitter. We clamp the elapsed calculation to \(\ge 0\) to resolve sub-second client-to-server clock drifts.
4. **Local Offline Fallback**: When the client goes offline, the editor uses `BroadcastChannel('kairon_offline_sync')` to propagate commands (Play, Pause, Next, Nudge) locally to adjacent monitors running on the same machine/LAN environment.

---

## Key Components & Hooks
- **`useUIStore`**: Manages global UI states like Dark/Light theme, Sidebar collapse, and active organization.
- **`LiveTimer`**: The primary interaction core for the live service. Supports the "Autopilot" (Auto-Heal) feature.
- **`CommandCenter`** (`/command`): A multi-track control grid showing active concurrent live programs, their status, countdown progress, and active operator widgets.
- **`PrompterDisplay`** (`/prompter`): A high-visibility interface designed for speakers, showing a synchronized countdown clock alongside auto-scrolling script outlines.
- **`TVView` / `StageDisplay`**: Specialized, high-visibility layouts for production monitors. Supports standard themes as well as high-contrast Pulpit Themes (`ambient-yellow` and `ambient-white`).
- **`PublicPortal`**: Zero-friction viewer access for attendees.

---

## Recent Architectural Improvements
- **Visual Clock Clamp**: Integrated client-side UI clamping filters in `useTimerSync.ts` and `useTimer.ts` to cleanly solve the `1:01` timer jump during transition states.
- **Deterministic Auto-Heal (Autopilot)**: Created a zero-token local auto-heal algorithm in `App.tsx` that redistributes slot overruns proportionally (or shaves from flex sessions first) without invoking external AI API calls.
- **Bundle Splitting**: Code-split the heavy `AnalyticsDashboard` and its PDF/chart engines from the core bundle, decreasing initial bundle size by ~2MB.
- **Local LAN Fallback**: Incorporated localStorage caching alongside offline broadcast channels to preserve presentation controls during network outages.

