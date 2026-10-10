/**
 * Cloudflare Pages Function: /api/elements
 * Secure server-side proxy for Cognito 2026 Dynamic Elements (Trailer, Brochure, etc.).
 * 
 * Dynamically serves element configurations from Google Sheet Elements tab.
 */

const DEFAULT_ELEMENTS_URL = "https://script.google.com/macros/s/AKfycbytxjAtEUdT7MJzevKsb4Qm1a3LTQP23rbHTau1LA4am-2XfK-nZK5MlMrZNv__1Yu5/exec?sheet=Elements";

export async function onRequest(context) {
    // 1. Direct browser navigation in address bar -> redirect to homepage
    const secFetchDest = context.request.headers.get("Sec-Fetch-Dest");
    const secFetchMode = context.request.headers.get("Sec-Fetch-Mode");

    if (secFetchDest === "document" || secFetchMode === "navigate") {
        return Response.redirect(new URL("/index.html", context.request.url).toString(), 302);
    }

    const targetUrl = (context.env && context.env.ELEMENTS_CSV_URL) ? context.env.ELEMENTS_CSV_URL : DEFAULT_ELEMENTS_URL;

    if (!targetUrl) {
        return new Response("[]", {
            headers: {
                "Content-Type": "application/json; charset=utf-8",
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
            redirect: "follow",
            cf: {
                cacheTtl: 30,
                cacheEverything: true
            }
        });

        if (!response.ok) {
            return new Response("Dynamic elements data temporarily unavailable.", {
                status: response.status,
                headers: {
                    "Content-Type": "text/plain; charset=utf-8",
                    "Cache-Control": "no-store, no-cache, max-age=0"
                }
            });
        }

        const rawText = await response.text();
        const trimmed = rawText.trim();
        const isJson = trimmed.startsWith('[') || trimmed.startsWith('{');

        return new Response(rawText, {
            headers: {
                "Content-Type": isJson ? "application/json; charset=utf-8" : "text/csv; charset=utf-8",
                "Cache-Control": "public, max-age=30, s-maxage=30",
                "Access-Control-Allow-Origin": "*",
                "X-Content-Type-Options": "nosniff",
                "Content-Disposition": "inline"
            }
        });
    } catch (err) {
        return new Response("Dynamic elements service temporarily unreachable.", {
            status: 502,
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-store, no-cache, max-age=0"
            }
        });
    }
}
