# Kairon: Comprehensive User Scenarios & Access Matrix

This document outlines the operational flow of Kairon across five distinct industries and defines the permissions for all user roles.

---

## 🔐 User Access Matrix

| Role | Access Level | Capability | Typical User |
| :--- | :--- | :--- | :--- |
| **Admin** | **Full Ownership** | Create/Delete Orgs, Manage Team, Billing, Full Editor | Executive Producer, Head Pastor, Tour Manager |
| **Team Member** | **Co-Editor (Live)** | Full Editor access, Start/Stop/Next controls, Sync | Stage Manager, Wedding Coordinator, Sound Engineer |
| **Viewer (Internal)** | **ReadOnly (Live)** | TV Mode focus, Projector output, Live Sync | Preacher (on-stage monitor), Band (backstage), AV Crew |
| **Guest (Public)** | **Public Portal** | Path-based access (`/p/`), Realtime Living Schedule | Attendee, Wedding Guest, Concert Goer |

---

## 1. ⛪ Scenario: The Church Service
**Focus**: *Flow, AI rebalancing, and Stage displays.*

### Phase 1: Planning
The **Worship Pastor (Admin)** logs in on Tuesday to plan the "Sunday Morning Service." They use the **Editor** to add songs, prayers, and the sermon. Feeling that the transition from communion to the final hymn is too tight, they use the **Gemini AI Rebalance** feature to shave 30 seconds off each musical slot to give the preacher more breathing room.

### Phase 2: Tech Setup
On Sunday morning, the **Tech Director (Member)** opens Kairon on three screens:
1.  **FOH Monitor**: The standard Editor to manage the flow.
2.  **Backstage TV (Projector Mode)**: A large monitor for the band and choir to see "Next Slot."
3.  **Preacher's Confidence Monitor**: A tablet on the pulpit showing only the **Live Countdown**.

### Phase 3: The Live Service
As the service begins, the Tech Director clicks **Start**.
-   During the sermon, the preacher sees the **Live Bar** turning Amber as they reach the last 2 minutes.
-   The **Worship Leader** backstage watches the **Floating Status Bar** on their phone to know exactly when to walk back on stage.
-   **Congregants** scan a QR code on the bulletin to open the **Public Portal**, seeing the "Living Schedule" with the real-time "Pulse."

### Phase 4: Post-Service
The Admin exports the **Service Report (PDF)** to archives, documenting the exact timestamps of when items actually finished for future planning.

---

## 2. 🎤 Scenario: The Large-Scale Conference
**Focus**: *Multi-team management and Guest transparency.*

### Phase 1: Planning
The **Conference Founder (Admin)** creates a "Kairon Organization" for the 2026 Summit. They invite **3 Track Managers (Members)** to the team. Each manager builds their respective track schedule (Track A, Track B, Track C) within the same workspace.

### Phase 2: Distribution
The marketing team generates the **Public Portal Link** and embeds it into the official conference app. They also use the **Custom Branding** tab to ensure the portal's colors match the conference logo.

### Phase 3: The Event
Throughout the 3-day event:
-   5,000 Attendees use the **Up Next** carousel on their phones to decide which track to jump to next.
-   When a keynote speaker finishes early, the Admin hits **Next**; instantly, every attendee's phone updates to show the coffee break has started.
-   During a high-security private session, the Admin toggles **Hold Mode**, showing a "Private Session in Progress" overlay to public viewers.

---

## 3. 💍 Scenario: The Destination Wedding
**Focus**: *Stress reduction and Guest experience.*

### Phase 1: Planning
The **Wedding Planner (Member)** creates a program for "The Smith Wedding." They list everything from "Arrival of Guests" to "First Dance." 

### Phase 2: Guest Onboarding
The Couple shares a clean Kairon link (`/p/smith-wedding`) on their physical invitations. 

### Phase 3: The Big Day
-   **The Planner**: Manages the toasts from their phone. If the Maid of Honor goes 5 minutes over her allotted time, the planner sees the **Overrun Timer** and can discreetly tell the catering staff to delay the main course by 5 minutes.
-   **The Guests**: While at the cocktail hour, guests check the link to see "Up Next: Grand Entrance." They see the countdown and know they have exactly 4 minutes to finish their drinks.

---

## 4. 🎸 Scenario: The Rock Concert / Tour
**Focus**: *Backstage precision and Curfew management.*

### Phase 1: Planning
The **Tour Manager (Admin)** sets the setlist. They define each song as a "Slot" with precise durations.

### Phase 2: Synchronization
The **Lighting and Sound Engineers (Members)** use the **Live Sync** to stay perfectly aligned with the band's progress.

### Phase 3: The Show
-   The Band uses **TV Mode** monitors side-stage to see exactly how much time is left in the set before the local venue's noise curfew kicks in.
-   The "Roadies" watch the **Up Next** list so they are ready with the acoustic guitar for the specific transition at Slot 14.
-   **VIP Fans** are given a private Kairon link to see the setlist order in real-time as the show progresses.

---

## 5. 🤝 Scenario: The Global Corporate Summit
**Focus**: *Executive reporting and Multilingual Support.*

### Phase 1: Planning
An **Executive Assistant (Admin)** prepares the "Annual Global Strategy Summit." They use the **Internal User Guide** to train other assistants on how to manage the real-time flow.

### Phase 2: Professional Export
Before the summit, they export a high-density **Production PDF** for all VIPs and moderators.

### Phase 3: The Summit
-   High-level Executives use the **Floating Bar** on their tablets to track the time of the current Q&A session.
-   The Admin uses the **Organization Manager** to silo data between the "Public" sessions and the "Executive-Only" sessions.
-   Real-time **Hold Messages** are used to provide "Technical Difficulty" or "Lunch Break" updates globally across the public links.

### Phase 4: Data Analysis
Post-summit, the Admin reviews the **Local Sync** logs to see where bottlenecks occurred in the schedule, using this data for the next quarter's planning.
