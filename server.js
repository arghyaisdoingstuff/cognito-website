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
const SCORES_SHEET_URL = process.env.SCORES_CSV_URL || "https://docs.google.com/spreadsheets/d/1azc0SMZvecocJ1xZ4-Dg90e6_GePsANTaV6Cvm2mj4U/gviz/tq?tqx=out:csv&sheet=Scores";
const ROUNDS_SHEET_URL = process.env.ROUNDS_CSV_URL || "https://docs.google.com/spreadsheets/d/1azc0SMZvecocJ1xZ4-Dg90e6_GePsANTaV6Cvm2mj4U/gviz/tq?tqx=out:csv&sheet=Rounds";

// In-memory 30s edge cache
let scoresCache = { data: '', timestamp: 0 };
let roundsCache = { data: '', timestamp: 0 };
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

function parseCSVLine(line) {
    const result = [];
    let insideQuote = false;
    let entry = '';
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
            if (insideQuote && line[i + 1] === '"') {
                entry += '"'; i++;
            } else {
                insideQuote = !insideQuote;
            }
        } else if (c === ',' && !insideQuote) {
            result.push(entry);
            entry = '';
        } else {
            entry += c;
        }
    }
    result.push(entry);
    return result;
}

function formatCSVRow(cols) {
    return cols.map(val => {
        const str = String(val ?? '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
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

        const lines = rawCsv.trim().split(/\r?\n/);
        if (lines.length <= 1) {
            res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
            res.end(rawCsv);
            return;
        }

        const headers = parseCSVLine(lines[0]);
        const scoreIndex = headers.findIndex(h => {
            const clean = h.trim().toLowerCase();
            return clean === 'score' || clean === 'points' || clean === 'total';
        });

        if (scoreIndex === -1) {
            res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
            res.end(rawCsv);
            return;
        }

        const rows = [];
        let maxScore = 0;
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const cols = parseCSVLine(lines[i]);
            const num = parseFloat(cols[scoreIndex]) || 0;
            if (num > maxScore) maxScore = num;
            rows.push(cols);
        }

        const sanitizedLines = [formatCSVRow(headers)];
        for (const cols of rows) {
            const raw = parseFloat(cols[scoreIndex]) || 0;
            const pct = maxScore > 0 ? ((raw / maxScore) * 100).toFixed(1) : "0.0";
            cols[scoreIndex] = pct;
            sanitizedLines.push(formatCSVRow(cols));
        }

        res.writeHead(200, {
            'Content-Type': 'text/csv; charset=utf-8',
            'Cache-Control': 'public, max-age=30',
            'Access-Control-Allow-Origin': '*',
            'X-Content-Type-Options': 'nosniff',
            'Content-Disposition': 'inline'
        });
        res.end(sanitizedLines.join('\n'));
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

        const lines = rawCsv.trim().split(/\r?\n/);
        if (lines.length <= 1) {
            res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
            res.end(rawCsv);
            return;
        }

        const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
        const showIndex = headers.indexOf('show');

        const sanitizedLines = [lines[0]];
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            if (showIndex !== -1) {
                const cols = parseCSVLine(lines[i]);
                const showVal = (cols[showIndex] || '').trim().toLowerCase();
                if (showVal !== 'yes' && showVal !== 'y') continue;
            }
            sanitizedLines.push(lines[i]);
        }

        res.writeHead(200, {
            'Content-Type': 'text/csv; charset=utf-8',
            'Cache-Control': 'public, max-age=30',
            'Access-Control-Allow-Origin': '*',
            'X-Content-Type-Options': 'nosniff',
            'Content-Disposition': 'inline'
        });
        res.end(sanitizedLines.join('\n'));
    } catch (err) {
        res.writeHead(502, { 'Content-Type': 'text/plain' });
        res.end('Service unavailable');
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
    '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url);
    const pathname = parsedUrl.pathname;

    if (pathname === '/api/scores') {
        return handleScores(req, res);
    }
    if (pathname === '/api/rounds') {
        return handleRounds(req, res);
    }

    // Static file serving
    let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
    
    // Check if path is a directory or missing .html
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
    } else if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
        filePath = filePath + '.html';
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 Not Found</h1>');
            return;
        }
        const ext = path.extname(filePath).toLowerCase();
        const mime = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': mime });
        res.end(data);
    });
});

server.listen(PORT, () => {
    console.log(`Cognito 2026 server running at http://localhost:${PORT}`);
});
