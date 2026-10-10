<?php
/**
 * Cognito 2026 - PHP API Proxy for Dynamic Elements (Trailer, Brochure, etc.)
 * Deployment target: College servers running Apache/Nginx/cPanel/XAMPP with PHP.
 */

// 1. Intercept direct browser address bar navigations and redirect to homepage
$secFetchDest = $_SERVER['HTTP_SEC_FETCH_DEST'] ?? '';
$secFetchMode = $_SERVER['HTTP_SEC_MODE'] ?? '';

if ($secFetchDest === 'document' || $secFetchMode === 'navigate') {
    header('Location: ../index.html', true, 302);
    exit;
}

$sheetUrl = getenv('ELEMENTS_CSV_URL') ?: "https://script.google.com/macros/s/AKfycbytxjAtEUdT7MJzevKsb4Qm1a3LTQP23rbHTau1LA4am-2XfK-nZK5MlMrZNv__1Yu5/exec?sheet=Elements";

if (empty($sheetUrl)) {
    header("Content-Type: application/json; charset=utf-8");
    header("Cache-Control: public, max-age=30");
    header("Access-Control-Allow-Origin: *");
    header("Content-Disposition: inline");
    echo "[]";
    exit;
}

// 2. 30-second local temp cache
$cacheFile = sys_get_temp_dir() . '/cognito_elements_cache.json';
$cacheDuration = 30; // seconds

$rawResponse = '';
if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < $cacheDuration)) {
    $rawResponse = @file_get_contents($cacheFile);
}

if (!$rawResponse) {
    $ctx = stream_context_create([
        'http' => [
            'timeout' => 8,
            'header' => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) CognitoPHPProxy/2.0\r\n",
            'follow_location' => 1
        ]
    ]);
    $rawResponse = @file_get_contents($sheetUrl, false, $ctx);
    if ($rawResponse !== false && !empty(trim($rawResponse))) {
        @file_put_contents($cacheFile, $rawResponse);
    }
}

if ($rawResponse === false || empty(trim($rawResponse))) {
    http_response_code(502);
    header("Content-Type: text/plain; charset=utf-8");
    echo "Elements service temporarily unavailable.";
    exit;
}

$trimmed = trim($rawResponse);
$isJson = ($trimmed[0] === '[' || $trimmed[0] === '{');

header($isJson ? "Content-Type: application/json; charset=utf-8" : "Content-Type: text/csv; charset=utf-8");
header("Cache-Control: public, max-age=30");
header("Access-Control-Allow-Origin: *");
header("X-Content-Type-Options: nosniff");
header("Content-Disposition: inline");
echo $rawResponse;
