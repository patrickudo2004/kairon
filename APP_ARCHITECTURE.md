# Kairon - Project Documentation (Current State)

## Project Overview
Kairon is a high-precision, real-time event management and countdown platform designed for churches, conferences, and live productions. It allows organizers to draft schedules, manage them live, and project them to viewers synchronously.

---

## Tech Stack
- **Frontend**: React (with Vite)
- **Styling**: Tailwind CSS + Lucide Icons (Modern, "Glassmorphic" UI)
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime Channels + BroadcastChannel (for local synchronization)
- **Persistence**: Hybrid (Supabase + Browser LocalStorage fallback)
- **State Management**: React State + React Query (Data fetching/mutations) + Zustand (UI Store)
- **AI Integration**: Google Gemini (via `geminiService.ts`) for generating program drafts.

---

## Core Application Structure

### 1. Database Schema (`programs` table)
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID (PK) | Unique identifier for the program |
| `title` | TEXT | Main event name |
| `subtitle` | TEXT | Description/Theme |
| `date` | DATE | Event date |
| `start_time` | TEXT | "HH:mm" 24h format |
| `end_time` | TEXT | Target finish time |
| `current_slot_index` | INT | The index of the active speaker/session |
| `is_timer_active` | BOOL | Current running state of the countdown |
| `timer_start_timestamp`| BIGINT | Unix timestamp (ms) when the current slot started |
| `seconds_elapsed` | INT | Seconds used (used for pausing) |

### 2. User Process (Workflow)
1. **Creation**: User creates an event manually or via **AI Draft** (pasting an agenda).
2. **Setup**: Slots are added with title, speaker, and duration. A "Target End Time" provides a budget indicator.
3. **Live Operation**:
    *   **Editor**: Hits "Start". The app records the timestamp.
    *   **Sync**: The app broadcasts the update to Supabase and Local Broadcast channels.
    *   **Viewer (TV/Projector)**: Reaches the URL (with `id=...`) and instantly calculates the current time based on the shared timestamp.
4. **Conclusion**: When all slots finish, the app displays an "All Done" summary.

---

## Key Features & Hooks
- **`useLocalSync`**: Syncs state across different tabs of the same browser without hitting the network.
- **`realtimeService`**: Manages Supabase realtime subscriptions so remote viewers see updates with <100ms latency.
- **`programService`**: Handles CRUD and the specialized "Timer State" updates (debounced to 5s to save API costs).
- **`TVView`**: A cleaned-up, high-visibility layout for projection or streaming overlays.

---

## Recent Architectural Changes
- **ID Preservation**: The application now forces the `id` of the program into the URL. This is critical for stateless recovery on browser refresh.
- **Hybrid Sync**: The app uses `localStorage` for millisecond-level recovery on the same device and Supabase for cross-device/remote persistence.
