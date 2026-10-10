# Cognito 2026 — Event Day Operations Guide
**Live Scores & Timed Rounds Management**

This manual is for the organizing committee and control desk managing the Cognito 2026 website during fest days. The entire platform synchronizes directly with your Google Sheet. **You never need to edit code to update the website on event days.**

---

## ⚡ 3 Golden Rules for Event Day
1. **Instant Updates with Google Apps Script (0-Second Delay)**: When using Google Apps Script (see `CognitoAppsScript.js`), edits appear on the website immediately! If using legacy "Publish to Web" CSV, allow 1–3 minutes for Google's CDN to push changes.
2. **Column Order Does NOT Matter**: You can rearrange the columns in any order you want in your Google Sheet. The website searches for the exact column header names automatically.
3. **All Times are Indian Standard Time (IST / UTC+05:30)**: Even if someone is viewing the site on a phone set to another timezone, all countdowns unlock strictly according to IST.

---

## 📊 1. Managing Live Scores (`Scores` Tab)

Open the **`Scores`** tab in the Google Sheet.

### Required Column Headers (Row 1):
`Event` | `Round` | `Team` | `College` | `Score`

### How to enter scores:
* **`Event`**: Must match the event track exactly. Use `Contingent` for the overall fest championship, or `Case Competition` / `Business Quiz` for standalone events.
* **`Round`**: e.g., `Overall`, `Round 1`, `Round 2`, `Semi-Finals`, `Finals`.
* **`Team`**: Full team name (e.g., `Apex Capital`).
* **`College`**: College affiliation (e.g., `SRCC, New Delhi`).
* **`Score`**: Enter the numeric score (e.g., `284` or `96.5`).

### What the website does automatically:
* Ranks all teams dynamically from highest score to lowest.
* Awards Gold 🥇, Silver 🥈, and Bronze 🥉 podium badges to the top 3 teams.
* Smoothly animates rank position shifts on screen without page reloads using FLIP physics.
* Normalizes progress bars so the highest-scoring team fills the bar width, with relative percentages rendered smoothly.
* **Security Scrubber Active**: Raw numerical marks are kept confidential at the server proxy layer so competitors cannot sniff unpublished scores via browser DevTools.

---

## ⏱️ 2. Managing Timed Rounds (`Rounds` Tab)

Open the **`Rounds`** tab in the Google Sheet.

### Required Column Headers (Row 1):
`Event` | `Day` | `ReleaseDate` | `Round` | `DeadlineDate` | `DeadlineTime` | `SubmitLink` | `Title` | `Description` | `ReleaseTime` | `BriefLink` | `Show`

### Column Field Guide:
* **`Event`**: Set to `Contingent` or `Case Competition`.
* **`Day`**: For Contingent rounds, enter `1`, `2`, or `3`. This places the exhibit under the **Day 1**, **Day 2**, or **Day 3** tab on `rounds.html`. For Case Competition, leave this blank.
* **`ReleaseDate`**: The unseal date in `DD/MM/YYYY` format (e.g. `15/12/2026`). If `DeadlineDate` is left blank, the deadline automatically adopts this date.
* **`Round`**: The round name (e.g., `Round 1 - The Qualifier`). All exhibits sharing the exact same `Round` title are bundled into one clean accordion.
* **`DeadlineDate` & `DeadlineTime`**: The submission deadline for the entire round (e.g. `15/12/2026` and `15:30` or `3:30 PM`).
* **`ReleaseTime`**: When this specific exhibit unlocks (e.g. `09:30` or `9:30 AM`).
* **`SubmitLink`**: Google Form link for collecting participant submissions. Displayed in the round header when live.
* **`Title`**: The exhibit's name on its clickable chip (e.g. `Corporate Genesis`).
* **`Description`**: Optional briefing text. If empty, the dossier body shows the clean card without placeholder text.
* **`BriefLink`**: Google Drive shareable link to the problem brief PDF (*"Anyone with the link can view"*).
* **`Show`**: Put `Yes` to display the round or `No` to hide it. If `No`, the server completely omits the row from participant browsers.

### State Transitions (Automated):
* **LOCKED 🔒**: Current time is before `ReleaseDate` + `ReleaseTime`. Countdown shows remaining time to release. Brief link is disabled.
* **UNSEALED 🟢**: Release time has passed, but deadline is in the future. Brief download button unlocks with audio alert, and submission button activates. Countdown displays remaining submission time.
* **CLOSED ⏳**: Deadline has passed. Submission buttons display as closed.

---

## 🚨 3. Event-Day Troubleshooting Checklist

| Issue | Quick Fix |
| :--- | :--- |
| **A team isn't appearing on the leaderboard** | Verify that their `Event` column says exactly `Contingent` (case-sensitive) and `Score` is a valid number without text letters. |
| **A round button says "Locked" when it should be open** | Check your `ReleaseDate` format (`DD/MM/YYYY`) and `ReleaseTime` (`HH:mm` or `hh:mm AM/PM`). Ensure the date is today's date. |
| **A round is completely missing from the website** | Check the `Show` column. It must be set to `Yes`. If it is `No` or blank, the edge server hides it. |
| **Changes aren't showing up on the website** | Wait 2 minutes and hard-refresh (`Ctrl + Shift + R` or `Cmd + Shift + R`). Google Sheets publishes in cycles of 1–3 minutes. |
| **Brief link says "Access Denied" for teams** | In Google Drive, open the file's share settings and set **General Access** to **"Anyone with the link can view"**. |

---

*Need immediate technical support? Contact the DPS Web Tech Team.*
