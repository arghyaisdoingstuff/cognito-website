/**
 * Cognito 2026 - Client Engine v2
 * Scroll Reveals (IntersectionObserver), CSV Parsing,
 * Rounds Timer Engine, Bar Chart Leaderboard (Contingent only)
 */

// ──────────────────────────────────────────────────────────────
// 1. SCROLL REVEAL
// ──────────────────────────────────────────────────────────────
function initScrollReveal() {
    const targets = document.querySelectorAll(
        '.reveal, .reveal-scale, .reveal-left, .reveal-right, .reveal-stagger'
    );
    if (!targets.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    targets.forEach(el => observer.observe(el));
}

// ──────────────────────────────────────────────────────────────
// 2. CSV PARSER
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
// 3. SAMPLE DATA (brochure-accurate fallbacks)
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
// Default to first tab's filter (Contingent)
let activeRoundFilter = 'Contingent';

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
    if (!container) return;

    const filtered = data.filter(r => {
        if ((r.Show || 'yes').toLowerCase() !== 'yes') return false;
        return (r.Event || '').toLowerCase().includes(activeRoundFilter.toLowerCase());
    });

    if (!filtered.length) {
        container.innerHTML = `<div class="card text-center" style="grid-column:1/-1;padding:40px;"><h3>No rounds listed in this category yet.</h3><p>Round schedules will appear here automatically once added to the Sheet.</p></div>`;
        return;
    }

    const now = new Date();
    let html = '';
    let animDelay = 1;

    const isCaseComp = activeRoundFilter.toLowerCase() === 'case competition';

    if (isCaseComp) {
        // Flat timeline for Case Competition without accordions
        html += '<div class="timeline-track" style="margin-top:20px;">';
        filtered.forEach(r => {
            const release = new Date(r.Release ? r.Release.replace(/-/g, '/') : '');
            const deadline = new Date(r.Deadline ? r.Deadline.replace(/-/g, '/') : '');
            const valid = !isNaN(release) && !isNaN(deadline);
            let badge = '', timeInfo = '', actions = '';
            let isActive = false;

            if (!valid) {
                badge = `<span class="status-badge live">Scheduled</span>`;
                timeInfo = `<span><strong>Schedule:</strong> TBA</span>`;
                actions = `<a href="${r.BriefLink||'#'}" target="_blank" class="btn btn-outline">Read Brief</a><a href="${r.SubmitLink||'#'}" target="_blank" class="btn btn-cyan">Submit</a>`;
            } else if (now < release) {
                const diff = release - now;
                const d = Math.floor(diff / 864e5), h = Math.floor((diff / 36e5) % 24);
                badge = `<span class="status-badge locked">🔒 Unlocks Soon</span>`;
                timeInfo = `<span><strong>Unlocks:</strong> ${release.toLocaleString('en-IN',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span><br><span style="color:var(--text-dim)">Countdown: ${d > 0 ? d + 'd ' : ''}${h}h</span>`;
                actions = `<button class="btn btn-secondary" disabled style="opacity:0.5;cursor:not-allowed;width:100%">Locked until Release</button>`;
            } else if (now <= deadline) {
                isActive = true;
                badge = `<span class="status-badge live">🟢 Accepting Submissions</span>`;
                timeInfo = `<span><strong>Deadline:</strong> ${deadline.toLocaleString('en-IN',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span>`;
                actions = `<a href="${r.BriefLink}" target="_blank" class="btn btn-outline">Brief</a><a href="${r.SubmitLink}" target="_blank" class="btn btn-cyan">Submit</a>`;
            } else {
                badge = `<span class="status-badge closed">🔴 Closed</span>`;
                timeInfo = `<span><strong>Closed:</strong> ${deadline.toLocaleString('en-IN',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span>`;
                actions = `<a href="${r.BriefLink}" target="_blank" class="btn btn-outline" style="width:100%">View Brief</a>`;
            }

            const displayTitle = r.Round ? `${r.Round}: ${r.Title || 'Exhibit'}` : (r.Title || 'Exhibit');

            html += `
            <div class="timeline-node reveal reveal-delay-${(animDelay % 4) + 1}">
                <div class="timeline-marker ${isActive ? 'active' : ''}"></div>
                <div class="timeline-card card">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px">
                        <h3 class="timeline-title">${displayTitle}</h3>
                        ${badge}
                    </div>
                    <p class="timeline-desc">${r.Description || ''}</p>
                    <div class="timeline-footer">
                        <div style="font-size:0.85rem">${timeInfo}</div>
                        <div class="timeline-actions">${actions}</div>
                    </div>
                </div>
            </div>`;
            animDelay++;
        });
        html += '</div>';
    } else {
        // Group exhibits by their Round name for Accordions (Contingent, etc.)
        const grouped = {};
        filtered.forEach(r => {
            const roundName = r.Round || 'General';
            if (!grouped[roundName]) grouped[roundName] = [];
            grouped[roundName].push(r);
        });

        for (const [roundName, items] of Object.entries(grouped)) {
            html += `
            <div class="accordion-item reveal reveal-delay-${(animDelay % 4) + 1}">
                <div class="accordion-header">
                    <h2 class="accordion-title">${roundName}</h2>
                    <svg class="accordion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
                <div class="accordion-content">
                    <div class="accordion-inner">
                        <div class="timeline-track">
            `;
            
            items.forEach((r) => {
                const release = new Date(r.Release ? r.Release.replace(/-/g, '/') : '');
                const deadline = new Date(r.Deadline ? r.Deadline.replace(/-/g, '/') : '');
                const valid = !isNaN(release) && !isNaN(deadline);
                let badge = '', timeInfo = '', actions = '';
                let isActive = false;

                if (!valid) {
                    badge = `<span class="status-badge live">Scheduled</span>`;
                    timeInfo = `<span><strong>Schedule:</strong> TBA</span>`;
                    actions = `<a href="${r.BriefLink||'#'}" target="_blank" class="btn btn-outline">Read Brief</a><a href="${r.SubmitLink||'#'}" target="_blank" class="btn btn-cyan">Submit</a>`;
                } else if (now < release) {
                    const diff = release - now;
                    const d = Math.floor(diff / 864e5), h = Math.floor((diff / 36e5) % 24);
                    badge = `<span class="status-badge locked">🔒 Unlocks Soon</span>`;
                    timeInfo = `<span><strong>Unlocks:</strong> ${release.toLocaleString('en-IN',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span><br><span style="color:var(--text-dim)">Countdown: ${d > 0 ? d + 'd ' : ''}${h}h</span>`;
                    actions = `<button class="btn btn-secondary" disabled style="opacity:0.5;cursor:not-allowed;width:100%">Locked until Release</button>`;
                } else if (now <= deadline) {
                    isActive = true;
                    badge = `<span class="status-badge live">🟢 Accepting Submissions</span>`;
                    timeInfo = `<span><strong>Deadline:</strong> ${deadline.toLocaleString('en-IN',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span>`;
                    actions = `<a href="${r.BriefLink}" target="_blank" class="btn btn-outline">Brief</a><a href="${r.SubmitLink}" target="_blank" class="btn btn-cyan">Submit</a>`;
                } else {
                    badge = `<span class="status-badge closed">🔴 Closed</span>`;
                    timeInfo = `<span><strong>Closed:</strong> ${deadline.toLocaleString('en-IN',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span>`;
                    actions = `<a href="${r.BriefLink}" target="_blank" class="btn btn-outline" style="width:100%">View Brief</a>`;
                }

                html += `
                <div class="timeline-node">
                    <div class="timeline-marker ${isActive ? 'active' : ''}"></div>
                    <div class="timeline-card card">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px">
                            <h3 class="timeline-title">${r.Title || 'Exhibit'}</h3>
                            ${badge}
                        </div>
                        <p class="timeline-desc">${r.Description || ''}</p>
                        <div class="timeline-footer">
                            <div style="font-size:0.85rem">${timeInfo}</div>
                            <div class="timeline-actions">${actions}</div>
                        </div>
                    </div>
                </div>`;
            });
            
            html += `
                        </div>
                    </div>
                </div>
            </div>`;
            animDelay++;
        }
    }

    container.innerHTML = html;
    
    // Attach Accordion Listeners
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            item.classList.toggle('expanded');
        });
    });
    initScrollReveal();
}

// ──────────────────────────────────────────────────────────────
// 5. BAR CHART LEADERBOARD (Contingent only)
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
            const text = await res.text();
            allScoresData = parseCSV(text);
            isLive = allScoresData.length > 0;
        } catch (e) { allScoresData = SAMPLE_SCORES; }
    }
    if (!isLive || allScoresData.length === 0) allScoresData = SAMPLE_SCORES;

    renderBarChart(isLive);

    const search = document.getElementById('scores-search');
    if (search) {
        search.addEventListener('input', e => {
            searchQuery = e.target.value.toLowerCase().trim();
            renderBarChart(isLive);
        });
    }

    if (isLive && CONFIG.AUTO_REFRESH_INTERVAL) {
        setInterval(async () => {
            try {
                const res = await fetch(CONFIG.SCORES_CSV_URL);
                const text = await res.text();
                const fresh = parseCSV(text);
                if (fresh.length > 0) allScoresData = fresh;
                renderBarChart(true);
            } catch (e) {}
        }, CONFIG.AUTO_REFRESH_INTERVAL);
    }
}

function renderBarChart(isLive) {
    const container = document.getElementById('scores-table-container');
    if (!container) return;

    // Filter to Contingent only
    let contingentRows = allScoresData.filter(row => {
        const ev = (row.Event || '').toLowerCase();
        return ev.includes('contingent');
    });

    // Sort to determine true ranking
    contingentRows.sort((a, b) => (parseFloat(b.Score) || 0) - (parseFloat(a.Score) || 0));
    
    // Assign permanent ranks based on full contingent list
    contingentRows.forEach((row, i) => {
        row._rank = i + 1;
    });

    // Apply search filter
    let filtered = contingentRows;
    if (searchQuery) {
        filtered = contingentRows.filter(row =>
            (row.Team || '').toLowerCase().includes(searchQuery) ||
            (row.College || '').toLowerCase().includes(searchQuery)
        );
    }

    if (!filtered.length) {
        container.innerHTML = `<div class="card text-center" style="padding:50px"><h3>No teams found${searchQuery ? ' matching "' + searchQuery + '"' : ''}.</h3><p style="margin-top:8px">Scores will appear here once published from the event sheet.</p></div>`;
        return;
    }

    // Compute max score for bar width proportions (use overall max, not just filtered max)
    const maxScore = Math.max(0, ...contingentRows.map(r => parseFloat(r.Score) || 0));

    const rows = filtered.map((row) => {
        const rank = row._rank;
        const score = parseFloat(row.Score) || 0;
        const pct = maxScore > 0 ? (score / maxScore * 100).toFixed(1) : 0;

        let rankClass = '';
        let fillClass = '';
        if (rank === 1) { rankClass = 'rank-1'; fillClass = 'rank-1-fill'; }
        else if (rank === 2) { rankClass = 'rank-2'; fillClass = 'rank-2-fill'; }
        else if (rank === 3) { rankClass = 'rank-3'; fillClass = 'rank-3-fill'; }

        return `
        <div class="bar-row" data-pct="${pct}" data-fill="${fillClass}">
            <span class="bar-rank ${rankClass}">${rank}</span>
            <div class="bar-team-info">
                <div class="bar-team-name">${row.Team || 'Team ' + rank}</div>
                <div class="bar-college">${row.College || ''}</div>
            </div>
            <div class="bar-track">
                <div class="bar-fill ${fillClass}" style="width:0%"></div>
            </div>
            <div class="bar-score">${score}</div>
        </div>
        ${rank < filtered.length ? '<div class="bar-divider"></div>' : ''}`;
    }).join('');

    container.innerHTML = `<div class="bar-chart-container">${rows}</div>`;

    // Animate bars in after a short delay
    requestAnimationFrame(() => {
        setTimeout(() => {
            container.querySelectorAll('.bar-fill').forEach((fill, i) => {
                const row = fill.closest('.bar-row');
                const pct = row ? row.getAttribute('data-pct') : 0;
                fill.style.transitionDelay = `${i * 0.07}s`;
                fill.style.width = pct + '%';
            });
        }, 120);
    });
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

    // Bind config links
    document.querySelectorAll('.link-case').forEach(el => { el.href = CONFIG.CASE_COMPETITION_LINK; });
    document.querySelectorAll('.link-quiz').forEach(el => { el.href = CONFIG.CONTINGENT_QUIZ_LINK; });
    document.querySelectorAll('.contact-email-link').forEach(el => {
        el.href = `mailto:${CONFIG.CONTACT_EMAIL}`;
        if (!el.textContent.trim()) el.textContent = CONFIG.CONTACT_EMAIL;
    });
    document.querySelectorAll('.instagram-link').forEach(el => {
        el.href = CONFIG.INSTAGRAM_URL;
        if (!el.textContent.trim()) el.textContent = `@${CONFIG.INSTAGRAM_HANDLE}`;
    });

    // Trailer
    const trailer = document.getElementById('trailer-iframe');
    if (trailer && CONFIG.TRAILER_EMBED_URL) trailer.src = CONFIG.TRAILER_EMBED_URL;

    // Engines
    initRounds();
    initScores();
    initScrollReveal();
});

// ──────────────────────────────────────────────────────────────
// 6. INTERACTIVE BACKGROUND NODES
// ──────────────────────────────────────────────────────────────
function initNodes() {
    const bgContainer = document.querySelector('.bg-canvas');
    if (!bgContainer) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'node-canvas';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '0'; // Behind orbs and grain
    bgContainer.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let width, height;
    
    // Scale for high-DPI displays
    const dpr = window.devicePixelRatio || 1;

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
    }
    window.addEventListener('resize', resize);
    resize();

    const particles = [];
    // Adjust number of particles based on screen width for performance
    const numParticles = width > 768 ? 60 : 30;
    const maxDistance = 140;
    
    let mouse = { x: -1000, y: -1000 };
    let touchTimeout;

    // Desktop interaction
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });
    window.addEventListener('mouseout', () => {
        mouse.x = -1000;
        mouse.y = -1000;
    });

    // Mobile interaction: Touch and Scroll
    window.addEventListener('touchstart', (e) => {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
        clearTimeout(touchTimeout);
    }, {passive: true});
    
    window.addEventListener('touchmove', (e) => {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
        clearTimeout(touchTimeout);
    }, {passive: true});
    
    window.addEventListener('touchend', () => {
        // Let the gravity linger for a moment after releasing the scroll/tap
        touchTimeout = setTimeout(() => {
            mouse.x = -1000;
            mouse.y = -1000;
        }, 1500); 
    });

    for(let i = 0; i < numParticles; i++) {
        const vx = (Math.random() - 0.5) * 0.4;
        const vy = (Math.random() - 0.5) * 0.4;
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: vx,
            vy: vy,
            baseVx: vx,
            baseVy: vy,
            radius: Math.random() * 1.2 + 0.5
        });
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);

        // Optional: Blueprint grid background (faint)
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.02)';
        ctx.lineWidth = 1;
        const gridSize = 80;
        ctx.beginPath();
        for (let x = (width % gridSize)/2; x < width; x += gridSize) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
        }
        for (let y = (height % gridSize)/2; y < height; y += gridSize) {
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }
        ctx.stroke();

        particles.forEach((p, index) => {
            p.x += p.vx;
            p.y += p.vy;

            // Screen-wrap (Infinite Flow)
            if(p.x < 0) p.x = width;
            else if(p.x > width) p.x = 0;
            
            if(p.y < 0) p.y = height;
            else if(p.y > height) p.y = 0;

            // Draw node
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
            ctx.fill();

            // Connect nodes
            for(let j = index + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const dist = Math.sqrt(dx*dx + dy*dy);

                if(dist < maxDistance) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(0, 240, 255, ${0.1 * (1 - dist/maxDistance)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }

            // Invisible gravity well (creates interactive data terminal feel without visual snapping)
            const dxm = p.x - mouse.x;
            const dym = p.y - mouse.y;
            const distm = Math.sqrt(dxm*dxm + dym*dym);

            if(distm < maxDistance * 2.5) { // Expanded radius for a gentler, wider pull
                // Gentle pull by modifying velocity instead of snapping position
                const force = (1 - distm / (maxDistance * 2.5)) * 0.02;
                p.vx -= (dxm / distm) * force;
                p.vy -= (dym / distm) * force;
            }
            
            // Gracefully return to base drifting velocity over time
            p.vx += (p.baseVx - p.vx) * 0.02;
            p.vy += (p.baseVy - p.vy) * 0.02;
        });

        requestAnimationFrame(animate);
    }
    animate();
}

// Call on load
initNodes();

// ──────────────────────────────────────────────────────────────
// 7. MAGNETIC BUTTONS
// ──────────────────────────────────────────────────────────────
function initMagneticButtons() {
    // Select buttons and the hero logo wrapper for magnetic effect
    const magneticElements = document.querySelectorAll('.btn, .tab-btn, .hero-logo-wrap');
    
    magneticElements.forEach(btn => {
        // We only want the magnetic pull on desktop/mouse devices
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const h = rect.width / 2;
            const v = rect.height / 2;
            const x = e.clientX - rect.left - h;
            const y = e.clientY - rect.top - v;
            
            // The pull factor (reduced from 30% to 15% for a more gentle, subtle effect)
            btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
            btn.style.transition = 'transform 0.1s ease-out';
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
            btn.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'; // snappy bounce back
        });
    });
}

initMagneticButtons();