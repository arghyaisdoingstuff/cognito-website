<?php
/**
 * Cognito 2026 - PHP API Proxy for Scores
 * Deployment target: College servers running Apache/Nginx/cPanel/XAMPP with PHP.
 *
 * Security features:
 * 1. Blocks direct browser URL downloads (redirects to /scores.html).
 * 2. Completely hides Google Sheet ID and private Sheet URL from inspect element.
 * 3. ABSOLUTE SCORE SCRUBBER: Converts raw numerical marks into relative percentages
 *    (0.0% - 100.0%) so participants NEVER receive raw scores over the network.
 * 4. 30-second local server caching to prevent Google Sheets rate-limiting.
 */

// 1. Intercept direct browser address bar navigations and redirect to webpage
$secFetchDest = $_SERVER['HTTP_SEC_FETCH_DEST'] ?? '';
$secFetchMode = $_SERVER['HTTP_SEC_MODE'] ?? '';
$acceptHeader = $_SERVER['HTTP_ACCEPT'] ?? '';

if ($secFetchDest === 'document' || $secFetchMode === 'navigate' || strpos($acceptHeader, 'text/html') !== false) {
    header('Location: ../scores.html', true, 302);
    exit;
}

$sheetUrl = getenv('SCORES_CSV_URL') ?: "https://docs.google.com/spreadsheets/d/e/2PACX-1vT5JNcbtsUK-d8kVAxvy1pHwtWv45xxNeypV1mE9c-Ogp_dUMSKswaKucty3i5ZrM7WTKowW3jaKIrz/pub?gid=0&single=true&output=csv";

// 2. 30-second local temp cache
$cacheFile = sys_get_temp_dir() . '/cognito_scores_cache.csv';
$cacheDuration = 30; // seconds

$rawCsv = '';
if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < $cacheDuration)) {
    $rawCsv = @file_get_contents($cacheFile);
}

if (!$rawCsv) {
    $ctx = stream_context_create([
        'http' => [
            'timeout' => 8,
            'header' => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) CognitoPHPProxy/2.0\r\n"
        ]
    ]);
    $fetched = @file_get_contents($sheetUrl, false, $ctx);
    if ($fetched !== false && strlen(trim($fetched)) > 0) {
        $rawCsv = $fetched;
        @file_put_contents($cacheFile, $rawCsv, LOCK_EX);
    } elseif (file_exists($cacheFile)) {
        $rawCsv = @file_get_contents($cacheFile);
    }
}

if (!$rawCsv) {
    http_response_code(502);
    header("Content-Type: text/plain; charset=utf-8");
    echo "Scores data temporarily unavailable.";
    exit;
}

// 3. Absolute Score Scrubber using multiline-safe stream
$stream = fopen('php://temp', 'r+');
fwrite($stream, $rawCsv);
rewind($stream);

$rows = [];
while (($row = fgetcsv($stream)) !== false) {
    if (!empty($row) && !(count($row) === 1 && $row[0] === null)) {
        $rows[] = $row;
    }
}
fclose($stream);

if (count($rows) <= 1) {
    header("Content-Type: text/csv; charset=utf-8");
    header("Cache-Control: public, max-age=30");
    header("Access-Control-Allow-Origin: *");
    header("Content-Disposition: inline");
    echo $rawCsv;
    exit;
}

$headers = $rows[0];
$scoreIndex = -1;

foreach ($headers as $idx => $hdr) {
    $clean = strtolower(trim($hdr));
    if ($clean === 'score' || $clean === 'points' || $clean === 'total') {
        $scoreIndex = $idx;
        break;
    }
}

// If score column is found, scrub raw numbers to relative percentage
if ($scoreIndex !== -1) {
    $maxScore = 0.0;
    for ($i = 1; $i < count($rows); $i++) {
        $val = floatval($rows[$i][$scoreIndex] ?? 0);
        if ($val > $maxScore) $maxScore = $val;
    }

    for ($i = 1; $i < count($rows); $i++) {
        $val = floatval($rows[$i][$scoreIndex] ?? 0);
        $clampedVal = max(0.0, $val);
        $pct = $maxScore > 0 ? number_format(min(100.0, ($clampedVal / $maxScore) * 100), 1, '.', '') : "0.0";
        $rows[$i][$scoreIndex] = $pct;
    }
}

// 4. Send sanitized CSV with secure inline headers
header("Content-Type: text/csv; charset=utf-8");
header("Cache-Control: public, max-age=30");
header("Access-Control-Allow-Origin: *");
header("X-Content-Type-Options: nosniff");
header("Content-Disposition: inline");

$out = fopen('php://output', 'w');
foreach ($rows as $row) {
    fputcsv($out, $row);
}
fclose($out);
exit;
