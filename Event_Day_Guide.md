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
`Event` | `Round` | `Title` | `Description` | `Release` | `Deadline` | `BriefLink` | `SubmitLink` | `Show`

### How to add/edit rounds:
* **Event:** `Case Competition` or `Contingent`.
* **Round:** e.g., `Round 1` or `Grand Finale`.
* **Title:** e.g., `The Valuation Dilemma`.
* **Description:** A short 1-2 sentence description.
* **Release & Deadline (CRITICAL):** Must be exactly `YYYY-MM-DD HH:MM` (24-hour time).
  * *Example:* `2026-12-15 09:30`
  * The website uses these exact times to run the live countdowns. If a round hasn't hit its Release time yet, the button will be locked. At the exact minute of Release, it turns green and opens. At Deadline, it turns red and closes.
* **BriefLink:** A Google Drive link to the case PDF.
* **SubmitLink:** A Google Form link to collect their solutions.
* **Show:** Type `Yes` to display it on the website. Type `No` if you want to hide it temporarily.

---

## 4. Troubleshooting
* **A team is missing from the leaderboard:** Ensure their `Event` column says exactly `Contingent` and their `Score` is a valid number.
* **Rounds buttons are stuck on "Locked":** Check your `Release` column formatting. It must be `YYYY-MM-DD HH:MM`. (e.g. `2026-12-15 14:00` for 2:00 PM).
* **Changes aren't showing up:** Wait 3 minutes and refresh the page. Google Sheets CSV publishing is not instant.
