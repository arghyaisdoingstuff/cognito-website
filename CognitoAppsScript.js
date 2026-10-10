/**
 * ============================================================================
 * Cognito 2026 — Instant Google Apps Script Backend Engine
 * ============================================================================
 * 
 * INSTRUCTIONS FOR DEPLOYMENT (30 SECONDS):
 * 1. Open your Google Sheet ("Cognito 2026 Control Panel").
 * 2. In the top menu, click: Extensions > Apps Script.
 * 3. Delete any default code in Code.gs, and paste this ENTIRE file into the editor.
 * 4. Click the blue "Deploy" button (top right) > "New deployment".
 * 5. Click the gear icon beside "Select type" > Select "Web app".
 * 6. Set the following settings:
 *      - Description: "Cognito 2026 Live API"
 *      - Execute as: "Me" (your Google account)
 *      - Who has access: "Anyone" (IMPORTANT: allows public website visitors to read)
 * 7. Click "Deploy" > "Authorize access" > choose your Google account > 
 *    click "Advanced" > "Go to Cognito API (unsafe)" > "Allow".
 * 8. Copy the generated "Web app URL" (looks like: https://script.google.com/macros/s/.../exec).
 * 9. Paste this URL into `config.js` in your website folder under `APPS_SCRIPT_URL`:
 *      APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycb.../exec"
 * 
 * DONE! The website now updates in REAL TIME (0-second delay) whenever you edit the sheet!
 * ============================================================================
 */

// OPTIONAL: If using a standalone script created at script.google.com,
// paste your Google Sheet ID here (the long code between /d/ and /edit in the URL).
// If you opened Apps Script directly from Extensions > Apps Script, leave this empty ("").
const SPREADSHEET_ID = "";

/**
 * Resolves the Google Sheet object, supporting both container-bound
 * (Extensions > Apps Script) and standalone (script.google.com) projects.
 */
function getSpreadsheet() {
  if (SPREADSHEET_ID && SPREADSHEET_ID.trim()) {
    return SpreadsheetApp.openById(SPREADSHEET_ID.trim());
  }
  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (_) {}
  throw new Error("Spreadsheet not found. If this is a standalone Apps Script, paste your Google Sheet ID into SPREADSHEET_ID at the top of the script.");
}

/**
 * Main Web App Request Handler
 * Accepts:
 *   ?sheet=Scores    -> Returns contingent leaderboard data with score scrubbing
 *   ?sheet=Rounds    -> Returns timed round cases (only Show === 'Yes')
 *   ?sheet=Elements  -> Returns dynamic site elements (Trailer, Brochure, etc.)
 *   ?sheet=Trailer   -> Backwards-compatible alias for Elements
 *   ?sheet=All       -> Returns { scores: [...], rounds: [...], elements: [...], trailer: [...] }
 *   ?nocache=1       -> Bypasses memory cache for instant diagnostic read
 */
function doGet(e) {
  try {
    const sheetParam = (e && e.parameter && (e.parameter.sheet || e.parameter.tab || e.parameter.type)) || 'Scores';
    const noCache = e && e.parameter && e.parameter.nocache === '1';
    const cache = CacheService.getScriptCache();
    const cacheKey = 'cognito_cache_' + sheetParam.toLowerCase();

    // Check fast in-memory cache unless nocache is explicitly requested
    if (!noCache) {
      const cached = cache.get(cacheKey);
      if (cached) {
        return createJsonResponse(cached);
      }
    }

    const ss = getSpreadsheet();
    let resultData;
    const lowerParam = sheetParam.toLowerCase();

    if (lowerParam === 'all') {
      const elementsSheet = ss.getSheetByName('Elements') || ss.getSheetByName('elements') || ss.getSheetByName('Trailer') || ss.getSheetByName('trailer');
      const elementsData = processElements(elementsSheet);
      resultData = {
        scores: processScores(ss.getSheetByName('Scores') || ss.getSheetByName('scores')),
        rounds: processRounds(ss.getSheetByName('Rounds') || ss.getSheetByName('rounds')),
        elements: elementsData,
        trailer: elementsData
      };
    } else if (lowerParam === 'rounds') {
      resultData = processRounds(ss.getSheetByName('Rounds') || ss.getSheetByName('rounds'));
    } else if (lowerParam === 'elements' || lowerParam === 'trailer') {
      const elementsSheet = ss.getSheetByName('Elements') || ss.getSheetByName('elements') || ss.getSheetByName('Trailer') || ss.getSheetByName('trailer');
      resultData = processElements(elementsSheet);
    } else {
      // Default to Scores
      resultData = processScores(ss.getSheetByName('Scores') || ss.getSheetByName('scores'));
    }

    const jsonStr = JSON.stringify(resultData);

    // Cache for 20 seconds: Protects Google quota during high traffic (e.g. 1000s of students refreshing)
    try {
      cache.put(cacheKey, jsonStr, 20);
    } catch (_) {}

    return createJsonResponse(jsonStr);

  } catch (err) {
    return createJsonResponse(JSON.stringify({ error: err.toString() }));
  }
}

/**
 * AUTOMATIC CACHE-BUSTING TRIGGER
 * Whenever any coordinator edits ANY cell in the Google Sheet,
 * this function automatically purges the in-memory cache immediately.
 * Result: The next visitor gets the new score with 0 SECONDS of delay!
 */
function onEdit(e) {
  try {
    const cache = CacheService.getScriptCache();
    cache.removeAll(['cognito_cache_scores', 'cognito_cache_rounds', 'cognito_cache_trailer', 'cognito_cache_elements', 'cognito_cache_all']);
  } catch (_) {}
}

/**
 * Reads sheet rows using getDisplayValues() to guarantee string fidelity
 * exactly matching what is displayed on the screen (no date-object skewing).
 */
function getSheetRows(sheet) {
  if (!sheet) return [];
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length <= 1) return [];

  const headers = values[0].map(function(h) { return String(h).trim(); });
  const rows = [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    // Skip completely blank rows
    const isBlank = row.every(function(cell) { return !cell || !String(cell).trim(); });
    if (isBlank) continue;

    const rowObj = {};
    headers.forEach(function(h, colIndex) {
      rowObj[h] = row[colIndex] ? String(row[colIndex]).trim() : '';
    });
    rows.push(rowObj);
  }
  return rows;
}

/**
 * Process Scores Tab
 * Features:
 * - Dynamically finds score column (Score, Points, Total)
 * - Computes overall max score
 * - SCORE SCRUBBER: Replaces raw score with relative percentage (0.0 - 100.0)
 *   so raw internal judge marks NEVER leak in browser DevTools!
 */
function processScores(sheet) {
  const rows = getSheetRows(sheet);
  if (!rows.length) return [];

  let maxScore = 0;
  rows.forEach(function(r) {
    const scoreKey = Object.keys(r).find(function(k) { return /^(score|points|total)$/i.test(k); });
    const rawVal = scoreKey ? parseFloat(r[scoreKey]) : 0;
    if (!isNaN(rawVal) && rawVal > maxScore) maxScore = rawVal;
  });

  return rows.map(function(r) {
    const scoreKey = Object.keys(r).find(function(k) { return /^(score|points|total)$/i.test(k); }) || 'Score';
    const rawVal = parseFloat(r[scoreKey]);
    const score = isNaN(rawVal) ? 0 : rawVal;
    const pct = maxScore > 0 ? Math.max(0, Math.min(100, (score / maxScore * 100))).toFixed(1) : "0.0";

    // Set normalized values
    r[scoreKey] = pct;
    r['ScorePercentage'] = pct;
    return r;
  });
}

/**
 * Process Rounds Tab
 * Confidentiality Guards:
 * 1. DRAFT FILTER: Completely eliminates rows where Show !== 'Yes'.
 * 2. LINK LOCKDOWN: If an exhibit has not reached its release time yet,
 *    its BriefLink and SubmitLink are stripped on the server so participants
 *    cannot sniff Google Drive case brief links in browser DevTools!
 */
function processRounds(sheet) {
  const rows = getSheetRows(sheet);
  if (!rows.length) return [];

  const visible = rows.filter(function(r) {
    const showKey = Object.keys(r).find(function(k) { return /^show$/i.test(k); });
    const val = showKey ? (r[showKey] || '').toLowerCase() : '';
    return val === 'yes' || val === 'y' || val === 'true';
  });

  return visible.map(function(r) {
    // If release time is in the future, redact case brief and submission links
    if (isRoundLocked(r)) {
      if (r.BriefLink) r.BriefLink = '';
      if (r.SubmitLink) r.SubmitLink = '';
    }
    return r;
  });
}

/**
 * Checks whether an exhibit's release time is currently in the future (IST).
 */
function isRoundLocked(row) {
  const relDateKey = Object.keys(row).find(function(k) { return /release.*date|date.*release/i.test(k); });
  const relTimeKey = Object.keys(row).find(function(k) { return /release.*time|time.*release/i.test(k); });
  const dateStr = relDateKey ? String(row[relDateKey] || '').trim() : '';
  const timeStr = relTimeKey ? String(row[relTimeKey] || '').trim() : '';
  if (!dateStr) return false;

  const parts = dateStr.split(/[\/\-\.]/);
  if (parts.length < 3) return false;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);

  let hours = 0, minutes = 0;
  if (timeStr) {
    const timeParts = timeStr.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
    if (timeParts) {
      hours = parseInt(timeParts[1], 10);
      minutes = parseInt(timeParts[2], 10);
      const ampm = timeParts[3] ? timeParts[3].toLowerCase() : null;
      if (ampm === 'pm' && hours < 12) hours += 12;
      if (ampm === 'am' && hours === 12) hours = 0;
    }
  }

  // Anchor to Indian Standard Time (IST / UTC+05:30)
  const IST_OFFSET_MS = 19800000;
  const targetUtcMs = Date.UTC(year, month - 1, day, hours, minutes, 0) - IST_OFFSET_MS;
  const nowMs = Date.now();
  return nowMs < targetUtcMs;
}

/**
 * Process Elements / Trailer Tab
 * Reads dynamic site elements (Trailer, Brochure, etc.)
 */
function processElements(sheet) {
  return getSheetRows(sheet);
}

function processTrailer(sheet) {
  return processElements(sheet);
}

/**
 * Helper to construct JSON response with CORS headers
 */
function createJsonResponse(jsonContent) {
  const output = ContentService.createTextOutput(jsonContent);
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
