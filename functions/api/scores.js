/**
 * Cloudflare Pages Function: /api/scores
 * Secure server-side proxy for Cognito 2026 Leaderboard.
 * 
 * Security features:
 * 1. Blocks direct browser URL downloads (redirects to /scores.html).
 * 2. Protects Google Sheet ID and URL from inspect element.
 * 3. ABSOLUTE SCORE SCRUBBER: Normalizes raw scores into relative percentages
 *    (0.0% - 100.0%) on the server so participants NEVER receive raw numerical marks.
 * 4. 30-second edge cache preventing Google Sheets rate-limiting.
 */

const DEFAULT_SCORES_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT5JNcbtsUK-d8kVAxvy1pHwtWv45xxNeypV1mE9c-Ogp_dUMSKswaKucty3i5ZrM7WTKowW3jaKIrz/pub?gid=0&single=true&output=csv";

export async function onRequest(context) {
    // 1. If someone pastes the URL directly into their browser, redirect to the webpage
    const secFetchDest = context.request.headers.get("Sec-Fetch-Dest");
    const secFetchMode = context.request.headers.get("Sec-Fetch-Mode");
    const acceptHeader = context.request.headers.get("Accept") || "";

    if (secFetchDest === "document" || secFetchMode === "navigate" || acceptHeader.includes("text/html")) {
        return Response.redirect(new URL("/scores.html", context.request.url).toString(), 302);
    }

    const targetUrl = (context.env && context.env.SCORES_CSV_URL) ? context.env.SCORES_CSV_URL : DEFAULT_SCORES_URL;

    try {
        const response = await fetch(targetUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) CognitoCloudflareProxy/2.0"
            },
            cf: {
                cacheTtl: 30, // Cache for 30 seconds at the Cloudflare edge
                cacheEverything: true
            }
        });

        if (!response.ok) {
            return new Response("Event score data temporarily unavailable.", {
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

        // Parse header row to locate "Score" column index
        const headers = rows[0];
        const scoreIndex = headers.findIndex(h => {
            const clean = h.trim().toLowerCase();
            return clean === 'score' || clean === 'points' || clean === 'total';
        });

        // If no score column found, return as-is
        if (scoreIndex === -1) {
            return new Response(rawCsv, {
                headers: {
                    "Content-Type": "text/csv; charset=utf-8",
                    "Cache-Control": "public, max-age=30, s-maxage=30",
                    "Access-Control-Allow-Origin": "*",
                    "Content-Disposition": "inline"
                }
            });
        }

        let maxScore = 0;
        for (let i = 1; i < rows.length; i++) {
            const cols = rows[i];
            const num = parseFloat(cols[scoreIndex]) || 0;
            if (num > maxScore) maxScore = num;
        }

        // Scrub absolute scores: convert raw scores to relative percentage (0.0 to 100.0)
        // This preserves the exact rank and relative bar lengths while physically deleting the absolute points!
        const sanitizedRows = [headers];
        for (let i = 1; i < rows.length; i++) {
            const cols = rows[i];
            const rawScore = parseFloat(cols[scoreIndex]);
            const score = isNaN(rawScore) ? 0 : rawScore;
            const relativePct = maxScore > 0 ? Math.max(0, Math.min(100, (score / maxScore * 100))).toFixed(1) : "0.0";
            cols[scoreIndex] = relativePct;
            sanitizedRows.push(cols);
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

// RFC-4180 CSV line formatter
function formatCSVRow(cols) {
    return cols.map(val => {
        const str = String(val ?? '');
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    }).join(',');
}
