# Cognito 2026 - Google Sheets Control Panel Setup Guide

This guide details how to set up your free Google Sheets backend for **Live Scores** and **Automated Round Releases**.

---

## Step 1: Create the Control Sheet
1. Open [Google Sheets](https://sheets.new) using a dedicated fest Gmail account (e.g., `cognito2026christ@gmail.com`). *Avoid using a restricted workspace account so that public CSV publishing works seamlessly.*
2. Title the spreadsheet: **`Cognito 2026 Control Panel`**.

---

## Step 2: Tab 1 - `Scores`

Rename the first tab to **`Scores`**. Create the following exact column headers in row 1:

| Event | Round | Team | College | Score |
| :--- | :--- | :--- | :--- | :--- |
| Contingent | Overall | Apex Capital | SRCC, New Delhi | 284 |
| Contingent | Overall | Vanguard Syndicate | St. Xavier's College, Mumbai | 278 |
| Case Competition | Finals | Alpha Hedge | IIM Bangalore (Undergrad) | 96.5 |
| Business Quiz | Finals | Mind Over Market | IIT Madras | 185 |

### How Scores Work:
- The website automatically groups scores by `Event` (e.g. `Contingent`, `Case Competition`, `Business Quiz`).
- Teams are ranked automatically from highest score to lowest.
- Whenever you enter or change a score in the Google Sheet, the live website refreshes automatically!

---

## Step 3: Tab 2 - `Rounds`

Create a second tab named **`Rounds`**. Create the following exact column headers in row 1:

| Event | Day | ReleaseDate | Round | DeadlineDate | DeadlineTime | SubmitLink | Title | Description | ReleaseTime | BriefLink | Show |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Contingent | 1 | 15/12/2026 | Round 1 - The Qualifier | 15/12/2026 | 15:30 | https://forms.gle/... | Corporate Genesis | Market entry simulation | 09:30 | https://drive.google.com/... | Yes |
| Contingent | 1 | 15/12/2026 | Round 1 - The Qualifier | 15/12/2026 | 15:30 | https://forms.gle/... | Arbitrage Shock | Liquidity distress event | 11:30 | https://drive.google.com/... | Yes |
| Case Competition | | 15/11/2026 | Round 1 - Prelims | 25/11/2026 | 23:59 | https://forms.gle/... | Valuation Dilemma | Portfolio risk analysis | 10:00 | https://drive.google.com/... | Yes |

### Column Notes:
- **`ReleaseDate`**: The unseal/release date in `DD/MM/YYYY` format (e.g., `15/12/2026`). If `DeadlineDate` is left empty, the deadline automatically uses this release date.
- **`Day`**: For Contingent, enter `1`, `2`, or `3` to match the Day filter tabs on the website.
- **`Round`**: The round name. All exhibits sharing the same `Round` name are automatically grouped into an accordion menu.
- **`DeadlineDate` & `DeadlineTime`**: Submission deadline for the round (common to all exhibits in this round). Use `DD/MM/YYYY` for date and `HH:mm` (or `hh:mm AM/PM`) for time.
- **`ReleaseTime`**: When this specific exhibit unlocks (`HH:mm` or `hh:mm AM/PM`).
- **`SubmitLink`**: Google Form link for participants to submit their solution for the round.
- **`BriefLink`**: Google Drive shareable link to the problem dossier PDF (*"Anyone with the link can view"*).
- **`Show`**: Put `Yes` to display, or `No` to hide.

---

## Step 4: Publish to Web as CSV
1. In Google Sheets, click **File** > **Share** > **Publish to web**.
2. Under **Link**:
   - Choose the **Scores** tab.
   - Change "Web page" to **Comma-separated values (.csv)**.
   - Check **"Automatically republish when changes are made"**.
   - Click **Publish** and copy the generated link.
3. Repeat the exact same step for the **Rounds** tab:
   - Select the **Rounds** tab > **Comma-separated values (.csv)** > Publish > Copy link.

---

## Step 5: Paste Links into `config.js`
Open `config.js` in your website folder and paste the copied URLs into:
```javascript
const CONFIG = {
    SCORES_CSV_URL: "PASTE_YOUR_PUBLISHED_SCORES_CSV_URL_HERE", 
    ROUNDS_CSV_URL: "PASTE_YOUR_PUBLISHED_ROUNDS_CSV_URL_HERE",
    ...
};
```
Save the file. Your website is now fully connected to your live Google Sheet!
