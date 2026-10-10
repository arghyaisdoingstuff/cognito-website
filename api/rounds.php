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

$sheetUrl = getenv('ROUNDS_CSV_URL') ?: "https://script.google.com/macros/s/AKfycbytxjAtEUdT7MJzevKsb4Qm1a3LTQP23rbHTau1LA4am-2XfK-nZK5MlMrZNv__1Yu5/exec?sheet=Rounds";

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
            'header' => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) CognitoPHPProxy/2.0\r\n",
            'follow_location' => 1
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
    echo "Rounds data temporarily unavailable.";
    exit;
}

$trimmed = trim($rawCsv);
if (strpos($trimmed, '[') === 0 || strpos($trimmed, '{') === 0) {
    header("Content-Type: application/json; charset=utf-8");
    header("Cache-Control: public, max-age=30");
    header("Access-Control-Allow-Origin: *");
    header("X-Content-Type-Options: nosniff");
    echo $rawCsv;
    exit;
}

// 3. Filter unreleased draft rounds (Show == "Yes") using multiline-safe stream
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
$showIndex = -1;
$briefIndices = [];
$submitIndices = [];
$relDateIdx = -1;
$relTimeIdx = -1;
$genDateIdx = -1;

foreach ($headers as $idx => $hdr) {
    $cleanHdr = strtolower(trim($hdr));
    if ($cleanHdr === 'show') $showIndex = $idx;
    if (preg_match('/brief|problem|case.*link|drive/i', $cleanHdr)) $briefIndices[] = $idx;
    if (preg_match('/submit/i', $cleanHdr)) $submitIndices[] = $idx;
    if (preg_match('/release.*date|date.*release/i', $cleanHdr)) $relDateIdx = $idx;
    if (preg_match('/release.*time|time.*release/i', $cleanHdr)) $relTimeIdx = $idx;
    if (preg_match('/date/i', $cleanHdr) && !preg_match('/deadline/i', $cleanHdr) && $genDateIdx === -1) $genDateIdx = $idx;
}

$nowUtc = time();
$filteredRows = [$headers];
for ($i = 1; $i < count($rows); $i++) {
    $row = $rows[$i];
    if (empty($row) || (count($row) === 1 && $row[0] === '')) continue;
    if ($showIndex !== -1) {
        $val = strtolower(trim($row[$showIndex] ?? ''));
        // If not explicitly "yes" or "y", drop it completely on the server!
        if ($val !== 'yes' && $val !== 'y') continue;
    }

    // Link Lockdown for future rounds
    $dateStr = ($relDateIdx !== -1 && !empty($row[$relDateIdx])) ? trim($row[$relDateIdx]) : (($genDateIdx !== -1 && !empty($row[$genDateIdx])) ? trim($row[$genDateIdx]) : '');
    $timeStr = ($relTimeIdx !== -1 && !empty($row[$relTimeIdx])) ? trim($row[$relTimeIdx]) : '';

    if (!empty($dateStr)) {
        $targetUtc = false;
        // Parse date in IST
        $dtObj = DateTime::createFromFormat('d/m/Y H:i', "$dateStr " . (!empty($timeStr) ? $timeStr : '00:00'), new DateTimeZone('Asia/Kolkata'));
        if (!$dtObj) {
            $dtObj = DateTime::createFromFormat('Y-m-d H:i', "$dateStr " . (!empty($timeStr) ? $timeStr : '00:00'), new DateTimeZone('Asia/Kolkata'));
        }
        if (!$dtObj) {
            $dtObj = DateTime::createFromFormat('d-m-Y H:i', "$dateStr " . (!empty($timeStr) ? $timeStr : '00:00'), new DateTimeZone('Asia/Kolkata'));
        }
        if ($dtObj) {
            $targetUtc = $dtObj->getTimestamp();
            if ($nowUtc < $targetUtc) {
                foreach ($briefIndices as $bIdx) { if (isset($row[$bIdx])) $row[$bIdx] = ''; }
                foreach ($submitIndices as $sIdx) { if (isset($row[$sIdx])) $row[$sIdx] = ''; }
            }
        }
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
