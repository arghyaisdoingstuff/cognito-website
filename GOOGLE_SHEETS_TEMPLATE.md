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

| Event | Round | Title | Description | Release | Deadline | BriefLink | SubmitLink | Show |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Case Competition | Round 1 | The Valuation Dilemma | Analyze portfolio risk for sovereign fund | 2026-11-15 10:00 | 2026-11-25 23:59 | https://drive.google.com/your-pdf-link | https://forms.gle/your-form-link | Yes |
| Contingent | Prelims | Market Entry Simulation | Full contingent speed case | 2026-12-15 09:30 | 2026-12-15 14:00 | https://drive.google.com/your-pdf-link | https://forms.gle/your-form-link | Yes |

### Column Notes:
- **`Release` & `Deadline`**: Write in `YYYY-MM-DD HH:mm` format in Indian Standard Time (IST).
  - Before `Release` time: The card displays **Locked 🔒** with a countdown timer.
  - Between `Release` and `Deadline`: The card unlocks and shows **"Read Case Brief"** and **"Submit Solution"** buttons!
  - After `Deadline`: The card changes to **Closed 🔴** and hides the submission button.
- **`BriefLink`**: Google Drive shareable link to the round problem statement PDF (set to *"Anyone with the link can view"*).
- **`SubmitLink`**: Google Form link for participants to upload their deck/solution.
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
