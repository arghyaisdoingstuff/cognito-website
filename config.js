/**
 * Cognito 2026 - Central Configuration File
 * 
 * Secure Edge API Proxy Integration:
 * Requests are routed through Cloudflare Pages Functions (/api/scores, /api/rounds).
 * This completely hides your private Google Sheet ID from participants and DevTools.
 */

const CONFIG = {
    // -------------------------------------------------------------
    // 1. Google Sheets Integration (Protected via Cloudflare Edge API)
    // -------------------------------------------------------------
    // Secure internal proxies hiding the Google Sheets ID from Inspect Element:
    SCORES_CSV_URL: "/api/scores",
    ROUNDS_CSV_URL: "/api/rounds",

    // -------------------------------------------------------------
    // 2. Official Registration Links
    // -------------------------------------------------------------
    CASE_COMPETITION_LINK: "https://unstop.com/p/cognito-2026-case-competition-christ-deemed-to-be-university-1757438",
    CONTINGENT_QUIZ_LINK: "https://docs.google.com/forms/d/e/1FAIpQLScdrJHC2m3-GRZ4mqBJjEbPL1-E8HSMN19ZREwnKSVFGCMjZw/viewform",

    // -------------------------------------------------------------
    // 3. Event Dates & Deadlines (IST)
    // -------------------------------------------------------------
    EVENT_DATES: "December 15, 16 & 17, 2026",
    REGISTRATION_DEADLINE_CASE: "23 November 2026",
    REGISTRATION_DEADLINE_CONTINGENT: "10 December 2026",

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