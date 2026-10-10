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

/**
 * Main Web App Request Handler
 * Accepts:
 *   ?sheet=Scores   -> Returns contingent leaderboard data with score scrubbing
 *   ?sheet=Rounds   -> Returns timed round cases (only Show === 'Yes')
 *   ?sheet=Trailer  -> Returns trailer embed information
 *   ?sheet=All      -> Returns { scores: [...], rounds: [...], trailer: [...] }
 *   ?nocache=1      -> Bypasses memory cache for instant diagnostic read
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

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let resultData;

    if (sheetParam.toLowerCase() === 'all') {
      resultData = {
        scores: processScores(ss.getSheetByName('Scores')),
        rounds: processRounds(ss.getSheetByName('Rounds')),
        trailer: processTrailer(ss.getSheetByName('Trailer'))
      };
    } else if (sheetParam.toLowerCase() === 'rounds') {
      resultData = processRounds(ss.getSheetByName('Rounds'));
    } else if (sheetParam.toLowerCase() === 'trailer') {
      resultData = processTrailer(ss.getSheetByName('Trailer'));
    } else {
      // Default to Scores
      resultData = processScores(ss.getSheetByName('Scores'));
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
    cache.removeAll(['cognito_cache_scores', 'cognito_cache_rounds', 'cognito_cache_trailer', 'cognito_cache_all']);
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
 * Confidentiality Guard:
 * - Only returns rounds where Show === 'Yes'
 * - Draft rounds are completely filtered out on Google's servers
 */
function processRounds(sheet) {
  const rows = getSheetRows(sheet);
  if (!rows.length) return [];

  return rows.filter(function(r) {
    const showKey = Object.keys(r).find(function(k) { return /^show$/i.test(k); });
    const val = showKey ? (r[showKey] || '').toLowerCase() : '';
    return val === 'yes' || val === 'y' || val === 'true';
  });
}

/**
 * Process Trailer Tab
 */
function processTrailer(sheet) {
  return getSheetRows(sheet);
}

/**
 * Helper to construct JSON response with CORS headers
 */
function createJsonResponse(jsonContent) {
  const output = ContentService.createTextOutput(jsonContent);
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
