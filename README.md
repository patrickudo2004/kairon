# Kairon - Conference Timer

Kairon is a professional, cloud-powered conference time management application designed for event coordinators, AV teams, and speakers. It bridges the gap between planning and live execution with a synchronized real-time flow, AI-powered drafting, and robust multi-device coordination powered by Convex.

## 🌟 Key Features

### 1. **Live Event Execution**
   - **Smart Live Timer**: Large, high-visibility countdown for the current session.
   - **Auto-Advance**: Automatically transitions to the next slot when the timer hits zero.
   - **Smart Sync**: Automatically calculates the correct slot and time elapsed based on the scheduled start time. Real-time synchronization ensures all screens (TV, Stage, Admin) are perfectly aligned in sub-second latency.
   - **Manual Controls**: Play, Pause, Next, and Previous controls for on-the-fly adjustments.

### 2. **Advanced Program Editor**
   - **Drag-and-Drop Interface**: Reorder sessions intuitively by dragging rows.
   - **Time Budgeting**: Set a target end time and get real-time feedback on whether you are under or over budget.
   - **AI Drafting**: Integrated with Google Gemini API to convert raw text (emails, agendas) into structured schedules.
   - **Slot Management**: Duplicate existing slots, add detailed notes/abstracts, and categorize sessions (Keynote, Talk, Panel, Break).

   - **Real-Time Collaboration**: Changes made by any team member are instantly pushed to all other connected screens. No manual refreshing required.
   - **QR Code Generation**: Instantly generate QR codes for TV, Stage, or Public Portal views for easy scanning on mobile devices.

### 4. **Export & Persistence**
   - **PDF Export**: Generate professional, clean PDF schedules optimized for print (A4/Letter).
   - **Clipboard Copy**: One-click copy of the formatted text schedule for emails or documents.
   - **Multi-Program Management**: Create, delete, and duplicate entire programs via the Dashboard or Calendar.
   - **Auto-Save**: All work is automatically synced to the Convex cloud in real-time.

### 5. **User Experience**
   - **Theme Support**: Toggle between Light and Dark modes.
   - **Responsive Design**: Fully functional on desktops, tablets, and mobile devices.
   - **Calendar View**: visual overview of events across the month.

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript
- **Backend & Sync**: Convex (Cloud Functions, Real-time Database)
- **State Management**: Zustand, React Query
- **Styling**: Vanilla CSS, Lucide React (Icons)
- **Routing**: React Router DOM
- **AI Integration**: Google GenAI SDK (Gemini 2.0 Flash)
- **Utilities**: `react-qr-code`, `html2canvas`, `jspdf`

## 📖 How to Use

### Creating an Event
1.  **Dashboard**: Start from the Home screen or Calendar view.
2.  **Add Details**: Enter title, date, and start time.
3.  **Build Schedule**: Use the **Editor** to add slots manually or use the **AI Draft** button to paste a rough agenda.
4.  **Refine**: Drag slots to reorder, add specific details, or duplicate slots for similar sessions.

### Running an Event
1.  **Go Live**: Switch to the **Live** tab.
2.  **Auto-Start**: If the current time matches the scheduled start time, the timer will start automatically.
3.  **Monitor**: Use the **List** tab to see the full rundown while keeping an eye on the active slot.

### Sharing
1.  Click the **Share** icon in the header.
2.  Choose **Viewer Link** for attendees/AV or **Co-Editor Link** for colleagues.
3.  Copy the link or show/download the QR code.

## 💡 Important Note on Data

This application uses **Cloud-First Synchronization**. 
*   Your data is securely stored and synced via Convex.
*   Changes are pushed instantly to all active displays (TV, Stage, Portal).
*   Even if your connection drops, the app remains functional and syncs your changes as soon as you are reconnected.

## 🎨 Design System

The app follows a modern, clean aesthetic:
- **Light Mode**: Crisp white and slate grays with Indigo accents (`indigo-600`).
- **Dark Mode**: Deep slate backgrounds (`slate-950`) with high-contrast text for low-light conference environments.
- **Print Mode**: Uses a specific CSS print sheet (`@media print`) to hide UI elements and format the data as a legible table.
