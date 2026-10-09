# Cognito 2026 – Event Day Guide
**Live Scores & Rounds Management**

This guide explains how to update the Cognito 2026 website during the event. The website is connected directly to a Google Sheet. **You do not need to touch any code to update the website.**

---

## 1. How it Works
The website reads data directly from your Google Sheet using a "Published CSV" link. 
* **Auto-Refresh:** The Live Scores page automatically refreshes every 60 seconds.
* **Sync Delay:** When you type a new score or round into Google Sheets, it takes Google about **1 to 5 minutes** to push that change to the public website. *Be patient after typing a score!*

---

## 2. Managing Live Scores
To update the leaderboard, open the **Scores** tab in your Google Sheet.

### Required Columns (Row 1):
You must have these exact column names in Row 1:
`Event` | `Round` | `Team` | `College` | `Score`

### How to add/edit teams:
1. **Event:** Must be exactly `Contingent`. (If you misspell it, the team won't show up).
2. **Round:** (e.g., `Overall` or `Round 1`).
3. **Team:** The name of the team (e.g., `Apex Capital`).
4. **College:** The college name (e.g., `SRCC, New Delhi`).
5. **Score:** Just type the number (e.g., `284`).

**How the website handles it:**
As soon as you type the score, the website calculates the max score, ranks the teams automatically (1st, 2nd, 3rd get special gold/silver/bronze badges), and animates the progress bars based on their score percentage.

---

## 3. Managing Event Rounds
To unlock cases and update countdowns, open the **Rounds** tab in your Google Sheet.

### Required Columns (Row 1):
`Event` | `Day` | `Date` | `Round` | `DeadlineDate` | `DeadlineTime` | `SubmitLink` | `Title` | `Description` | `ReleaseTime` | `BriefLink` | `Show`

### How to add/edit rounds:
* **Event:** `Case Competition` or `Contingent`.
* **Day:** `1`, `2`, or `3` (for Contingent events).
* **Date:** The date in standard `DD/MM/YYYY` format (e.g. `15/12/2026`).
* **Round:** Round name (e.g. `Round 1 - The Qualifier`). Multiple exhibits under the same round name are grouped together.
* **DeadlineDate & DeadlineTime:** Submission deadline for the round (e.g. `15/12/2026` and `15:30` or `3:30 PM`). Common to all exhibits in the round.
* **ReleaseTime:** Time when this specific exhibit unseals (e.g. `09:30` or `09:30 AM`).
* **SubmitLink:** Google Form link for participants to collect their submissions.
* **BriefLink:** A Google Drive link to the case brief PDF.
* **Show:** Type `Yes` to display it on the website. Type `No` to hide.

---

## 4. Troubleshooting
* **A team is missing from the leaderboard:** Ensure their `Event` column says exactly `Contingent` and their `Score` is a valid number.
* **Rounds buttons are stuck on "Locked":** Check your `Date` and `ReleaseTime` column formatting. Use `DD/MM/YYYY` for date (e.g. `15/12/2026`) and `HH:MM` for time (e.g. `09:30`).
* **Changes aren't showing up:** Wait 1 to 3 minutes and refresh the page. Google Sheets CSV publishing is not instant.
