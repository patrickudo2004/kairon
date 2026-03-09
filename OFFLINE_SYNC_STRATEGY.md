# Kairon: Offline Sync & Security Strategy (2026)

This document outlines the high-level architecture for implementing a "Local-First" experience that keeps data secure and synchronized between local files and the Convex cloud.

---

## 1. The Sync Engine: "The Convex Anchor"
To ensure the `.kairon` file and the Convex database stay in perfect alignment, we use a **Delta Sync** approach.

*   **LWW (Last Write Wins)**: Every slot and program record includes a high-precision `lastEdited` timestamp.
*   **The Change Ledger**: While offline, the app records a "ledger" of local actions (e.g., *"Edited Slot 5 duration"*).
*   **Reconnection Logic**: 
    1.  The app detects internet restoration.
    2.  It sends the local ledger to a **Convex Action**.
    3.  Convex compares timestamps. If no cloud changes occurred, it applies the updates.
    4.  **Conflict Resolution**: If the cloud version is newer, the user is prompted to *"Keep Local"* or *"Sync from Cloud."*

---

## 2. Security: "Signed Bundles & Local Identity"
Strict access to organizations must be maintained even when the user is disconnected.

*   **Encrypted Bundles**: Offline data is not stored as raw JSON. It is an **Encrypted Bundle** stored on the user's disk.
*   **Identity Persistence**:
    *   **The Key**: The decryption key is stored in the browser's **Secure Storage (IndexedDB/OPFS)**, managed by the Auth provider (Convex/Auth).
    *   **The Guard**: The PWA checks for a valid (unexpired) session token before unlocking the local folder.
    *   **The Kill-Switch**: Logging out online immediately wipes the local decryption keys, rendering the offline files unreadable.

---

## 3. The "Syncing Organizations" Workflow

1.  **Preparation**: User plans a service at home. Kairon saves to a local `.kairon` file and pushes a copy to Convex.
2.  **The Hand-off**: The Tech Team at the church opens Kairon. Convex pushes the latest JSON to their local machine instantly (caching for safety).
3.  **The Incident**: Church Wi-Fi dies mid-service. 
4.  **The Result**: Kairon switches seamlessly to the **Local Cache**. The timer continues, the Stage Display stays live, and "Offline" mode is indicated in the UI.

---

## 🚀 Strategic Advantage
By implementing this, Kairon becomes the **most resilient production tool** on the market. Most competitors are either "Web-Only" (fragile) or "Local-Only" (hard to collaborate). 

**Kairon bridges both worlds: The collaboration of Google Docs with the reliability of a local hard drive.**
