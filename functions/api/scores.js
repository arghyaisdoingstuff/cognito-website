/**
 * Cloudflare Pages Function: /api/scores
 * Secure server-side proxy for Cognito 2026 Leaderboard.
 * Protects the Google Sheet URL and Sheet ID from participant inspection.
 */

const DEFAULT_SCORES_URL = "https://docs.google.com/spreadsheets/d/1azc0SMZvecocJ1xZ4-Dg90e6_GePsANTaV6Cvm2mj4U/gviz/tq?tqx=out:csv&sheet=Scores";

export async function onRequest(context) {
    // Allows overriding via Cloudflare Pages Environment Variable if configured
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

        const csvData = await response.text();

        return new Response(csvData, {
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
