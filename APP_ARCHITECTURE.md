# Kairon - Project Architecture (Phase 34)

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
- **Utilities**: `react-qr-code`, `html2canvas`, `jspdf`

---

## Core Application Structure

### 1. Data Model (Convex Schema)
- **`organizations`**: Stores workspace details, including name, logo URL, and brand color.
- **`programs`**: Stores event details, status ('draft', 'live', 'concluded'), timer state, and current slot index.
- **`slots`**: Array within the program or linked documents for individual schedule items (title, speaker, duration, etc.).
- **`stageMessages`**: Ephemeral messages for stage prompts and technical cues.

### 2. Live Synchronization Workflow
1. **Source of Truth**: All state (timer, current slot, hold status) is stored in Convex.
2. **Reactivity**: Components use `useQuery` (Convex) to subscribe to the program state. Any change made in the Admin Editor is instantly pushed to TV, Stage, and Public displays.
3. **Timer Logic**: High-precision countdown is derived from `startTime` and `secondsElapsed` to ensure all devices show the exact same second regardless of network jitter.

---

## Key Components & Hooks
- **`useUIStore`**: Manages global UI states like Dark/Light theme and Sidebar collapse.
- **`LiveTimer`**: The primary interaction core for the live service.
- **`TVView` / `StageDisplay`**: Specialized, high-visibility layouts for production monitors.
- **`PublicPortal`**: Zero-friction viewer access for attendees.

---

## Recent Architectural Improvements
- **Convex Migration**: Replaced Supabase and LocalStorage snapshots with a unified real-time cloud backend.
- **ID Harmonization**: Implemented robust mapping between Convex's internal `_id` and the frontend's expected `id` field.
- **Multi-View Status**: Unified the "Draft" vs "Concluded" logic across all display components to prevent premature "All Done" screens.
- **Integrated User Guide**: Moved the documentation from a public bypass into the main app shell for a seamless UX.
