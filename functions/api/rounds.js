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

const DEFAULT_ROUNDS_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT5JNcbtsUK-d8kVAxvy1pHwtWv45xxNeypV1mE9c-Ogp_dUMSKswaKucty3i5ZrM7WTKowW3jaKIrz/pub?gid=1586686373&single=true&output=csv";

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

        const rawCsv = await response.text();
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

        // Parse header row to locate "Show" column index
        const headers = rows[0];
        const showIndex = headers.findIndex(h => h.trim().toLowerCase() === 'show');

        // Filter rows strictly on the server so draft rounds are never sent
        const sanitizedRows = [headers];
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (showIndex !== -1) {
                const showVal = (row[showIndex] || '').trim().toLowerCase();
                // If not explicitly "yes" or "y", drop it on the server!
                if (showVal !== 'yes' && showVal !== 'y') {
                    continue;
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
