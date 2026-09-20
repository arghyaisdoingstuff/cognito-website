/**
 * Cognito 2026 - Central Configuration File
 * 
 * Edit this file to connect your live Google Sheets and update external links.
 * You DO NOT need to touch any HTML/CSS code on event day!
 */

const CONFIG = {
    // -------------------------------------------------------------
    // 1. Google Sheets Integration (Published as CSV)
    // -------------------------------------------------------------
    // Instructions: In Google Sheets, go to File > Share > Publish to web
    // Select the tab, choose 'Comma-separated values (.csv)', and copy the URL.
    SCORES_CSV_URL: "", 
    ROUNDS_CSV_URL: "",

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
    // Replace with your YouTube Embed URL (e.g. "https://www.youtube.com/embed/YOUR_VIDEO_ID")
    TRAILER_EMBED_URL: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0",

    // -------------------------------------------------------------
    // 6. Refresh Interval (in milliseconds)
    // -------------------------------------------------------------
    // Auto-refresh scores every 60 seconds (60000 ms)
    AUTO_REFRESH_INTERVAL: 60000
};