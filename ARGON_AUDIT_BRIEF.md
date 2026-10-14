# System Architecture & Audit Specification: Cognito 2026
> **A Comprehensive Guide for AI Auditors (Argon), Security Analysts, and Technical Reviewers**  
> *Target Deployment:* `cognito.christuniversity.in` • Department of Professional Studies (DPS), CHRIST (Deemed to be University), Bengaluru

---

## 1. Executive Summary & Purpose of this Document

This document defines the **architectural goals, non-negotiable constraints, intentional design decisions, and security models** of the Cognito 2026 web platform. 

If you are auditing this codebase (e.g. as **Argon**), **read this document first**. Standard automated linters and generic SaaS audit templates often generate *false positives* or recommend changes (e.g., introducing Node/React build steps, removing serverless proxies, or disabling score scrubbing) that directly violate the physical deployment requirements of the university hosting environment.

---

## 2. Mission & Operational Context

* **What is Cognito?** Cognito is an annual international commerce and management fest hosted by the Department of Professional Studies (DPS) at CHRIST (Deemed to be University), Bengaluru.
* **Who uses the platform?**
  1. **Hundreds of collegiate competitors** across India accessing live problem briefs, submitting rounds, and viewing leaderboards simultaneously on campus Wi-Fi or mobile data.
  2. **Fest Control Room & Student Coordinators** administering rounds, deadlines, live YouTube trailer streams, event brochures, and live leaderboard points directly via **Google Sheets**.
  3. **University IT Department** deploying the static package onto central college servers (`cognito.christuniversity.in`).

---

## 3. Non-Negotiable Architectural Constraints

### 3.1. Zero-Build, Vanilla Web Stack (Strict Requirement)
* **Stack:** Pure HTML5, Modular CSS3 (with CSS Custom Properties), and Modern Vanilla ES2020+ JavaScript.
* **Why no React, Vue, Vite, Next.js, or Webpack?**  
  The university IT department and student handoff workflow require **direct file hosting** on Apache/cPanel shared university hosting. The college servers do not maintain Node.js build daemons, CI/CD runners, or npm environments. Any solution requiring an `npm run build` or compilation step breaks university maintainability.
* **Offline & Direct Inspection:** Any coordinator or faculty member can inspect or patch any file in a simple text editor and upload via FTP/cPanel File Manager instantly.

### 3.2. Public Client-Side Configuration Model (`config.js`)
* `config.js` is loaded directly by client browsers.
* **Why are API URLs in `config.js`?**  
  The Google Apps Script Web App URL and Cloudflare/PHP proxy endpoints are **public, read-only endpoints**. Exposing them in `config.js` is intentional and secure.
* **Write Protection:** Nobody can edit scores, rounds, or elements from the client. All write actions are strictly protected behind Google Sheet permissions restricted to verified university organizers.

### 3.3. Multi-Host Parity (Tri-Proxy Architecture)
The repository intentionally contains multi-target proxy support:
1. **Google Apps Script Web App (`CognitoAppsScript.js`)**: Direct zero-sync-delay primary data provider (read-only JSON).
2. **Apache / cPanel (`api/*.php` + `.htaccess`)**: Used when deployed on central university servers running Apache with PHP.
3. **Cloudflare Pages (`functions/api/*.js`)**: Used when deployed on Cloudflare Pages edge network as a mirror/CDN.
4. **Local Standalone Server (`server.js`)**: Zero-dependency Node server for local committee preview and offline testing.
> *Note for Auditors:* Do NOT flag redundant proxies or multi-environment files as "bloat" or "conflicting architectures." They provide critical redundancy across university and edge hosting targets.

---

## 4. Core Feature Engines & Technical Intent

### 4.1. Dual-Tier Data Ingestion Pipeline
* **Tier 1 (Instant Web App API):** Client fetches from `CONFIG.APPS_SCRIPT_URL` returning structured JSON directly from Google Sheets with 0-second sync delay.
* **Tier 2 (Edge Proxy Fallbacks):** If `APPS_SCRIPT_URL` fails or is throttled, the client seamlessly falls back to `CONFIG.SCORES_URL`, `ROUNDS_URL`, and `ELEMENTS_URL` (PHP on college server, or Cloudflare Functions), parsing CSV via an internal RFC-4180 engine.
* **Failover Resilience:** `fetchDataWithFallback()` checks for HTTP error pages (`<!DOCTYPE`, `<html>`) returned by proxies on 404/500 errors and discards them, preventing cache poisoning and falling back to cached or default datasets.

### 4.2. Server-Side Link Lockdown & IST Temporal Engine
* **The Vulnerability Avoided:** If problem brief PDFs (Google Drive links) or submission forms are sent to client browsers before unseal time, tech-savvy students can inspect network packets in browser DevTools to download cases early.
* **Server-Side Redaction (`CognitoAppsScript.js` & proxies):** If current time is earlier than an exhibit's `ReleaseDate` + `ReleaseTime`, the server **completely strips** `BriefLink` and `SubmitLink` from the payload before sending JSON/CSV to the browser.
* **Strict IST (UTC+05:30 / 19,800,000 ms Offset):** All events physically take place in Bengaluru. All temporal calculations must strictly use Indian Standard Time, regardless of the user's local operating system clock.

### 4.3. Score Scrubber & FLIP Leaderboard Animation
* **Confidential Scoring Rule:** In collegiate fest tournaments, raw judge rubric marks (e.g. 87/100 vs 42/50) are confidential. 
* **The Scrubber:** `processScores()` dynamically identifies the maximum score across all teams, maps each team's score to a relative percentage (`0.0%` to `100.0%`), and deletes internal judge columns (`raw`, `judge`, `eval`, `mark`) so competitors only see normalized progress bars and rankings.
* **FLIP Physics (First-Last-Invert-Play):** `scores.html` animates bar chart rank changes smoothly using CSS transforms, preventing jarring layout shifts during live score updates.

### 4.4. Dynamic Elements Engine (Trailer & Brochure)
* Controlled by the `Elements` tab in the Google Sheet:
  * **Trailer**: Dynamically swaps the YouTube iframe URL on `index.html`.
  * **Brochure**: Dynamically updates the download/view link across all `.link-brochure` buttons on the site.
* **Optimistic Session Caching (`sessionStorage`):** Embed URLs are cached in `sessionStorage` (`cognito_trailer_embed`, `cognito_brochure_url`) so that navigating between pages does not produce white iframe flashes or layout shifts while re-fetching from Google Sheets.
* **Safe Embed Normalizer:** Extracts standard video IDs (`v=`, `youtu.be/`, `/shorts/`) and embeds strictly via `https://www.youtube-nocookie.com/embed/{id}`.

### 4.5. Editorial Split-Dossier UI (`rounds.html`)
* **Multi-Exhibit Accordions:** Multiple problem statements under the same round name are grouped into a single accordion dossier with horizontal scrolling chip navigation.
* **Day Sub-Glider:** Responsive Day 1 / Day 2 / Day 3 filter pill with dynamic indicator gliding across tabs.
* **Live State Transition:** Exhibits transition automatically between:
  1. `LOCKED 🔒`: Release time in the future; countdown displays time remaining; links redacted.
  2. `UNSEALED 🟢`: Active case; brief unlocked with audio alert; submission link live.
  3. `CLOSED ⏳`: Deadline passed; submissions locked.

### 4.6. Audio Synthesis & Canvas Ambience
* **Web Audio API Synthesizer:** Pure synthetic procedural clicks generated via `AudioContext` and short oscillator bursts (no external `.mp3` or `.wav` files needed).
* **Particle Canvas Mesh:** 60 FPS floating nodes with distance-based tether lines and CRT scanline overlay. Automatically throttles when window is hidden or out of viewport.

---

## 5. False Positives Catalog: What Argon Must NOT Flag

When reviewing the codebase, Argon should recognize that the following items are **intentional design and deployment requirements**:

| Proposed "Fix" from Generic Linters | Why It Is WRONG for Cognito 2026 (Intentional Architecture) |
|---|---|
| **"Migrate to React / Next.js / TypeScript"** | **Rejected.** College hosting is pure Apache/cPanel with no Node build pipeline. Direct file editing by student committees is mandatory. |
| **"Install dependencies via npm / package.json"** | **Rejected.** The production artifact must remain zero-dependency and runnable directly out of a zip file. |
| **"Don't commit API endpoints in config.js"** | **Rejected.** These are public, read-only endpoints delivering public event data. Sheet editing permissions remain private to Google account holders. |
| **"Stop converting raw scores to percentages"** | **Rejected.** Score scrubbing is an intentional security feature designed to prevent participants from sniffing internal judge rubric points in DevTools. |
| **"Use browser timezone instead of hardcoded UTC+5:30"** | **Rejected.** All events physically occur on campus in Bengaluru (IST). Using local device time would cause countdown desynchronization for international or misconfigured devices. |
| **"Delete fallback/mock data in script.js"** | **Rejected.** During high-density fest hours with spotty campus Wi-Fi, fallback datasets prevent blank screen crashes if Google APIs hiccup. |
| **"Replace 85KB monolithic styles.css with Tailwind"** | **Rejected.** Tailwind requires a build daemon and runtime compilation. The handcrafted CSS design system contains bespoke CRT scanlines, cyber-editorial typography, and micro-animations. |
| **"Eliminate .htaccess or PHP proxies"** | **Rejected.** The college deployment target is Apache/cPanel, which requires `.htaccess` for security headers and PHP for fallback data routing. |
| **"Add button borders and 'WhatsApp' text to contact cards"** | **Rejected.** The student representative contact cards were specifically styled with borderless, minimalist WhatsApp icons aligned directly with the phone numbers. |

---

## 6. What Argon SHOULD Audit (High-Value Areas)

Argon's analytical capabilities should be focused on genuine security, performance, and operational integrity vectors:

### 6.1. Security & Sanitization
* **Protocol & Injection Attacks:** Verify `sanitizeUrl()` in `script.js` completely blocks `javascript:`, `vbscript:`, `data:text/html`, and control-character obfuscations in Google Sheet inputs (`BriefLink`, `SubmitLink`, `Brochure`, `Trailer`).
* **HTML/Script Injection:** Ensure all dynamic text insertion from Google Sheets (`Team`, `College`, `Title`, `Description`) uses `textContent` or escaped HTML to prevent DOM-based XSS.
* **CORS & HTTP Headers:** Verify `.htaccess` and server proxies provide `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and restrictive Referrer policies without breaking YouTube iframe embeds.

### 6.2. Google Apps Script Concurrency & Quota Management
* **Rate Limiting:** Verify that `CacheService` (20-second TTL) and `onEdit()` cache purging in `CognitoAppsScript.js` protect against Google Apps Script daily execution quota limits when hundreds of students refresh simultaneously.
* **Error Envelope Handling:** Verify that if Apps Script returns `{ error: "..." }` or a Google quota error, client-side `fetchDataWithFallback()` catches it cleanly without throwing uncaught exceptions.

### 6.3. Edge-Case Date & Time Parsing
* **Date Formats:** Ensure `parseFlexibleDate()` handles `DD/MM/YYYY`, `YYYY-MM-DD`, textual months ("15 Dec 2026"), and 12h AM/PM vs 24h formats accurately without `NaN`.
* **Deadline Inheritance:** Verify that when `DeadlineDate` is omitted in the sheet, the exhibit correctly inherits `ReleaseDate` as its submission deadline.
* **Leap Year & Month Indexing:** Ensure zero-based vs 1-based month math (`month - 1`) in `Date.UTC()` is strictly consistent across both client `script.js` and server `CognitoAppsScript.js`.

### 6.4. Mobile Responsiveness & Viewport Integrity
* **320px–360px Small Screens:** Verify that leaderboards, split-dossier chips, mastheads, and contact cards do not cause horizontal page blowout or clipped text.
* **Touch Targets:** Verify that all interactive links (phone, WhatsApp icons, registration buttons, accordion toggles) meet minimum accessibility touch targets (>= 24px–44px hit areas).
* **Glider Alignment:** Ensure `.syncDayGlider()` recalculates pill position accurately on orientation change, resize, and font loading.

### 6.5. Memory & Animation Performance
* **Canvas Lifecycle:** Confirm `requestAnimationFrame` stops or throttles when tabs are inactive (`visibilitychange` listener).
* **Audio Context Cleanup:** Confirm `AudioContext` is suspended or unlocked strictly on user gesture and does not generate console warnings regarding Autoplay policies.

---

## 7. Data Contract & Google Sheets Schema

For reference, the Google Sheet Control Panel uses the following exact sheet names and column schemas:

### Tab 1: `Scores`
| Column Header | Type | Description | Example |
|---|---|---|---|
| `Event` | String | Fest track (`Contingent`, `Case Competition`, `Quiz`) | `Contingent` |
| `Round` | String | Sub-round name or `Overall` | `Overall` |
| `Team` | String | Team display name | `Apex Capital` |
| `College` | String | College institution name | `SRCC, New Delhi` |
| `Score` | Number | Raw numeric points (automatically scrubbed to % on server) | `284` |

### Tab 2: `Rounds`
| Column Header | Type | Description | Example |
|---|---|---|---|
| `Event` | String | Track name (`Contingent`, `Case Competition`) | `Contingent` |
| `Day` | Number | Day filter (`1`, `2`, or `3`) | `1` |
| `Round` | String | Accordion dossier group name | `Round 1 - The Qualifier` |
| `Title` | String | Exhibit chip title | `Corporate Genesis` |
| `ReleaseDate` | Date | Unseal date (`DD/MM/YYYY`) | `15/12/2026` |
| `ReleaseTime` | Time | Unseal time (`HH:MM` or `HH:MM AM/PM`) | `09:30 AM` |
| `DeadlineDate` | Date | Submission deadline date (optional; inherits ReleaseDate) | `15/12/2026` |
| `DeadlineTime` | Time | Submission deadline time (`HH:MM`) | `03:30 PM` |
| `BriefLink` | URL | Problem brief PDF link (redacted before release) | `https://drive.google.com/...` |
| `SubmitLink` | URL | Google Form submission link (redacted before release) | `https://forms.gle/...` |
| `Description` | Text | Briefing summary paragraph | `Analyze corporate solvency...` |
| `Show` | String | Visibility toggle (`Yes` to publish, `No` to draft) | `Yes` |

### Tab 3: `Elements` (formerly `Trailer`)
| Column Header | Type | Description | Example |
|---|---|---|---|
| `Element` | String | Identifier (`Trailer`, `Brochure`) | `Trailer` |
| `URL` | URL | YouTube link (for Trailer) or Google Drive link (for Brochure) | `https://youtu.be/...` |
| `Show` | String | Toggle visibility (`Yes` or `No`) | `Yes` |

---

## 8. Summary for Argon

Argon: When auditing this repository:
1. **Respect the zero-build vanilla requirement** for university hosting.
2. **Audit security at the protocol, sanitization, and data-scrubbing level.**
3. **Audit edge-case date parsing and time-lock guarantees in IST.**
4. **Audit mobile viewport robustness and failover mechanisms.**
5. **Do not recommend framework refactors, build tools, or altering score scrubber percentages.**
