# Cognito 2026 — Official Website

> **Welcome to Reality** • 19th Edition • International Commerce Fest  
> Organized by the Department of Professional Studies (DPS), CHRIST (Deemed to be University), Bengaluru.

---

## 🌟 Overview

This repository hosts the official frontend for **Cognito 2026**. Built with pure HTML5, modern CSS3 (animated gradient mesh, edge-lit glassmorphism, scroll reveals), and vanilla JavaScript. 

The site is designed for free, zero-maintenance hosting on **Cloudflare Pages**, with real-time fest-day data (live scores and timed case round releases) powered directly by **Google Sheets**.

---

## 📁 Project Structure

```text
cognito-website/
├── index.html                  # Homepage (Hero, Trailer, About, Gallery, Sponsors CTA)
├── rounds.html                 # Timed round releases & submission portal
├── scores.html                 # Live Contingent leaderboard with real-time search
├── sponsors.html               # Corporate sponsors and partner tiers
├── contact.html                # Organizing committee directory (Faculty & Student Reps)
├── config.js                   # Central configuration (Google Sheet URLs, links, contacts)
├── script.js                   # Client engine (CSV parser, live timers, scroll reveals)
├── styles.css                  # Design system (animated mesh, glassmorphism, responsive)
├── GOOGLE_SHEETS_TEMPLATE.md   # Event-day guide for managing the Google Sheet
└── assets/                     # Transparent brand logos and iconography
```

---

## ⚙️ How Event Day Works (No Code Touching Required!)

1. **Live Contingent Scores:**
   - Update team scores in your Google Sheet's `Scores` tab.
   - The live website automatically refreshes rankings every 60 seconds.

2. **Automated Round Releases:**
   - Add rows in the `Rounds` tab with `Release` and `Deadline` timestamps (IST).
   - The website automatically shows **Locked 🔒** with countdown timers, unlocks **Submission Buttons 🟢** when live, and closes entries once deadlines pass.

Refer to [`GOOGLE_SHEETS_TEMPLATE.md`](GOOGLE_SHEETS_TEMPLATE.md) for full setup instructions.

---

## 🚀 Deployment

The site is production-ready for **Cloudflare Pages**:
1. Connect this repository to your Cloudflare Pages dashboard.
2. Set build command to *None* (Static site).
3. Any push to `main` deploys live to the world in under 30 seconds!

---

© 2026 Department of Professional Studies, CHRIST (Deemed to be University).
