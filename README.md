# Cognito 2026 — Official Website & Platform Engine

> **"Welcome to Reality"** • 19th Edition • International Commerce Fest  
> Organized by the Department of Professional Studies (DPS), CHRIST (Deemed to be University), Bengaluru.

---

## 🌟 Overview

This repository houses the official web portal and event engine for **Cognito 2026**. Engineered with vanilla web technologies (HTML5, modular CSS3, vanilla ES2020+ JavaScript) and serverless edge API micro-proxies, the platform delivers zero-latency visual design and real-time fest-day orchestration without expensive backend infrastructure.

All fest-day dynamics—including real-time Contingent leaderboards, timed problem statement unseals, and live trailer streaming—are administered directly through a **Google Sheets Control Panel**.

---

## 🏗️ Architecture & Core Systems

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        COGNITO 2026 PLATFORM                           │
├────────────────────────────────────────────────────────────────────────┤
│  Browser Client (Vanilla HTML / CSS / JS)                             │
│  ├── Canvas Engine: 60 FPS Particle Mesh & CRT Scanline Drift          │
│  ├── Sound Engine: Web Audio API Synthesizer (Mechanical UI Clicks)     │
│  ├── Temporal Engine: IST (UTC+05:30) Multi-Format Date/Time Anchoring  │
│  └── UI Engine: Editorial Split-Dossier & FLIP Animated Bar Chart      │
├────────────────────────────────────────────────────────────────────────┤
│  Edge Proxies & Security Layer                                         │
│  ├── Cloudflare Pages Functions (/functions/api/*)                      │
│  ├── PHP 8.x Fallback Micro-Proxies (/api/*)                           │
│  ├── Node.js Standalone Dev Server (server.js)                         │
│  └── Security Suite: Score Scrubber, RFC-4180 CSV, Strict CSP, XSS Guard│
├────────────────────────────────────────────────────────────────────────┤
│  Data Source                                                           │
│  └── Google Sheets Published CSV (Scores, Rounds, Trailer)             │
└────────────────────────────────────────────────────────────────────────┘
```

### 1. Editorial Split-Dossier System (`rounds.html`)
- **Multi-Round Accordions**: Organizes multiple competitive exhibits per round into structured, expandable dossiers.
- **Day Sub-Filtering**: Interactive `Day 1` / `Day 2` / `Day 3` sliding pill glider for Contingent tracks with automatic responsive sync.
- **Horizontal Exhibit Chip Rail**: Responsive scrolling exhibit rail ensuring smooth navigation on mobile screens without squishing.
- **Automated State Machine**: Live countdown timers compute unseal states (`LOCKED 🔒`, `UNSEALED 🟢`, `CLOSED ⏳`) with automatic unlocking of problem brief PDFs and submission forms.

### 2. Live Scores & Leaderboard Engine (`scores.html`)
- **FLIP Layout Transitions**: First-Last-Invert-Play animated ranking bars with smooth CSS transitions when ranks shift.
- **Debounced Instant Search**: Sub-millisecond team and college filtering with zero layout jitter.
- **Podium Tiering**: Automatic detection and distinct visual styling for 1st (Gold), 2nd (Silver), and 3rd (Bronze) places.

### 3. Multi-Format Temporal Engine (`script.js`)
- **IST (UTC+05:30) Time Anchoring**: All parsed dates and timestamps are anchored to Indian Standard Time regardless of the participant's physical device timezone.
- **Flexible Timestamp Parsing**: Accommodates `DD/MM/YYYY` vs `MM/DD/YYYY`, 24-hour (`15:30`) and 12-hour AM/PM formats (`3:30 PM`), and deadline inheritance when `DeadlineDate` is omitted.

### 4. Edge Security & Data Privacy Suite
- **Score Scrubber**: Cloudflare Pages functions (`/functions/api/scores.js`) and PHP proxies (`/api/scores.php`) compute relative percentage ratios on the server side and scrub raw numerical marks from public network responses, preventing score sniffing via browser DevTools.
- **Confidentiality Filtering**: Unreleased cases with `Show !== 'Yes'` are eliminated at the proxy edge before CSV data reaches participant browsers.
- **Protocol Sanitization**: All external links (`BriefLink`, `SubmitLink`, trailers) undergo rigorous URL sanitization to eliminate `javascript:` and `data:` XSS vectors.
- **Production Headers**: Strict Content-Security-Policy (CSP), `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, and directory-traversal guards across both `.htaccess` and `server.js`.

---

## 📁 Repository Structure

```text
cognito-website/
├── index.html                  # Homepage (Hero, Live Trailer, About DPS/CHRIST/PFC, Gallery)
├── rounds.html                 # Editorial Split-Dossier & Timed Submission Portal
├── scores.html                 # Live Contingent Leaderboard with FLIP animations
├── sponsors.html               # Corporate sponsors & startup partner directory
├── contact.html                # Organizing Committee directory & interactive map
├── config.js                   # Central client configuration (Sheet URLs, Cutoffs, Contacts)
├── script.js                   # Client engine (Temporal parser, canvas, audio, FLIP, UI)
├── styles.css                  # Production design system (~85KB, cardless editorial theme)
│
├── functions/api/              # Cloudflare Pages Functions (Edge Serverless Proxies)
│   ├── rounds.js               # Confidential round filter + RFC-4180 parser
│   ├── scores.js               # Server-side score scrubber + percentage calculator
│   └── trailer.js              # YouTube trailer ID resolver & 60s edge cache
│
├── api/                        # PHP 8.x Fallback Proxies (For Apache / cPanel / Shared Hosting)
│   ├── rounds.php              # Multi-line fgetcsv stream parser
│   ├── scores.php              # Score scrubbing & relative ratio calculator
│   └── trailer.php             # Trailer endpoint with 30s cache
│
├── server.js                   # Zero-dependency Node.js local development & staging server
├── CognitoAppsScript.js        # Instant Google Apps Script backend engine (0s sync delay)
├── .htaccess                   # Apache production rules (CSP, nosniff, API URL rewrites)
├── .gitignore                  # Git hygiene rules (Dependencies, caches, OS files)
├── sample-rounds.csv           # Reference CSV schema matching Google Sheets staging
│
├── Event_Day_Guide.md          # Fest-day operations manual for the student organizing committee
├── GOOGLE_SHEETS_TEMPLATE.md   # Setup guide for the Google Sheets Control Panel
└── assets/                     # Brand assets, sponsor logos, and optimized webp gallery
```

---

## 🚀 Getting Started & Local Development

### Option A: Built-in Node.js Server (Recommended)
The repository includes a zero-dependency local development server that mirrors Cloudflare Pages API rewrites and edge caching:

```bash
# Start server on http://localhost:3000
node server.js

# Or start on a custom port
PORT=8080 node server.js
```

### Option B: Cloudflare Wrangler (Pages Simulation)
To test Cloudflare Pages Functions locally using Wrangler:

```bash
npx wrangler pages dev .
```

### Option C: Any Static HTTP Server
If you only need to preview frontend layouts without edge proxies:

```bash
# Python 3
python -m http.server 3000

# Node.js npx serve
npx serve .
```

---

## 🌐 Production Deployment

### 1. Cloudflare Pages (Recommended)
1. Push the repository to GitHub.
2. In the Cloudflare Dashboard, navigate to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
3. Select the repository:
   - **Framework preset**: `None`
   - **Build command**: Leave blank
   - **Build output directory**: Leave blank / root (`.`)
4. Click **Save and Deploy**. Cloudflare automatically activates the edge proxies located in `/functions/api/`.

### 2. Traditional Apache / cPanel / Shared Hosting
1. Upload the entire project directory to `public_html`.
2. Ensure `mod_rewrite` and `mod_headers` are enabled in Apache.
3. The included [`.htaccess`](.htaccess) will automatically route API requests to the PHP micro-proxies in [`/api/`](api/) and apply all security headers.

---

## 📋 Fest-Day Operations (No Code Required)

All live updates during the fest are operated via Google Sheets:
- **Leaderboard updates**: Edit the `Scores` tab in Google Sheets. Changes propagate to participants automatically every 60 seconds.
- **Round releases**: Add rows in the `Rounds` tab with `ReleaseDate`, `ReleaseTime`, `DeadlineDate`, and `DeadlineTime`.
- **Hiding/Unhiding rounds**: Set the `Show` column to `Yes` or `No`.

For step-by-step instructions, see:
* [**Event Day Guide**](Event_Day_Guide.md) — Quick reference for the event control desk.
* [**Google Sheets Setup Guide**](GOOGLE_SHEETS_TEMPLATE.md) — Initial sheet creation and column specification.

---

## 🛡️ Security & Reliability Standards

- **Zero Client Clock Exploitation**: Countdown unlock states are calculated with IST offsets.
- **RFC-4180 Compliant Parsing**: Multi-line CSV cells and escaped quotes are handled properly without data corruption.
- **CSP Compliance**: Inline style and script hashes are maintained, external resources are strictly whitelisted to Google Fonts and YouTube embeds.
- **Accessibility & Performance**: Preconnected web fonts, asynchronous image decoding, keyboard tab navigation, and ARIA state attributes.

---

## 📄 License & Credits

Designed and developed for **Cognito 2026** by the **Department of Professional Studies (DPS)**, CHRIST (Deemed to be University), Bengaluru.  
All brand trademarks and logos belong to their respective organizations.
