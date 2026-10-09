<?php
/**
 * Cognito 2026 - PHP API Proxy for Trailer Release
 * Deployment target: College servers running Apache/Nginx/cPanel/XAMPP with PHP.
 */

// 1. Intercept direct browser address bar navigations and redirect to homepage
$secFetchDest = $_SERVER['HTTP_SEC_FETCH_DEST'] ?? '';
$secFetchMode = $_SERVER['HTTP_SEC_MODE'] ?? '';

if ($secFetchDest === 'document' || $secFetchMode === 'navigate') {
    header('Location: ../index.html', true, 302);
    exit;
}

$sheetUrl = getenv('TRAILER_CSV_URL') ?: "https://docs.google.com/spreadsheets/d/e/2PACX-1vT5JNcbtsUK-d8kVAxvy1pHwtWv45xxNeypV1mE9c-Ogp_dUMSKswaKucty3i5ZrM7WTKowW3jaKIrz/pub?gid=265950681&single=true&output=csv";

if (empty($sheetUrl)) {
    header("Content-Type: text/csv; charset=utf-8");
    header("Cache-Control: public, max-age=30");
    header("Access-Control-Allow-Origin: *");
    header("Content-Disposition: inline");
    echo "URL,Show\n,";
    exit;
}

// 2. 30-second local temp cache
$cacheFile = sys_get_temp_dir() . '/cognito_trailer_cache.csv';
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
    header("Cache-Control: no-cache, no-store");
    echo "Trailer data temporarily unavailable.";
    exit;
}

header("Content-Type: text/csv; charset=utf-8");
header("Cache-Control: public, max-age=30");
header("Access-Control-Allow-Origin: *");
header("X-Content-Type-Options: nosniff");
header("Content-Disposition: inline");

echo $rawCsv;
exit;
