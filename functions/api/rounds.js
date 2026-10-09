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

const DEFAULT_ROUNDS_URL = "https://docs.google.com/spreadsheets/d/1azc0SMZvecocJ1xZ4-Dg90e6_GePsANTaV6Cvm2mj4U/gviz/tq?tqx=out:csv&sheet=Rounds";

export async function onRequest(context) {
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
        const lines = rawCsv.trim().split(/\r?\n/);
        
        if (lines.length <= 1) {
            return new Response(rawCsv, {
                headers: {
                    "Content-Type": "text/csv; charset=utf-8",
                    "Cache-Control": "public, max-age=30, s-maxage=30",
                    "Access-Control-Allow-Origin": "*"
                }
            });
        }

        // Parse header row to locate "Show" column index
        const headerLine = lines[0];
        const headers = parseCSVLine(headerLine).map(h => h.trim().toLowerCase());
        const showIndex = headers.indexOf('show');

        // Filter lines strictly on the server so draft rounds are never sent
        const sanitizedLines = [headerLine];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line.trim()) continue;
            
            if (showIndex !== -1) {
                const cols = parseCSVLine(line);
                const showVal = (cols[showIndex] || '').trim().toLowerCase();
                // If not explicitly "yes" or "y", drop it on the server!
                if (showVal !== 'yes' && showVal !== 'y') {
                    continue;
                }
            }
            sanitizedLines.push(line);
        }

        return new Response(sanitizedLines.join('\n'), {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Cache-Control": "public, max-age=30, s-maxage=30",
                "Access-Control-Allow-Origin": "*",
                "X-Content-Type-Options": "nosniff"
            }
        });
    } catch (err) {
        return new Response("Service unavailable", { status: 502 });
    }
}

// Robust RFC-4180 CSV line parser handling quoted commas
function parseCSVLine(line) {
    const result = [];
    let insideQuote = false;
    let entry = '';
    
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
            if (insideQuote && line[i + 1] === '"') {
                entry += '"';
                i++;
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
