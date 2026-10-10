# Cognito 2026 — Google Sheets Control Panel Setup Guide

This guide details how to set up and structure your free Google Sheets backend for **Live Scores**, **Automated Round Releases**, and **Event Trailer Streaming**.

---

## ⚡ Key Highlights
* **Zero Code Updates During Event**: Organizers only edit cells in Google Sheets; the live website automatically parses changes.
* **Column Order Independence**: The order of columns in your sheet does **NOT** matter. The parsing engine dynamically matches columns by their header names (case-insensitive).
* **Indian Standard Time (IST / UTC+05:30)**: All dates and times are anchored to IST automatically, so participants across timezones always experience consistent release countdowns.
* **Confidentiality Protection**: The edge proxy blocks unreleased rounds (`Show !== 'Yes'`) and masks raw numerical marks from public network requests.

---

## Step 1: Create the Control Spreadsheet
1. Open [Google Sheets](https://sheets.new) using your fest or committee Google account (e.g. `cognito2026christ@gmail.com`).
2. Title the spreadsheet: **`Cognito 2026 Control Panel`**.

---

## Step 2: Tab 1 — `Scores`

Rename your first sheet tab to **`Scores`**. Create the following column headers in Row 1:

| Event | Round | Team | College | Score |
| :--- | :--- | :--- | :--- | :--- |
| Contingent | Overall | Apex Capital | SRCC, New Delhi | 284 |
| Contingent | Overall | Vanguard Syndicate | St. Xavier's College, Mumbai | 278 |
| Contingent | Overall | Zenith Consortium | Christ University, Central Campus | 265 |
| Case Competition | Finals | Alpha Hedge | IIM Bangalore (Undergrad) | 96.5 |
| Business Quiz | Finals | Mind Over Market | IIT Madras | 185 |

### How Scores Work:
* **Event**: Must match the category filter on `scores.html` (e.g., `Contingent`, `Case Competition`, `Business Quiz`).
* **Round**: Name or milestone (e.g., `Overall`, `Round 1`, `Round 2`, `Finals`).
* **Team & College**: Displayed on leaderboard cards and searchable in the live search bar.
* **Score**: Enter any numeric value (decimals supported, e.g. `96.5`). 
* **Ranking & Podiums**: The website ranks teams from highest to lowest automatically and highlights 1st (Gold), 2nd (Silver), and 3rd (Bronze).
* **Edge Score Scrubber**: When using Cloudflare Pages or PHP proxies, raw numeric scores are transformed into relative normalized percentages on the server side so competitors cannot sniff upcoming score tallies before formal announcements.

---

## Step 3: Tab 2 — `Rounds`

Create a second sheet tab named **`Rounds`**. Create the following column headers in Row 1:

| Event | Day | ReleaseDate | Round | DeadlineDate | DeadlineTime | SubmitLink | Title | Description | ReleaseTime | BriefLink | Show |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Contingent | 1 | 15/12/2026 | Round 1 - The Qualifier | 15/12/2026 | 15:30 | https://forms.gle/r1-sub | Corporate Genesis | Market entry simulation | 09:30 | https://drive.google.com/r1-ex1 | Yes |
| Contingent | 1 | 15/12/2026 | Round 1 - The Qualifier | 15/12/2026 | 15:30 | https://forms.gle/r1-sub | Arbitrage Shock | High-frequency liquidity distress | 11:30 | https://drive.google.com/r1-ex2 | Yes |
| Contingent | 2 | 16/12/2026 | Round 2 - Crisis Simulation | 16/12/2026 | 16:30 | https://forms.gle/r2-sub | Hostile Takeover | Stakeholder defense simulation | 10:00 | https://drive.google.com/r2-ex1 | Yes |
| Case Competition | | 15/11/2026 | Round 1 - Prelims | 25/11/2026 | 23:59 | https://forms.gle/case-r1 | Valuation Dilemma | Portfolio risk analysis | 10:00 | https://drive.google.com/case-r1 | Yes |

### Column Definitions:
* **`Event`**: Category name. Must be either `Contingent` or `Case Competition`.
* **`Day`**: Day grouping for Contingent rounds (`1`, `2`, or `3`). Automatically maps to the Day 1 / Day 2 / Day 3 filter tabs on `rounds.html`. (Leave empty for Case Competition).
* **`ReleaseDate`**: The date when the exhibit unseals in `DD/MM/YYYY` format (e.g., `15/12/2026`). Also serves as the deadline date if `DeadlineDate` is left empty.
* **`Round`**: The round name. All exhibits sharing the exact same `Round` value are grouped into a single unified accordion menu.
* **`DeadlineDate` & `DeadlineTime`**: Submission deadline for the round. Common to all exhibits within this round. Accepts `DD/MM/YYYY` and `HH:mm` (or `hh:mm AM/PM`, e.g. `3:30 PM`).
* **`ReleaseTime`**: Exact time when this specific exhibit unlocks (`HH:mm` or `hh:mm AM/PM`, e.g., `09:30` or `9:30 AM`).
* **`SubmitLink`**: Google Form or portal link for submitting answers. Displayed on the round header once the round is live.
* **`Title`**: The exhibit title displayed on the exhibit chip/tab (e.g. `Corporate Genesis`).
* **`Description`**: Optional exhibit briefing or instruction text. If empty, the dossier body remains clean without placeholder text.
* **`BriefLink`**: Google Drive shareable link to the problem brief PDF (*"Anyone with the link can view"*).
* **`Show`**: Enter `Yes` to display on the site, or `No` to keep hidden. When `No`, the edge proxy scrubs the row completely.

---

## Step 4: Tab 3 — `Trailer` (Optional)

If you wish to update the homepage trailer without modifying code, create a third sheet tab named **`Trailer`** with:

| YouTubeUrl |
| :--- |
| https://www.youtube.com/watch?v=dQw4w9WgXcQ |

The engine extracts the video ID and embeds it into the homepage hero section.

---

## Step 5: Connecting to the Website (Choose Method 1 or 2)

### 🥇 METHOD 1 (RECOMMENDED): Instant Google Apps Script (0-Second Delay)
*Use this method for event day! It bypasses Google's 1–5 minute publishing delay, works on ANY server when handed off to the college, and scrubs secret scores on the server.*

1. In your Google Sheet, click **Extensions** > **Apps Script**.
2. Delete any existing code in the editor.
3. Open [`CognitoAppsScript.js`](CognitoAppsScript.js) from the website repository, copy its entire contents, and paste it into the editor.
4. Click the blue **Deploy** button (top right) > **New deployment**.
5. Click the gear icon ⚙️ beside *Select type* > Choose **Web app**.
6. Set the configuration:
   - **Description**: `Cognito 2026 Live API`
   - **Execute as**: `Me` (your fest Google account)
   - **Who has access**: `Anyone` *(Crucial: allows visitors to read scores without logging in)*
7. Click **Deploy** > **Authorize access** (select your account > click *Advanced* > *Go to Cognito API (unsafe)* > *Allow*).
8. Copy the generated **Web app URL** (looks like `https://script.google.com/macros/s/AKfycb.../exec`).
9. Open `config.js` in your website folder and paste it into `APPS_SCRIPT_URL`:
   ```javascript
   const CONFIG = {
       APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycb.../exec",
       ...
   };
   ```
10. **That's it!** You're live with instant updates. When you edit any cell in Google Sheets, the live website sees it in real time!

---

### 🥈 METHOD 2 (FALLBACK): Classic "Publish to Web" as CSV
*Note: Google takes 1 to 5 minutes to push changes through this method due to CDN caching.*

1. In Google Sheets, click **File** > **Share** > **Publish to web**.
2. Select **Link**:
   - Choose the **Scores** tab.
   - Change "Web page" to **Comma-separated values (.csv)**.
   - Expand **Published content & settings** and verify that **"Automatically republish when changes are made"** is checked.
   - Click **Publish** and copy the generated link.
3. Repeat the exact same step for the **Rounds** tab:
   - Choose the **Rounds** tab > **Comma-separated values (.csv)** > Publish > Copy link.
4. Paste the URLs into `config.js`:
   ```javascript
   const CONFIG = {
       SCORES_CSV_URL: "https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?gid=0&single=true&output=csv",
       ROUNDS_CSV_URL: "https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?gid=1586686373&single=true&output=csv",
       ...
   };
   ```

---

## 🔒 College Handoff Guarantee

When you hand the website files over to the college IT department:
* You do **not** need server access, FTP, or PHP permissions to update scores.
* College IT can host the static files anywhere (cPanel, Apache, Windows IIS, or Cloudflare).
* You manage everything directly from your Google Sheet using **Method 1**. Any score or round change made in the spreadsheet reflects on the live college website instantly!

