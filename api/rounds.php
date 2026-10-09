<?php
/**
 * Cognito 2026 - PHP API Proxy for Rounds & Timeline
 * Deployment target: College servers running Apache/Nginx/cPanel/XAMPP with PHP.
 *
 * Security features:
 * 1. Blocks direct browser URL downloads (redirects to /rounds.html).
 * 2. Completely hides Google Sheet ID and private Sheet URL from inspect element.
 * 3. PRE-FILTERS unreleased/draft rounds (Show != "Yes") so participants
 *    CANNOT inspect future rounds in the Network tab.
 * 4. 30-second local server caching to prevent Google Sheets rate-limiting.
 */

// 1. Intercept direct browser address bar navigations and redirect to webpage
$secFetchDest = $_SERVER['HTTP_SEC_FETCH_DEST'] ?? '';
$secFetchMode = $_SERVER['HTTP_SEC_MODE'] ?? '';
$acceptHeader = $_SERVER['HTTP_ACCEPT'] ?? '';

if ($secFetchDest === 'document' || $secFetchMode === 'navigate' || strpos($acceptHeader, 'text/html') !== false) {
    header('Location: ../rounds.html', true, 302);
    exit;
}

$sheetUrl = getenv('ROUNDS_CSV_URL') ?: "https://docs.google.com/spreadsheets/d/e/2PACX-1vT5JNcbtsUK-d8kVAxvy1pHwtWv45xxNeypV1mE9c-Ogp_dUMSKswaKucty3i5ZrM7WTKowW3jaKIrz/pub?gid=1586686373&single=true&output=csv";

// 2. 30-second local temp cache
$cacheFile = sys_get_temp_dir() . '/cognito_rounds_cache.csv';
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
        @file_put_contents($cacheFile, $rawCsv);
    } elseif (file_exists($cacheFile)) {
        $rawCsv = @file_get_contents($cacheFile);
    }
}

if (!$rawCsv) {
    http_response_code(502);
    header("Content-Type: text/plain; charset=utf-8");
    echo "Rounds data temporarily unavailable.";
    exit;
}

// 3. Filter unreleased draft rounds (Show == "Yes")
$lines = preg_split('/\r\n|\r|\n/', trim($rawCsv));
if (count($lines) <= 1) {
    header("Content-Type: text/csv; charset=utf-8");
    header("Cache-Control: public, max-age=30");
    header("Access-Control-Allow-Origin: *");
    header("Content-Disposition: inline");
    echo $rawCsv;
    exit;
}

$rows = array_map('str_getcsv', $lines);
$headers = $rows[0];
$showIndex = -1;

foreach ($headers as $idx => $hdr) {
    if (strtolower(trim($hdr)) === 'show') {
        $showIndex = $idx;
        break;
    }
}

$filteredRows = [$headers];
for ($i = 1; $i < count($rows); $i++) {
    $row = $rows[$i];
    if (empty($row) || (count($row) === 1 && $row[0] === '')) continue;
    if ($showIndex !== -1) {
        $val = strtolower(trim($row[$showIndex] ?? ''));
        // If not explicitly "yes" or "y", drop it completely on the server!
        if ($val !== 'yes' && $val !== 'y') continue;
    }
    $filteredRows[] = $row;
}

// 4. Output sanitized CSV
header("Content-Type: text/csv; charset=utf-8");
header("Cache-Control: public, max-age=30");
header("Access-Control-Allow-Origin: *");
header("X-Content-Type-Options: nosniff");
header("Content-Disposition: inline");

$out = fopen('php://output', 'w');
foreach ($filteredRows as $row) {
    fputcsv($out, $row);
}
fclose($out);
exit;
