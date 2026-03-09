# Assignment-tracker
📚 Assignment Tracker
A clean, dark-themed academic planner built with React for tracking homework assignments across 5 courses. Features desktop browser notifications, priority levels, due date warnings, and persistent local storage.
Show Image
Show Image
Show Image

✨ Features

5 course tabs — Honors Principles of Engineering, AP Calculus AB, AP Physics C, AP Seminar 2, Spanish 6
Task cards with name, description, due date, priority level, and course badge
Smart due date badges — color-coded warnings for overdue, today, tomorrow, and within 3 days
Desktop notifications — browser alerts when assignments are due or coming up
Priority system — Low / Medium / High with distinct color coding
Complete & remove — one-click ✓ button with smooth slide-out animation
Persistent storage — tasks saved to localStorage, survive page refreshes
Auto-sorted — tasks ordered by nearest due date automatically


🖥️ Preview

Dark academic aesthetic — deep navy background, blue accents, Crimson Pro serif typography, monospace labels.


🚀 Getting Started
Prerequisites

Node.js v18 or higher
npm (comes with Node.js)

Installation
bash# 1. Clone the repo
git clone https://github.com/your-username/assignment-tracker.git
cd assignment-tracker

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
Then open http://localhost:5173 in your browser.
Build for Production
bashnpm run build
The output will be in the dist/ folder, ready to deploy.

🌐 Deployment
Netlify (Recommended — Free)

Run npm run build
Go to netlify.com and sign up
Drag and drop the dist/ folder onto the Netlify dashboard
Get a live URL instantly — e.g. https://your-tracker.netlify.app

Vercel
bashnpm install -g vercel
vercel

🔔 Notifications
The app uses the Web Notifications API to send desktop alerts.
To enable:

Click the 🔔 Enable Alerts button in the top-right corner
Allow notifications when prompted by your browser
The app checks for upcoming tasks every 60 seconds while the tab is open

When you'll be notified:
ConditionAlertTask is overdue⚠️ Overdue!Task is due today📅 Due Today!Task is due tomorrow⏰ Due TomorrowTask is due within 3 days🔔 Due in X Days

Note: The browser tab must be open for notifications to fire. For background notifications (tab closed), a Service Worker would be required.


🗂️ Project Structure
src/
└── App.jsx        # Main app — all components, logic, and styles
This is intentionally a single-file app for simplicity. If you want to extend it, a good next step is splitting it into:
src/
├── App.jsx
├── components/
│   ├── TaskCard.jsx
│   ├── AddTaskModal.jsx
│   ├── ClassTabs.jsx
│   └── DueBadge.jsx
└── utils/
    ├── dates.js
    └── notifications.js

🛠️ Built With

React — UI framework
Vite — build tool and dev server
Crimson Pro + DM Mono — Google Fonts
Web Notifications API — native browser notifications
localStorage — client-side data persistence


📋 Courses
CourseShortColorHonors Principles of EngineeringHPEBlue #5B9CF6AP Calculus ABCALCLight Blue #7EB8D4AP Physics CPHYSPurple #A78BCAAP Seminar 2SEMGreen #7BC4A0Spanish 6ESPRed #E08080

📄 License
MIT — free to use, modify, and distribute.
