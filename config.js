/**
 * Cognito 2026 - Central Configuration File
 * 
 * Secure Edge API Proxy Integration:
 * Requests are routed through Cloudflare Pages Functions (/api/scores, /api/rounds).
 * This completely hides your private Google Sheet ID from participants and DevTools.
 */

const CONFIG = {
    // -------------------------------------------------------------
    // 1. Google Sheets Integration (Instant Apps Script + Edge Fallbacks)
    // -------------------------------------------------------------
    // OPTION A (RECOMMENDED): Instant Google Apps Script Web App (0-Second Sync)
    // Paste your deployed Apps Script URL here for instant, real-time updates:
    // e.g. "https://script.google.com/macros/s/AKfycb.../exec"
    // (See CognitoAppsScript.js for 30-second setup instructions)
    APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbytxjAtEUdT7MJzevKsb4Qm1a3LTQP23rbHTau1LA4am-2XfK-nZK5MlMrZNv__1Yu5/exec",

    // OPTION B: Local Edge / Proxy Endpoints (used if APPS_SCRIPT_URL is empty)
    SCORES_URL: "api/scores",
    ROUNDS_URL: "api/rounds",
    ELEMENTS_URL: "api/elements",
    TRAILER_URL: "api/trailer",

    // Backwards-compatible aliases:
    SCORES_CSV_URL: "api/scores",
    ROUNDS_CSV_URL: "api/rounds",
    ELEMENTS_CSV_URL: "api/elements",
    TRAILER_CSV_URL: "api/trailer",

    // Cloudflare Edge Fallback (automatically used if local endpoints are not available on college host):
    FALLBACK_SCORES_URL: "https://cognito-website-1nx.pages.dev/api/scores",
    FALLBACK_ROUNDS_URL: "https://cognito-website-1nx.pages.dev/api/rounds",
    FALLBACK_ELEMENTS_URL: "https://cognito-website-1nx.pages.dev/api/elements",
    FALLBACK_TRAILER_URL: "https://cognito-website-1nx.pages.dev/api/trailer",
    FALLBACK_SCORES_CSV_URL: "https://cognito-website-1nx.pages.dev/api/scores",
    FALLBACK_ROUNDS_CSV_URL: "https://cognito-website-1nx.pages.dev/api/rounds",
    FALLBACK_ELEMENTS_CSV_URL: "https://cognito-website-1nx.pages.dev/api/elements",
    FALLBACK_TRAILER_CSV_URL: "https://cognito-website-1nx.pages.dev/api/trailer",

    // -------------------------------------------------------------
    // 2. Official Registration & Brochure Links
    // -------------------------------------------------------------
    CASE_COMPETITION_LINK: "https://unstop.com/p/cognito-2026-case-competition-christ-deemed-to-be-university-1757438",
    CONTINGENT_QUIZ_LINK: "https://docs.google.com/forms/d/e/1FAIpQLScdrJHC2m3-GRZ4mqBJjEbPL1-E8HSMN19ZREwnKSVFGCMjZw/viewform",
    // Default brochure URL (dynamically updated via Google Sheet Elements tab)
    BROCHURE_URL: "https://drive.google.com/file/d/1lHxOWFDXlhQKVnYQ_hXjGkXNtyj1ofUB/view",

    // -------------------------------------------------------------
    // 3. Event Dates & Deadlines (IST)
    // -------------------------------------------------------------
    EVENT_DATES: "December 15, 16 & 17, 2026",
    REGISTRATION_DEADLINE_CASE: "23 November 2026",
    REGISTRATION_DEADLINE_CONTINGENT: "10 December 2026",
    REGISTRATION_CUTOFF_DATE: "2026-12-10T23:59:59+05:30",

    // -------------------------------------------------------------
    // 4. Contact & Socials
    // -------------------------------------------------------------
    CONTACT_EMAIL: "cognitodps@fest.christuniversity.in",
    INSTAGRAM_HANDLE: "cognitodps",
    INSTAGRAM_URL: "https://instagram.com/cognitodps",
    CHRIST_PORTAL_LINK: "https://christuniversity.in",

    // -------------------------------------------------------------
    // 5. Video Trailer Embed
    // -------------------------------------------------------------
    TRAILER_EMBED_URL: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0",

    // -------------------------------------------------------------
    // 6. Refresh Interval (in milliseconds)
    // -------------------------------------------------------------
    AUTO_REFRESH_INTERVAL: 60000
};