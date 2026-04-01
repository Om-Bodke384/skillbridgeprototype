# SkillBridge — Student Opportunity Platform

A student opportunity platform built for GCOERC Nashik, connecting students with domain communities, mentors, internships, and real local projects.

## Project Structure

```
skillbridge/
├── index.html          ← Single-page application entry point
├── css/
│   ├── global.css      ← Design tokens, reset, typography, layout utilities
│   └── components.css  ← All component-specific styles
├── js/
│   ├── data.js         ← All platform data (domains, jobs, mentors)
│   └── app.js          ← Core application logic & routing
├── pages/              ← Reserved for future multi-page expansion
└── assets/             ← Add images, icons, logos here
```

## How to Run

Simply open `index.html` in any modern web browser. No server or build step required.

## Customisation Guide

### Adding a new domain community
Open `js/data.js` and add a new object to the `DOMAINS` array following the same structure.

### Adding internships / jobs
Open `js/data.js` and add entries to the `JOBS` array. The `domain` field must match an existing domain `id`.

### Adding mentors
Open `js/data.js` and add entries to the `MENTORS` array.

### Connecting a real backend
All TODO comments in `js/app.js` mark the exact spots where real API calls should replace the mock logic:
- `handleLogin()` — replace with real auth call
- `handleSignup()` — replace with real registration call
- `renderLeaderboard()` — fetch from `/api/leaderboard`
- `renderDashboard()` — fetch user data from `/api/user/me`

### Updating stats on the homepage
The live student count (`statStudents`) is intentionally left as `—`. Replace with a fetch call to your backend.

## Tech Stack

- Vanilla HTML5, CSS3, JavaScript (ES6+)
- Google Fonts: Fraunces (display) + Instrument Sans (body)
- No frameworks. No build tools. Just open and run.


