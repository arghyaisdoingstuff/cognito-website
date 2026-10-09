/**
 * Cloudflare Pages Function: /api/trailer
 * Secure server-side proxy for Cognito 2026 Trailer Release.
 * 
 * Dynamically releases the trailer video only when configured in the Google Sheet.
 */

const DEFAULT_TRAILER_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT5JNcbtsUK-d8kVAxvy1pHwtWv45xxNeypV1mE9c-Ogp_dUMSKswaKucty3i5ZrM7WTKowW3jaKIrz/pub?gid=265950681&single=true&output=csv";

export async function onRequest(context) {
    // 1. Direct browser navigation -> redirect to homepage
    const secFetchDest = context.request.headers.get("Sec-Fetch-Dest");
    const secFetchMode = context.request.headers.get("Sec-Fetch-Mode");
    const acceptHeader = context.request.headers.get("Accept") || "";

    if (secFetchDest === "document" || secFetchMode === "navigate" || acceptHeader.includes("text/html")) {
        return Response.redirect(new URL("/index.html", context.request.url).toString(), 302);
    }

    const targetUrl = (context.env && context.env.TRAILER_CSV_URL) ? context.env.TRAILER_CSV_URL : DEFAULT_TRAILER_URL;

    if (!targetUrl) {
        return new Response("URL,Show\n,", {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Cache-Control": "public, max-age=30, s-maxage=30",
                "Access-Control-Allow-Origin": "*",
                "Content-Disposition": "inline"
            }
        });
    }

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
            return new Response("URL,Show\n,", {
                headers: {
                    "Content-Type": "text/csv; charset=utf-8",
                    "Access-Control-Allow-Origin": "*"
                }
            });
        }

        const rawCsv = await response.text();
        return new Response(rawCsv, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Cache-Control": "public, max-age=30, s-maxage=30",
                "Access-Control-Allow-Origin": "*",
                "X-Content-Type-Options": "nosniff",
                "Content-Disposition": "inline"
            }
        });
    } catch (err) {
        return new Response("URL,Show\n,", {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Access-Control-Allow-Origin": "*"
            }
        });
    }
}
