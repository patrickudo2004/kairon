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
