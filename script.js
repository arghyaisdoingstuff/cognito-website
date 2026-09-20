/**
 * Cognito 2026 - Client Engine
 * Scroll Reveals, Page Transitions, CSV Parsing, Rounds Timer, Leaderboard (Contingent only)
 */

// ──────────────────────────────────────────────────────────────
// 1. SCROLL REVEAL (Intersection Observer)
// ──────────────────────────────────────────────────────────────
function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal, .reveal-scale, .reveal-left, .reveal-right');
    if (!reveals.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Fire once
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    reveals.forEach(el => observer.observe(el));
}

// ──────────────────────────────────────────────────────────────
// 2. CSV PARSER (handles quotes, multiline)
// ──────────────────────────────────────────────────────────────
function parseCSV(text) {
    if (!text || !text.trim()) return [];
    const lines = [];
    let currentLine = [];
    let token = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const c = text[i], n = text[i + 1];
        if (c === '"') {
            if (inQuotes && n === '"') { token += '"'; i++; }
            else inQuotes = !inQuotes;
        } else if (c === ',' && !inQuotes) {
            currentLine.push(token.trim()); token = '';
        } else if ((c === '\r' || c === '\n') && !inQuotes) {
            if (c === '\r' && n === '\n') i++;
            currentLine.push(token.trim());
            if (currentLine.some(t => t !== '')) lines.push(currentLine);
            currentLine = []; token = '';
        } else {
            token += c;
        }
    }
    if (token || currentLine.length) {
        currentLine.push(token.trim());
        if (currentLine.some(t => t !== '')) lines.push(currentLine);
    }
    if (lines.length < 2) return [];
    const headers = lines[0].map(h => h.trim());
    return lines.slice(1).map(row => {
        const obj = {};
        headers.forEach((h, idx) => { obj[h] = row[idx] ? row[idx].trim() : ''; });
        return obj;
    });
}

// ──────────────────────────────────────────────────────────────
// 3. SAMPLE DATA (Brochure-Accurate Fallbacks)
// ──────────────────────────────────────────────────────────────
const SAMPLE_ROUNDS = [
    {
        Event: "Case Competition", Round: "Round 1 - Preliminary Case",
        Title: "The Valuation Dilemma: Alternative Assets & Hedging",
        Description: "Analyze portfolio risk allocation for a multi-million sovereign fund navigating macroeconomic volatility.",
        Release: "2026-11-15 10:00", Deadline: "2026-11-25 23:59",
        BriefLink: "#", SubmitLink: "#", Show: "Yes"
    },
    {
        Event: "Case Competition", Round: "Final Round - Executive Pitch",
        Title: "Corporate Restructuring & Distress M&A",
        Description: "Qualified teams defend their recommendations before industry specialists and executive jury.",
        Release: "2026-12-01 10:00", Deadline: "2026-12-11 18:00",
        BriefLink: "#", SubmitLink: "#", Show: "Yes"
    },
    {
        Event: "Contingent", Round: "Prelims - The Qualifier",
        Title: "Corporate Genesis & Market Entry",
        Description: "Comprehensive cross-functional simulation testing the contingent's agility, strategy, and resource allocation.",
        Release: "2026-12-15 09:30", Deadline: "2026-12-15 14:00",
        BriefLink: "#", SubmitLink: "#", Show: "Yes"
    },
    {
        Event: "Contingent", Round: "Semi-Finals - Crisis Management",
        Title: "Hostile Takeover & Stakeholder Defense",
        Description: "A sudden supply-chain collapse threatens corporate continuity. Re-align strategies live.",
        Release: "2026-12-16 10:00", Deadline: "2026-12-16 16:00",
        BriefLink: "#", SubmitLink: "#", Show: "Yes"
    },
    {
        Event: "Contingent", Round: "Grand Finale",
        Title: "The Final Conquest",
        Description: "The overarching storyline reaches its climax. Top contingents battle live for the Cognito 2026 Trophy.",
        Release: "2026-12-17 11:00", Deadline: "2026-12-17 17:30",
        BriefLink: "#", SubmitLink: "#", Show: "Yes"
    }
];

const SAMPLE_SCORES = [
    { Event: "Contingent", Round: "Overall", Team: "Apex Capital", College: "SRCC, New Delhi", Score: "284" },
    { Event: "Contingent", Round: "Overall", Team: "Vanguard Syndicate", College: "St. Xavier's College, Mumbai", Score: "278" },
    { Event: "Contingent", Round: "Overall", Team: "Valuation Titans", College: "Loyola College, Chennai", Score: "265" },
    { Event: "Contingent", Round: "Overall", Team: "Zenith Enterprises", College: "NMIMS, Mumbai", Score: "258" },
    { Event: "Contingent", Round: "Overall", Team: "Alpha Strategists", College: "SSCBS, Delhi", Score: "251" },
    { Event: "Contingent", Round: "Overall", Team: "Quantum Hawks", College: "Christ (Deemed to be University)", Score: "244" },
    { Event: "Contingent", Round: "Overall", Team: "Catalyst Corp", College: "Symbiosis (SCMS), Pune", Score: "238" },
    { Event: "Contingent", Round: "Overall", Team: "Equinox Consulting", College: "St. Joseph's University, Bengaluru", Score: "229" }
];

// ──────────────────────────────────────────────────────────────
// 4. ROUNDS ENGINE
// ──────────────────────────────────────────────────────────────
let activeRoundFilter = 'All';

async function initRounds() {
    const container = document.getElementById('rounds-container');
    if (!container) return;

    let roundsData = [];
    let isLive = false;

    if (CONFIG.ROUNDS_CSV_URL && CONFIG.ROUNDS_CSV_URL.trim() !== "") {
        try {
            const res = await fetch(CONFIG.ROUNDS_CSV_URL);
            roundsData = parseCSV(await res.text());
            isLive = true;
        } catch (e) { roundsData = SAMPLE_ROUNDS; }
    } else {
        roundsData = SAMPLE_ROUNDS;
    }

    renderRounds(roundsData, isLive);

    document.querySelectorAll('[data-round-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-round-filter]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeRoundFilter = btn.getAttribute('data-round-filter');
            renderRounds(roundsData, isLive);
        });
    });
}

function renderRounds(data, isLive) {
    const container = document.getElementById('rounds-container');
    const notice = document.getElementById('rounds-notice');
    if (!container) return;

    if (notice) {
        notice.innerHTML = isLive
            ? `<div class="sample-banner"><div class="live-indicator"><span class="live-dot"></span> <strong>Live Sync Active</strong></div></div>`
            : `<div class="sample-banner"><strong>Preview Mode</strong> — Connect your Google Sheet CSV in config.js for live data.</div>`;
    }

    const filtered = data.filter(r => {
        if ((r.Show || 'yes').toLowerCase() !== 'yes') return false;
        if (activeRoundFilter === 'All') return true;
        return (r.Event || '').toLowerCase().includes(activeRoundFilter.toLowerCase());
    });

    if (!filtered.length) {
        container.innerHTML = `<div class="card text-center" style="grid-column:1/-1;padding:40px;"><h3>No rounds listed in this category yet.</h3><p>Round schedules will appear here automatically.</p></div>`;
        return;
    }

    const now = new Date();
    container.innerHTML = filtered.map((r, idx) => {
        const release = new Date(r.Release ? r.Release.replace(/-/g, '/') : '');
        const deadline = new Date(r.Deadline ? r.Deadline.replace(/-/g, '/') : '');
        const valid = !isNaN(release) && !isNaN(deadline);
        let badge = '', timeInfo = '', actions = '';

        if (!valid) {
            badge = `<span class="status-badge live">Scheduled</span>`;
            timeInfo = `<div class="round-meta-item"><span><strong>Schedule:</strong> TBA</span></div>`;
            actions = `<a href="${r.BriefLink||'#'}" target="_blank" class="btn btn-outline">Read Brief</a><a href="${r.SubmitLink||'#'}" target="_blank" class="btn btn-cyan">Submit</a>`;
        } else if (now < release) {
            const diff = release - now;
            const d = Math.floor(diff / 864e5), h = Math.floor((diff / 36e5) % 24);
            badge = `<span class="status-badge locked">🔒 Unlocks Soon</span>`;
            timeInfo = `<div class="round-meta-item"><span><strong>Unlocks:</strong> ${release.toLocaleString('en-IN',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})} IST</span></div>
                        <div class="round-meta-item"><span><strong>Countdown:</strong> ${d > 0 ? d + 'd ' : ''}${h}h</span></div>`;
            actions = `<button class="btn btn-secondary" disabled style="opacity:0.5;cursor:not-allowed;width:100%">Locked until Release</button>`;
        } else if (now <= deadline) {
            badge = `<span class="status-badge live">🟢 Accepting Submissions</span>`;
            timeInfo = `<div class="round-meta-item"><span><strong>Deadline:</strong> ${deadline.toLocaleString('en-IN',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})} IST</span></div>`;
            actions = `<a href="${r.BriefLink}" target="_blank" class="btn btn-outline">Read Case Brief</a><a href="${r.SubmitLink}" target="_blank" class="btn btn-cyan">Submit Solution</a>`;
        } else {
            badge = `<span class="status-badge closed">🔴 Closed</span>`;
            timeInfo = `<div class="round-meta-item"><span><strong>Deadline Passed:</strong> ${deadline.toLocaleString('en-IN',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})} IST</span></div>`;
            actions = `<a href="${r.BriefLink}" target="_blank" class="btn btn-outline" style="width:100%">View Brief</a>`;
        }

        return `
        <div class="card round-card card-accent-top reveal reveal-delay-${(idx % 4) + 1}">
            <div>
                <div class="round-header"><div><span class="round-event-tag">${r.Event}</span><h3 class="round-name">${r.Round}</h3></div>${badge}</div>
                <h4 style="color:var(--text-primary);font-size:1.05rem;margin-bottom:8px">${r.Title||''}</h4>
                <p style="margin-bottom:16px">${r.Description||''}</p>
                ${timeInfo}
            </div>
            <div class="round-actions">${actions}</div>
        </div>`;
    }).join('');

    // Re-observe new cards for scroll reveal
    initScrollReveal();
}

// ──────────────────────────────────────────────────────────────
// 5. LEADERBOARD (Contingent Only)
// ──────────────────────────────────────────────────────────────
let allScoresData = [];
let searchQuery = '';

async function initScores() {
    const container = document.getElementById('scores-table-container');
    if (!container) return;

    let isLive = false;
    if (CONFIG.SCORES_CSV_URL && CONFIG.SCORES_CSV_URL.trim() !== "") {
        try {
            const res = await fetch(CONFIG.SCORES_CSV_URL);
            allScoresData = parseCSV(await res.text());
            isLive = true;
        } catch (e) { allScoresData = SAMPLE_SCORES; }
    } else {
        allScoresData = SAMPLE_SCORES;
    }

    renderLeaderboard(isLive);

    const search = document.getElementById('scores-search');
    if (search) {
        search.addEventListener('input', e => {
            searchQuery = e.target.value.toLowerCase().trim();
            renderLeaderboard(isLive);
        });
    }

    if (isLive && CONFIG.AUTO_REFRESH_INTERVAL) {
        setInterval(async () => {
            try {
                const res = await fetch(CONFIG.SCORES_CSV_URL);
                allScoresData = parseCSV(await res.text());
                renderLeaderboard(true);
            } catch (e) {}
        }, CONFIG.AUTO_REFRESH_INTERVAL);
    }
}

function renderLeaderboard(isLive) {
    const container = document.getElementById('scores-table-container');
    const notice = document.getElementById('scores-notice');
    if (!container) return;

    if (notice) {
        notice.innerHTML = isLive
            ? `<div class="sample-banner"><div class="live-indicator"><span class="live-dot"></span> <strong>Live Leaderboard</strong> — auto-refreshes from control sheet.</div><span style="font-size:0.78rem;color:var(--text-dim)">Updated: ${new Date().toLocaleTimeString()}</span></div>`
            : `<div class="sample-banner"><strong>Preview Mode</strong> — Connect your Google Sheet CSV in config.js to stream real scores.</div>`;
    }

    // Filter to Contingent only
    let filtered = allScoresData.filter(row => {
        const ev = (row.Event || '').toLowerCase();
        return ev.includes('contingent');
    });

    if (searchQuery) {
        filtered = filtered.filter(row =>
            (row.Team || '').toLowerCase().includes(searchQuery) ||
            (row.College || '').toLowerCase().includes(searchQuery)
        );
    }

    filtered.sort((a, b) => (parseFloat(b.Score) || 0) - (parseFloat(a.Score) || 0));

    if (!filtered.length) {
        container.innerHTML = `<div class="card text-center" style="padding:40px"><h3>No teams found${searchQuery ? ' for "' + searchQuery + '"' : ''}.</h3><p>Scores will appear here once published.</p></div>`;
        return;
    }

    container.innerHTML = `
    <div class="table-responsive">
        <table class="leaderboard-table">
            <thead><tr>
                <th style="text-align:center;width:70px">Rank</th>
                <th>Team & Institution</th>
                <th style="text-align:center">Round</th>
                <th style="text-align:right;padding-right:30px">Score</th>
            </tr></thead>
            <tbody>
                ${filtered.map((row, i) => {
                    const rank = i + 1;
                    let rc = '';
                    if (rank === 1) rc = 'rank-1';
                    else if (rank === 2) rc = 'rank-2';
                    else if (rank === 3) rc = 'rank-3';
                    return `<tr>
                        <td style="text-align:center"><span class="rank-pill ${rc}">${rank}</span></td>
                        <td><div class="team-cell">${row.Team||'Team '+rank}</div><div class="college-cell">${row.College||''}</div></td>
                        <td style="text-align:center;color:var(--text-secondary);font-size:0.88rem">${row.Round||'Overall'}</td>
                        <td class="score-cell" style="text-align:right;padding-right:30px">${row.Score||'0'}</td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>
    </div>`;
}

// ──────────────────────────────────────────────────────────────
// 6. INIT
// ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Mobile nav
    const toggle = document.querySelector('.mobile-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (toggle && navLinks) {
        toggle.addEventListener('click', () => navLinks.classList.toggle('open'));
    }

    // Bind links
    document.querySelectorAll('.link-case').forEach(el => el.href = CONFIG.CASE_COMPETITION_LINK);
    document.querySelectorAll('.link-quiz').forEach(el => el.href = CONFIG.CONTINGENT_QUIZ_LINK);
    document.querySelectorAll('.contact-email-link').forEach(el => {
        el.href = `mailto:${CONFIG.CONTACT_EMAIL}`;
        if (!el.textContent.includes('@')) el.textContent = CONFIG.CONTACT_EMAIL;
    });
    document.querySelectorAll('.instagram-link').forEach(el => {
        el.href = CONFIG.INSTAGRAM_URL;
        if (!el.textContent.includes('@')) el.textContent = `@${CONFIG.INSTAGRAM_HANDLE}`;
    });

    // Trailer
    const trailer = document.getElementById('trailer-iframe');
    if (trailer && CONFIG.TRAILER_EMBED_URL) trailer.src = CONFIG.TRAILER_EMBED_URL;

    // Engines
    initRounds();
    initScores();
    initScrollReveal();
});