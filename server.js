/**
 * Cognito 2026 - Standalone Node.js Web Server & API Proxy
 * Zero dependencies! Uses only Node.js standard built-in libraries.
 * 
 * Usage:
 *   node server.js
 * Or with custom port:
 *   PORT=8080 node server.js
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const SCORES_SHEET_URL = process.env.SCORES_CSV_URL || "https://docs.google.com/spreadsheets/d/e/2PACX-1vT5JNcbtsUK-d8kVAxvy1pHwtWv45xxNeypV1mE9c-Ogp_dUMSKswaKucty3i5ZrM7WTKowW3jaKIrz/pub?gid=0&single=true&output=csv";
const ROUNDS_SHEET_URL = process.env.ROUNDS_CSV_URL || "https://docs.google.com/spreadsheets/d/e/2PACX-1vT5JNcbtsUK-d8kVAxvy1pHwtWv45xxNeypV1mE9c-Ogp_dUMSKswaKucty3i5ZrM7WTKowW3jaKIrz/pub?gid=1586686373&single=true&output=csv";
const TRAILER_SHEET_URL = process.env.TRAILER_CSV_URL || "https://docs.google.com/spreadsheets/d/e/2PACX-1vT5JNcbtsUK-d8kVAxvy1pHwtWv45xxNeypV1mE9c-Ogp_dUMSKswaKucty3i5ZrM7WTKowW3jaKIrz/pub?gid=265950681&single=true&output=csv";

// In-memory 30s edge cache
let scoresCache = { data: '', timestamp: 0 };
let roundsCache = { data: '', timestamp: 0 };
let trailerCache = { data: '', timestamp: 0 };
const CACHE_TTL_MS = 30000;

function fetchUrl(targetUrl) {
    return new Promise((resolve, reject) => {
        https.get(targetUrl, { headers: { 'User-Agent': 'CognitoNodeProxy/2.0' } }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return fetchUrl(res.headers.location).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                return reject(new Error(`Failed with status: ${res.statusCode}`));
            }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

function parseCSVRecords(text) {
    if (!text || !text.trim()) return [];
    const rows = [];
    let currentRow = [];
    let token = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        const n = text[i + 1];

        if (c === '"') {
            if (inQuotes && n === '"') {
                token += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (c === ',' && !inQuotes) {
            currentRow.push(token);
            token = '';
        } else if ((c === '\r' || c === '\n') && !inQuotes) {
            if (c === '\r' && n === '\n') i++;
            currentRow.push(token);
            token = '';
            if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== '')) {
                rows.push(currentRow);
            }
            currentRow = [];
        } else {
            token += c;
        }
    }
    if (token || currentRow.length) {
        currentRow.push(token);
        if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== '')) {
            rows.push(currentRow);
        }
    }
    return rows;
}

function formatCSVRow(cols) {
    return cols.map(val => {
        const str = String(val ?? '');
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    }).join(',');
}

async function handleScores(req, res) {
    const dest = req.headers['sec-fetch-dest'];
    const mode = req.headers['sec-fetch-mode'];
    const accept = req.headers['accept'] || '';

    // Direct browser navigation -> redirect to webpage
    if (dest === 'document' || mode === 'navigate' || accept.includes('text/html')) {
        res.writeHead(302, { 'Location': '/scores.html' });
        res.end();
        return;
    }

    try {
        const now = Date.now();
        let rawCsv = '';
        if (scoresCache.data && (now - scoresCache.timestamp < CACHE_TTL_MS)) {
            rawCsv = scoresCache.data;
        } else {
            rawCsv = await fetchUrl(SCORES_SHEET_URL);
            scoresCache = { data: rawCsv, timestamp: now };
        }

        const rows = parseCSVRecords(rawCsv);
        if (rows.length <= 1) {
            res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
            res.end(rawCsv);
            return;
        }

        const headers = rows[0];
        const scoreIndex = headers.findIndex(h => {
            const clean = h.trim().toLowerCase();
            return clean === 'score' || clean === 'points' || clean === 'total';
        });

        if (scoreIndex === -1) {
            res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
            res.end(rawCsv);
            return;
        }

        let maxScore = 0;
        for (let i = 1; i < rows.length; i++) {
            const cols = rows[i];
            const num = parseFloat(cols[scoreIndex]) || 0;
            if (num > maxScore) maxScore = num;
        }

        const sanitizedRows = [headers];
        for (let i = 1; i < rows.length; i++) {
            const cols = rows[i];
            const raw = parseFloat(cols[scoreIndex]);
            const score = isNaN(raw) ? 0 : raw;
            const pct = maxScore > 0 ? Math.max(0, Math.min(100, (score / maxScore * 100))).toFixed(1) : "0.0";
            cols[scoreIndex] = pct;
            sanitizedRows.push(cols);
        }

        res.writeHead(200, {
            'Content-Type': 'text/csv; charset=utf-8',
            'Cache-Control': 'public, max-age=30',
            'Access-Control-Allow-Origin': '*',
            'X-Content-Type-Options': 'nosniff',
            'Content-Disposition': 'inline'
        });
        res.end(sanitizedRows.map(formatCSVRow).join('\r\n'));
    } catch (err) {
        res.writeHead(502, { 'Content-Type': 'text/plain' });
        res.end('Service unavailable');
    }
}

async function handleRounds(req, res) {
    const dest = req.headers['sec-fetch-dest'];
    const mode = req.headers['sec-fetch-mode'];
    const accept = req.headers['accept'] || '';

    if (dest === 'document' || mode === 'navigate' || accept.includes('text/html')) {
        res.writeHead(302, { 'Location': '/rounds.html' });
        res.end();
        return;
    }

    try {
        const now = Date.now();
        let rawCsv = '';
        if (roundsCache.data && (now - roundsCache.timestamp < CACHE_TTL_MS)) {
            rawCsv = roundsCache.data;
        } else {
            rawCsv = await fetchUrl(ROUNDS_SHEET_URL);
            roundsCache = { data: rawCsv, timestamp: now };
        }

        const rows = parseCSVRecords(rawCsv);
        if (rows.length <= 1) {
            res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
            res.end(rawCsv);
            return;
        }

        const headers = rows[0];
        const showIndex = headers.findIndex(h => h.trim().toLowerCase() === 'show');

        const sanitizedRows = [headers];
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (showIndex !== -1) {
                const showVal = (row[showIndex] || '').trim().toLowerCase();
                if (showVal !== 'yes' && showVal !== 'y') continue;
            }
            sanitizedRows.push(row);
        }

        res.writeHead(200, {
            'Content-Type': 'text/csv; charset=utf-8',
            'Cache-Control': 'public, max-age=30',
            'Access-Control-Allow-Origin': '*',
            'X-Content-Type-Options': 'nosniff',
            'Content-Disposition': 'inline'
        });
        res.end(sanitizedRows.map(formatCSVRow).join('\r\n'));
    } catch (err) {
        res.writeHead(502, { 'Content-Type': 'text/plain' });
        res.end('Service unavailable');
    }
}

async function handleTrailer(req, res) {
    const dest = req.headers['sec-fetch-dest'];
    const mode = req.headers['sec-fetch-mode'];
    const accept = req.headers['accept'] || '';

    if (dest === 'document' || mode === 'navigate' || accept.includes('text/html')) {
        res.writeHead(302, { 'Location': '/index.html' });
        res.end();
        return;
    }

    if (!TRAILER_SHEET_URL) {
        res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
        res.end('URL,Show\n,');
        return;
    }

    try {
        const now = Date.now();
        let rawCsv = '';
        if (trailerCache.data && (now - trailerCache.timestamp < CACHE_TTL_MS)) {
            rawCsv = trailerCache.data;
        } else {
            rawCsv = await fetchUrl(TRAILER_SHEET_URL);
            trailerCache = { data: rawCsv, timestamp: now };
        }

        res.writeHead(200, {
            'Content-Type': 'text/csv; charset=utf-8',
            'Cache-Control': 'public, max-age=30',
            'Access-Control-Allow-Origin': '*',
            'X-Content-Type-Options': 'nosniff',
            'Content-Disposition': 'inline'
        });
        res.end(rawCsv);
    } catch (err) {
        res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
        res.end('URL,Show\n,');
    }
}

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf',
    '.webp': 'image/webp'
};

const SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': "default-src 'self' https:; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' https: data:; frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com; connect-src 'self' https:;"
};

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url);
    const pathname = parsedUrl.pathname || '/';

    if (pathname === '/api/scores') {
        return handleScores(req, res);
    }
    if (pathname === '/api/rounds') {
        return handleRounds(req, res);
    }
    if (pathname === '/api/trailer') {
        return handleTrailer(req, res);
    }

    // Static file serving with directory traversal protection
    const normalizedPath = path.normalize(pathname === '/' ? '/index.html' : pathname);
    let filePath = path.resolve(__dirname, '.' + normalizedPath);
    
    // Directory traversal guard: must stay inside workspace root
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403, { 'Content-Type': 'text/plain', ...SECURITY_HEADERS });
        res.end('403 Forbidden');
        return;
    }

    // Block hidden files, server scripts, markdown docs, and sensitive files
    const baseName = path.basename(filePath);
    if (baseName.startsWith('.') || baseName === 'server.js' || filePath.endsWith('.php') || filePath.endsWith('.md')) {
        res.writeHead(403, { 'Content-Type': 'text/plain', ...SECURITY_HEADERS });
        res.end('403 Forbidden');
        return;
    }

    // Check if path is a directory or missing .html
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
    } else if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
        filePath = filePath + '.html';
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html', ...SECURITY_HEADERS });
            res.end('<h1>404 Not Found</h1>');
            return;
        }
        const ext = path.extname(filePath).toLowerCase();
        const mime = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mime, ...SECURITY_HEADERS });
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log(`Cognito 2026 server running at http://localhost:${PORT}`);
});
