/**
 * Cloudflare Pages Function: /api/rounds
 * Secure server-side proxy for Cognito 2026 Rounds & Timeline.
 * 
 * Security features:
 * 1. Hides Google Sheet ID and URL from inspect element.
 * 2. Pre-filters out any hidden/unreleased drafts (Show != "Yes") so participants
 *    CANNOT read upcoming surprise rounds in the Network tab.
 * 3. 30-second edge cache preventing Google Sheets rate-limiting.
 */

const DEFAULT_ROUNDS_URL = "https://script.google.com/macros/s/AKfycbytxjAtEUdT7MJzevKsb4Qm1a3LTQP23rbHTau1LA4am-2XfK-nZK5MlMrZNv__1Yu5/exec?sheet=Rounds";

export async function onRequest(context) {
    // If someone pastes the URL directly into their browser, redirect to the webpage
    const secFetchDest = context.request.headers.get("Sec-Fetch-Dest");
    const secFetchMode = context.request.headers.get("Sec-Fetch-Mode");
    const acceptHeader = context.request.headers.get("Accept") || "";

    if (secFetchDest === "document" || secFetchMode === "navigate" || acceptHeader.includes("text/html")) {
        return Response.redirect(new URL("/rounds.html", context.request.url).toString(), 302);
    }

    const targetUrl = (context.env && context.env.ROUNDS_CSV_URL) ? context.env.ROUNDS_CSV_URL : DEFAULT_ROUNDS_URL;

    try {
        const response = await fetch(targetUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) CognitoCloudflareProxy/2.0"
            },
            cf: {
                cacheTtl: 30,
                cacheEverything: true
            }
        });

        if (!response.ok) {
            return new Response("Rounds data temporarily unavailable.", {
                status: response.status,
                headers: { "Content-Type": "text/plain; charset=utf-8" }
            });
        }

        const rawText = await response.text();
        const trimmed = rawText.trim();

        // If upstream returns JSON (from Google Apps Script), forward directly with edge cache
        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
            return new Response(rawText, {
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                    "Cache-Control": "public, max-age=30, s-maxage=30",
                    "Access-Control-Allow-Origin": "*",
                    "X-Content-Type-Options": "nosniff",
                    "Content-Disposition": "inline"
                }
            });
        }

        const rawCsv = rawText;
        const rows = parseCSVRecords(rawCsv);
        
        if (rows.length <= 1) {
            return new Response(rawCsv, {
                headers: {
                    "Content-Type": "text/csv; charset=utf-8",
                    "Cache-Control": "public, max-age=30, s-maxage=30",
                    "Access-Control-Allow-Origin": "*",
                    "Content-Disposition": "inline"
                }
            });
        }

        // Parse header row to locate "Show" and link/date column indices
        const headers = rows[0];
        const showIndex = headers.findIndex(h => h.trim().toLowerCase() === 'show');
        const briefIndices = headers.map((h, idx) => /brief|problem|case.*link|drive/i.test(h) ? idx : -1).filter(idx => idx !== -1);
        const submitIndices = headers.map((h, idx) => /submit/i.test(h) ? idx : -1).filter(idx => idx !== -1);
        const relDateIdx = headers.findIndex(h => /release.*date|date.*release/i.test(h));
        const relTimeIdx = headers.findIndex(h => /release.*time|time.*release/i.test(h));
        const genDateIdx = headers.findIndex(h => /date/i.test(h) && !/deadline/i.test(h));

        // Filter rows strictly on the server so draft rounds and locked links are never sent
        const sanitizedRows = [headers];
        const IST_OFFSET_MS = 19800000;
        const nowMs = Date.now();

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (showIndex !== -1) {
                const showVal = (row[showIndex] || '').trim().toLowerCase();
                // If not explicitly "yes" or "y", drop it on the server!
                if (showVal !== 'yes' && showVal !== 'y') {
                    continue;
                }
            }

            // Server-side Link Lockdown: If release time is in the future, redact briefs and submission links
            const dateStr = (relDateIdx !== -1 && row[relDateIdx]) ? row[relDateIdx].trim() : ((genDateIdx !== -1 && row[genDateIdx]) ? row[genDateIdx].trim() : '');
            const timeStr = (relTimeIdx !== -1 && row[relTimeIdx]) ? row[relTimeIdx].trim() : '';

            if (dateStr) {
                let y = 0, m = 0, d = 0;
                const isoMatch = dateStr.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
                if (isoMatch) {
                    y = parseInt(isoMatch[1], 10);
                    m = parseInt(isoMatch[2], 10);
                    d = parseInt(isoMatch[3], 10);
                } else {
                    const parts = dateStr.split(/[\/\-\.]/);
                    if (parts.length >= 3) {
                        d = parseInt(parts[0], 10);
                        m = parseInt(parts[1], 10);
                        y = parseInt(parts[2], 10);
                        if (d > 31 && y <= 31) { const t = d; d = y; y = t; }
                    }
                }

                if (y && m && d) {
                    let hrs = 0, mins = 0;
                    if (timeStr) {
                        const tp = timeStr.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
                        if (tp) {
                            hrs = parseInt(tp[1], 10);
                            mins = parseInt(tp[2], 10);
                            const ap = tp[3] ? tp[3].toLowerCase() : null;
                            if (ap === 'pm' && hrs < 12) hrs += 12;
                            if (ap === 'am' && hrs === 12) hrs = 0;
                        }
                    }
                    const targetUtc = Date.UTC(y, m - 1, d, hrs, mins, 0) - IST_OFFSET_MS;
                    if (nowMs < targetUtc) {
                        briefIndices.forEach(idx => { if (row[idx]) row[idx] = ''; });
                        submitIndices.forEach(idx => { if (row[idx]) row[idx] = ''; });
                    }
                }
            }

            sanitizedRows.push(row);
        }

        const sanitizedCsv = sanitizedRows.map(formatCSVRow).join('\r\n');

        return new Response(sanitizedCsv, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Cache-Control": "public, max-age=30, s-maxage=30",
                "Access-Control-Allow-Origin": "*",
                "X-Content-Type-Options": "nosniff",
                "Content-Disposition": "inline"
            }
        });
    } catch (err) {
        return new Response("Service unavailable", { status: 502 });
    }
}

// Robust RFC-4180 multiline CSV record parser
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

// RFC-4180 CSV row formatter
function formatCSVRow(cols) {
    return cols.map(val => {
        const str = String(val ?? '');
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    }).join(',');
}
