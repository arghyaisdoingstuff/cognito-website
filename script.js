/**
 * Cognito 2026 - Client Engine v2
 * Scroll Reveals (IntersectionObserver), CSV Parsing,
 * Rounds Timer Engine, Bar Chart Leaderboard (Contingent only)
 */

// 1. SCROLL REVEAL & TYPEWRITER & LIGHTBOX & CAROUSEL
// ==========================================================================
let galleryDragDistance = 0;

function initCarousel() {
    const carousel = document.getElementById('gallery-carousel');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    if (!carousel || !prevBtn || !nextBtn) return;
    if (carousel.__carouselInitialized) return;
    carousel.__carouselInitialized = true;

    // Clone all items to create a seamless infinite scroll
    const items = Array.from(carousel.children);
    items.forEach(item => {
        const clone = item.cloneNode(true);
        carousel.appendChild(clone);
    });

    // Prevent browser native image ghost drag
    carousel.querySelectorAll('img').forEach(img => {
        img.setAttribute('draggable', 'false');
    });
    carousel.addEventListener('dragstart', (e) => e.preventDefault());

    let speed = 0.9; // Baseline continuous marquee speed
    let isHovered = false;
    let isButtonScrolling = false;
    let isDragging = false;
    let startX = 0;
    let startScrollLeft = 0;
    let lastX = 0;
    let lastTime = 0;
    let dragVelocity = 0;
    let rafId = null;
    let momentumRafId = null;

    const getItemWidth = () => items[0].offsetWidth + 16;
    const getJumpDistance = () => items.length * getItemWidth();

    const wrapScroll = () => {
        const jumpDistance = getJumpDistance();
        if (carousel.scrollLeft >= jumpDistance) {
            carousel.scrollLeft -= jumpDistance;
        } else if (carousel.scrollLeft <= 0) {
            carousel.scrollLeft += jumpDistance;
        }
    };

    let isCarouselVisible = true;
    if ('IntersectionObserver' in window) {
        const obs = new IntersectionObserver((entries) => {
            const wasVisible = isCarouselVisible;
            isCarouselVisible = entries[0].isIntersecting;
            if (isCarouselVisible && !wasVisible) {
                cancelAnimationFrame(rafId);
                rafId = requestAnimationFrame(animate);
            }
        }, { threshold: 0 });
        const wrapper = carousel.closest('.gallery-carousel-wrapper') || carousel;
        obs.observe(wrapper);
    }

    const animate = () => {
        if (isCarouselVisible && !isHovered && !isButtonScrolling && !isDragging && Math.abs(dragVelocity) < 0.1) {
            carousel.scrollLeft += speed;
            wrapScroll();
        }
        if (isCarouselVisible) {
            rafId = requestAnimationFrame(animate);
        }
    };
    rafId = requestAnimationFrame(animate);

    // Friction momentum after flick drag release
    const applyMomentum = () => {
        if (Math.abs(dragVelocity) > 0.4) {
            carousel.scrollLeft -= dragVelocity;
            dragVelocity *= 0.93;
            wrapScroll();
            momentumRafId = requestAnimationFrame(applyMomentum);
        } else {
            dragVelocity = 0;
            cancelAnimationFrame(momentumRafId);
        }
    };

    // Robust pointer events (Pointer Capture guarantees pointerup fires even if released outside window)
    carousel.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (e.target.closest('.carousel-btn')) return;

        isDragging = true;
        galleryDragDistance = 0;
        startX = e.clientX;
        startScrollLeft = carousel.scrollLeft;
        lastX = e.clientX;
        lastTime = performance.now();
        dragVelocity = 0;
        cancelAnimationFrame(momentumRafId);

        carousel.classList.add('is-dragging');

        try {
            carousel.setPointerCapture(e.pointerId);
        } catch (_) {}
    });

    carousel.addEventListener('pointermove', (e) => {
        if (!isDragging) return;

        const delta = e.clientX - startX;
        galleryDragDistance += Math.abs(e.clientX - lastX);

        carousel.scrollLeft = startScrollLeft - delta;
        wrapScroll();

        const now = performance.now();
        const dt = now - lastTime;
        if (dt > 10) {
            dragVelocity = ((e.clientX - lastX) / dt) * 16;
            lastX = e.clientX;
            lastTime = now;
        }
    });

    const stopDragging = (e) => {
        if (!isDragging) return;
        isDragging = false;
        carousel.classList.remove('is-dragging');

        if (e && e.pointerId) {
            try {
                carousel.releasePointerCapture(e.pointerId);
            } catch (_) {}
        }

        if (Math.abs(dragVelocity) > 1.2) {
            applyMomentum();
        } else {
            dragVelocity = 0;
        }
    };

    carousel.addEventListener('pointerup', stopDragging);
    carousel.addEventListener('pointercancel', stopDragging);
    window.addEventListener('blur', () => stopDragging());

    // Pause auto-scroll on hover or touch
    const wrapper = document.querySelector('.gallery-carousel-wrapper');
    if (wrapper) {
        wrapper.addEventListener('mouseenter', () => isHovered = true);
        wrapper.addEventListener('mouseleave', () => isHovered = false);
        wrapper.addEventListener('touchstart', () => isHovered = true, { passive: true });
        wrapper.addEventListener('touchend', () => {
            setTimeout(() => isHovered = false, 1200);
        }, { passive: true });
    }

    const pauseForButton = () => {
        isButtonScrolling = true;
        dragVelocity = 0;
        cancelAnimationFrame(momentumRafId);
        setTimeout(() => isButtonScrolling = false, 750);
    };

    prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const jumpDistance = getJumpDistance();
        if (carousel.scrollLeft <= getItemWidth()) {
            carousel.scrollLeft += jumpDistance;
        }
        pauseForButton();
        carousel.scrollBy({ left: -getItemWidth(), behavior: 'smooth' });
    });

    nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const jumpDistance = getJumpDistance();
        if (carousel.scrollLeft >= jumpDistance) {
            carousel.scrollLeft -= jumpDistance;
        }
        pauseForButton();
        carousel.scrollBy({ left: getItemWidth(), behavior: 'smooth' });
    });
}

function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.querySelector('.lightbox-close');
    
    if (!lightbox || !lightboxImg || !closeBtn) return;

    // Use event delegation so cloned carousel items also trigger the lightbox
    document.addEventListener('click', (e) => {
        if (galleryDragDistance > 8) return; // Prevent opening lightbox after dragging
        const item = e.target.closest('.gallery-item');
        if (item && document.getElementById('gallery-carousel').contains(item)) {
            const img = item.querySelector('img');
            if (img) {
                lightboxImg.src = img.src;
                lightbox.classList.add('show');
                document.body.style.overflow = 'hidden';
            }
        }
    });

    const closeLightbox = () => {
        lightbox.classList.remove('show');
        document.body.style.overflow = '';
        setTimeout(() => {
            if (!lightbox.classList.contains('show')) lightboxImg.src = '';
        }, 300);
    };

    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', e => {
        if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && lightbox.classList.contains('show')) closeLightbox();
    });
}

function initTypewriter() {
    const el = document.querySelector('.typewriter-target');
    if (!el) return;

    // Respect user's motion preferences
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    const part1El = el.querySelector('.tw-part1');
    const part2El = el.querySelector('.tw-part2');
    const cursor = el.querySelector('.type-cursor');
    if (!part1El || !part2El || !cursor) return;

    const text1 = "Welcome to ";
    const text2 = "Reality";

    // Clear text content for frame-perfect reveal
    part1El.textContent = '';
    part2El.textContent = '';
    cursor.style.opacity = '1';

    const charMs1 = 36;
    const charMs2 = 46;
    const startDelay = 100;
    const dur1 = text1.length * charMs1;
    const dur2 = text2.length * charMs2;
    const totalDuration = startDelay + dur1 + dur2;

    let startTime = null;

    function step(now) {
        if (!startTime) startTime = now;
        const elapsed = now - startTime;

        if (elapsed < startDelay) {
            requestAnimationFrame(step);
            return;
        }

        const activeElapsed = elapsed - startDelay;

        // Animate Part 1 ("Welcome to ")
        const count1 = Math.min(text1.length, Math.floor(activeElapsed / charMs1));
        if (part1El.textContent.length !== count1) {
            part1El.textContent = text1.slice(0, count1);
        }

        // Animate Part 2 ("Reality")
        if (activeElapsed >= dur1) {
            const activeElapsed2 = activeElapsed - dur1;
            const count2 = Math.min(text2.length, Math.floor(activeElapsed2 / charMs2));
            if (part2El.textContent.length !== count2) {
                part2El.textContent = text2.slice(0, count2);
            }
        }

        if (elapsed < totalDuration) {
            requestAnimationFrame(step);
        } else {
            part1El.textContent = text1;
            part2El.textContent = text2;
            setTimeout(() => {
                cursor.style.transition = 'opacity 0.6s ease';
                cursor.style.opacity = '0';
            }, 2500);
        }
    }

    requestAnimationFrame(step);
}

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

// ==========================================================================
// 2. CSV PARSER
// ==========================================================================
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
            currentLine.push(token.trim()); token = '';
            lines.push(currentLine); currentLine = [];
        } else {
            token += c;
        }
    }
    if (token || currentLine.length) {
        currentLine.push(token.trim());
        lines.push(currentLine);
    }

    if (lines.length < 2) return [];
    const headers = lines[0];
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].length === 0 || (lines[i].length === 1 && lines[i][0] === "")) continue;
        const obj = {};
        headers.forEach((h, j) => { obj[h] = lines[i][j] || ''; });
        data.push(obj);
    }
    return data;
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
        BriefLink: "#", SubmitLink: "#", Show: "Yes", Day: ""
    },
    {
        Event: "Case Competition", Round: "Final Round - Executive Pitch",
        Title: "Corporate Restructuring & Distress M&A",
        Description: "Qualified teams defend their recommendations before industry specialists and executive jury.",
        Release: "2026-12-01 10:00", Deadline: "2026-12-11 18:00",
        BriefLink: "#", SubmitLink: "#", Show: "Yes", Day: ""
    },
    {
        Event: "Contingent", Round: "Round 1 - The Qualifier",
        Title: "Corporate Genesis & Market Entry",
        Description: "Comprehensive cross-functional simulation testing the contingent's agility, strategy, and resource allocation.",
        Release: "2026-12-15 09:30", Deadline: "2026-12-15 15:30",
        BriefLink: "#", SubmitLink: "#", Show: "Yes", Day: "1"
    },
    {
        Event: "Contingent", Round: "Round 1 - The Qualifier",
        Title: "Algorithmic Arbitrage & Liquidity Shock",
        Description: "High-frequency trade distress event requiring rapid capital deployment and balance-sheet immunisation.",
        Release: "2026-12-15 11:30", Deadline: "2026-12-15 15:30",
        BriefLink: "#", SubmitLink: "#", Show: "Yes", Day: "1"
    },
    {
        Event: "Contingent", Round: "Round 2 - Crisis Simulation",
        Title: "Hostile Takeover & Stakeholder Defense",
        Description: "A sudden supply-chain collapse threatens corporate continuity. Re-align strategies live.",
        Release: "2026-12-16 10:00", Deadline: "2026-12-16 16:00",
        BriefLink: "#", SubmitLink: "#", Show: "Yes", Day: "2"
    },
    {
        Event: "Contingent", Round: "Round 3 - Grand Finale",
        Title: "The Final Conquest",
        Description: "The overarching storyline reaches its climax. Top contingents battle live for the Cognito 2026 Trophy.",
        Release: "2026-12-17 11:00", Deadline: "2026-12-17 17:30",
        BriefLink: "#", SubmitLink: "#", Show: "Yes", Day: "3"
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
// Default to first tab's filter (Contingent) and Day 1
let activeRoundFilter = 'Contingent';
let activeDayFilter = '1';
let roundsDataCache = null;
let isRoundsLiveCache = false;

function initFilterGlider() {
    const glider = document.getElementById('filter-glider');
    const filterBtns = document.querySelectorAll('[data-round-filter]');
    const dayWrapper = document.getElementById('day-filter-wrapper');
    const dayGlider = document.getElementById('day-filter-glider');
    const dayBtns = document.querySelectorAll('[data-day-filter]');

    function updateGlider(gliderEl, activeBtn) {
        if (!gliderEl || !activeBtn) return;
        gliderEl.style.width = activeBtn.offsetWidth + 'px';
        gliderEl.style.transform = `translateX(${activeBtn.offsetLeft}px)`;
    }

    function syncDayGlider() {
        if (!dayGlider) return;
        const activeDayBtn = document.querySelector('[data-day-filter].active');
        if (activeDayBtn) updateGlider(dayGlider, activeDayBtn);
    }

    function toggleDaySlider() {
        if (!dayWrapper) return;
        const isContingent = activeRoundFilter.toLowerCase().includes('contingent');
        if (isContingent) {
            dayWrapper.style.display = 'flex';
            requestAnimationFrame(() => syncDayGlider());
        } else {
            dayWrapper.style.display = 'none';
        }
    }

    if (glider && filterBtns.length) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                updateGlider(glider, btn);
                activeRoundFilter = btn.getAttribute('data-round-filter');
                toggleDaySlider();
                if (roundsDataCache !== null) {
                    renderRounds(roundsDataCache, isRoundsLiveCache);
                }
            });
        });

        const initialActive = document.querySelector('[data-round-filter].active');
        if (initialActive) updateGlider(glider, initialActive);
    }

    if (dayGlider && dayBtns.length) {
        dayBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                dayBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                updateGlider(dayGlider, btn);
                activeDayFilter = btn.getAttribute('data-day-filter');
                if (roundsDataCache !== null) {
                    renderRounds(roundsDataCache, isRoundsLiveCache);
                }
            });
        });

        syncDayGlider();
    }

    toggleDaySlider();

    window.addEventListener('resize', () => {
        const currentActive = document.querySelector('[data-round-filter].active');
        if (glider && currentActive) updateGlider(glider, currentActive);
        syncDayGlider();
    });
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            const currentActive = document.querySelector('[data-round-filter].active');
            if (glider && currentActive) updateGlider(glider, currentActive);
            syncDayGlider();
        }
    });
    if (document.fonts) {
        document.fonts.ready.then(() => {
            const currentActive = document.querySelector('[data-round-filter].active');
            if (glider && currentActive) updateGlider(glider, currentActive);
            syncDayGlider();
        });
    }
}

let resolvedRoundsUrl = null;
let resolvedScoresUrl = null;
let resolvedTrailerUrl = null;

async function fetchCsvWithFallback(primaryUrl, fallbackUrl) {
    const fetchHeaders = { 'Accept': 'text/csv, text/plain; q=0.9, */*; q=0.8' };
    if (primaryUrl) {
        try {
            const res = await fetch(primaryUrl, { headers: fetchHeaders });
            if (res.ok) {
                const text = await res.text();
                // Ensure response is valid CSV and not an HTML error page
                if (text && !text.trim().startsWith('<!DOCTYPE') && !text.trim().startsWith('<html') && !text.trim().startsWith('<?xml')) {
                    return { ok: true, text, url: primaryUrl };
                }
            }
        } catch (e) {}
    }

    if (fallbackUrl) {
        try {
            const res = await fetch(fallbackUrl, { headers: fetchHeaders });
            if (res.ok) {
                const text = await res.text();
                if (text && !text.trim().startsWith('<!DOCTYPE') && !text.trim().startsWith('<html') && !text.trim().startsWith('<?xml')) {
                    return { ok: true, text, url: fallbackUrl };
                }
            }
        } catch (e) {}
    }

    return { ok: false, text: '', url: null };
}

async function initRounds() {
    const container = document.getElementById('rounds-container');
    if (!container) return;

    let roundsData = [];
    let isLive = false;

    const res = await fetchCsvWithFallback(
        resolvedRoundsUrl || CONFIG.ROUNDS_CSV_URL,
        CONFIG.FALLBACK_ROUNDS_CSV_URL
    );

    if (res.ok) {
        resolvedRoundsUrl = res.url;
        roundsData = parseCSV(res.text);
        isLive = roundsData.length > 0;
    }

    roundsDataCache = roundsData;
    isRoundsLiveCache = isLive;
    renderRounds(roundsData, isLive);
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Strict URL and protocol sanitizer.
 * Guarantees that only safe protocols (http, https, mailto, tel, or anchor/relative paths)
 * can be rendered into href attributes, preventing javascript: or data: XSS injections.
 */
function sanitizeUrl(url) {
    if (!url || typeof url !== 'string') return '#';
    const trimmed = url.trim();
    if (!trimmed) return '#';
    // Allow relative anchor hashes or relative paths
    if (trimmed.startsWith('#') || trimmed.startsWith('/') || trimmed.startsWith('./')) {
        return escapeHtml(trimmed);
    }
    // Strict protocol verification
    if (/^(https?|mailto|tel):/i.test(trimmed)) {
        return escapeHtml(trimmed);
    }
    return '#';
}

function toggleRoundAccordion(headerEl) {
    const group = headerEl.closest('.round-accordion-group');
    if (!group) return;
    const willOpen = !group.classList.contains('open');
    group.classList.toggle('open', willOpen);
    headerEl.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
}

/**
 * Creates a Date object anchored to Indian Standard Time (IST / UTC+05:30).
 * Ensures all participants worldwide experience rounds unlock and deadlines hit
 * at the exact same physical moment, regardless of user device timezone.
 */
function createISTDate(year, monthIndex, day, hours = 0, minutes = 0, seconds = 0) {
    const IST_OFFSET_MS = 19800000; // 5 hours 30 minutes in milliseconds
    const utcMs = Date.UTC(year, monthIndex, day, hours, minutes, seconds) - IST_OFFSET_MS;
    return new Date(utcMs);
}

/**
 * Robust date & time parser supporting:
 * - DD/MM/YYYY HH:mm (with optional AM/PM)
 * - DD-MM-YYYY HH:mm
 * - YYYY-MM-DD HH:mm (or ISO 8601 with T)
 * - "15 Dec 2026 15:30" / "15 December 2026 3:30 PM"
 * - Separate Date + Time combinations
 * - Automatically anchors to Indian Standard Time (IST) if no timezone is specified
 */
function parseFlexibleDate(dateInput, timeInput = '') {
    if (!dateInput && !timeInput) return new Date(NaN);
    let str = `${dateInput || ''} ${timeInput || ''}`.trim();
    if (!str) return new Date(NaN);

    const hasExplicitTz = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(str);

    // 1. ISO format: YYYY-MM-DD or YYYY/MM/DD with optional time and AM/PM
    const isoMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})(?:[T\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?)?/i);
    if (isoMatch) {
        const year = parseInt(isoMatch[1], 10);
        const month = parseInt(isoMatch[2], 10);
        const day = parseInt(isoMatch[3], 10);
        let hours = isoMatch[4] ? parseInt(isoMatch[4], 10) : 0;
        const minutes = isoMatch[5] ? parseInt(isoMatch[5], 10) : 0;
        const seconds = isoMatch[6] ? parseInt(isoMatch[6], 10) : 0;
        const ampm = isoMatch[7] ? isoMatch[7].toLowerCase() : null;
        if (ampm === 'pm' && hours < 12) hours += 12;
        if (ampm === 'am' && hours === 12) hours = 0;
        if (hasExplicitTz) {
            const nativeD = new Date(str.replace(/-/g, '/'));
            if (!isNaN(nativeD.getTime())) return nativeD;
        }
        return createISTDate(year, month - 1, day, hours, minutes, seconds);
    }

    // 2. Standard Indian / European format: DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
    const dmyMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})(?:[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?)?/i);
    if (dmyMatch) {
        let day = parseInt(dmyMatch[1], 10);
        let month = parseInt(dmyMatch[2], 10);
        const year = parseInt(dmyMatch[3], 10);
        if (month > 12 && day <= 12) {
            const temp = day;
            day = month;
            month = temp;
        }
        let hours = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 0;
        const minutes = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 0;
        const seconds = dmyMatch[6] ? parseInt(dmyMatch[6], 10) : 0;
        const ampm = dmyMatch[7] ? dmyMatch[7].toLowerCase() : null;
        if (ampm === 'pm' && hours < 12) hours += 12;
        if (ampm === 'am' && hours === 12) hours = 0;
        if (hasExplicitTz) {
            const nativeD = new Date(str.replace(/-/g, '/'));
            if (!isNaN(nativeD.getTime())) return nativeD;
        }
        return createISTDate(year, month - 1, day, hours, minutes, seconds);
    }

    // 3. Textual month format: "15 Dec 2026 15:30", "15 December 2026 3:30 PM"
    const textMonthMatch = str.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})(?:[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?)?/i);
    if (textMonthMatch) {
        const day = parseInt(textMonthMatch[1], 10);
        const monthName = textMonthMatch[2].toLowerCase().slice(0, 3);
        const year = parseInt(textMonthMatch[3], 10);
        const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const monthIdx = months.indexOf(monthName);
        if (monthIdx !== -1) {
            let hours = textMonthMatch[4] ? parseInt(textMonthMatch[4], 10) : 0;
            const minutes = textMonthMatch[5] ? parseInt(textMonthMatch[5], 10) : 0;
            const seconds = textMonthMatch[6] ? parseInt(textMonthMatch[6], 10) : 0;
            const ampm = textMonthMatch[7] ? textMonthMatch[7].toLowerCase() : null;
            if (ampm === 'pm' && hours < 12) hours += 12;
            if (ampm === 'am' && hours === 12) hours = 0;
            if (hasExplicitTz) {
                const nativeD = new Date(str.replace(/-/g, '/'));
                if (!isNaN(nativeD.getTime())) return nativeD;
            }
            return createISTDate(year, monthIdx, day, hours, minutes, seconds);
        }
    }

    // 4. Fallback native
    return new Date(str.replace(/-/g, '/'));
}

/**
 * Extracts a Date object from a row for either 'deadline' or 'release'.
 * Handles:
 * - Separate Date + ReleaseTime / DeadlineTime columns (e.g. Date: 15/12/2026, ReleaseTime: 09:30)
 * - Distinct DeadlineDate + DeadlineTime (for cases spanning multiple days)
 * - Single combined columns (e.g. Release: 15/12/2026 09:30, RoundDeadline: 15/12/2026 15:30)
 */
function extractRowDateTime(row, targetType, contextItems = []) {
    if (!row) return new Date(NaN);

    // 1. Check for specific target date column: e.g. DeadlineDate, RoundDeadlineDate, ReleaseDate
    const targetDateKey = Object.keys(row).find(k => 
        new RegExp(`${targetType}.*date|date.*${targetType}`, 'i').test(k)
    );
    let dateVal = targetDateKey ? String(row[targetDateKey] || '').trim() : '';

    // If no specific target date, check generic Date / EventDate / RoundDate
    if (!dateVal) {
        const genericDateKey = Object.keys(row).find(k => /date/i.test(k) && !/deadline/i.test(k) && !/release/i.test(k));
        if (genericDateKey) {
            dateVal = String(row[genericDateKey] || '').trim();
        }
    }

    // If target is deadline and no deadline date or generic date was found, fallback to ReleaseDate
    if (!dateVal && targetType === 'deadline') {
        const relDateKey = Object.keys(row).find(k => /release.*date|date.*release/i.test(k));
        if (relDateKey) {
            dateVal = String(row[relDateKey] || '').trim();
        }
    }

    // Fallback date from context items if not specified on this row
    if (!dateVal && Array.isArray(contextItems) && contextItems.length > 0) {
        const itemWithDate = contextItems.find(it => {
            const dk = Object.keys(it).find(k => new RegExp(`${targetType}.*date|date.*${targetType}`, 'i').test(k))
                || Object.keys(it).find(k => /date/i.test(k) && !/deadline/i.test(k) && !/release/i.test(k))
                || (targetType === 'deadline' ? Object.keys(it).find(k => /release.*date|date.*release/i.test(k)) : null);
            return dk && String(it[dk] || '').trim();
        });
        if (itemWithDate) {
            const dk = Object.keys(itemWithDate).find(k => new RegExp(`${targetType}.*date|date.*${targetType}`, 'i').test(k))
                || Object.keys(itemWithDate).find(k => /date/i.test(k) && !/deadline/i.test(k) && !/release/i.test(k))
                || (targetType === 'deadline' ? Object.keys(itemWithDate).find(k => /release.*date|date.*release/i.test(k)) : null);
            dateVal = String(itemWithDate[dk] || '').trim();
        }
    }

    // 2. Check for specific target time column: e.g. ReleaseTime, DeadlineTime, Time
    const targetTimeKey = Object.keys(row).find(k => 
        new RegExp(`${targetType}.*time|time.*${targetType}`, 'i').test(k)
    );
    let timeVal = targetTimeKey ? String(row[targetTimeKey] || '').trim() : '';

    // 3. Check direct column matching targetType (e.g. Deadline, RoundDeadline, Release)
    const directKey = Object.keys(row).find(k => 
        new RegExp(`^${targetType}$|round.*${targetType}`, 'i').test(k) && !/link/i.test(k)
    ) || Object.keys(row).find(k => new RegExp(targetType, 'i').test(k) && !/link/i.test(k) && !/date/i.test(k) && !/time/i.test(k));
    const directVal = directKey ? String(row[directKey] || '').trim() : '';

    // If directVal already looks like a full date (has slash, hyphen, or spaces)
    if (directVal && (directVal.includes('/') || directVal.includes('-') || directVal.includes(' '))) {
        return parseFlexibleDate(directVal);
    }

    // If separate Date and Time are provided
    if (dateVal && (timeVal || directVal)) {
        return parseFlexibleDate(dateVal, timeVal || directVal);
    }

    if (directVal) {
        return parseFlexibleDate(directVal);
    }

    return new Date(NaN);
}

function renderRounds(data, isLive) {
    const container = document.getElementById('rounds-container');
    if (!container) return;

    const isContingent = activeRoundFilter.toLowerCase().includes('contingent');

    const filtered = data.filter(r => {
        if ((r.Show || 'yes').toLowerCase() !== 'yes') return false;
        
        const eventVal = (r.Event || '').toLowerCase();
        if (!eventVal.includes(activeRoundFilter.toLowerCase())) return false;

        // If on Contingent, filter by Day
        if (isContingent) {
            // Find day column case-insensitively
            const dayKey = Object.keys(r).find(k => k.trim().toLowerCase() === 'day');
            const rawDay = dayKey ? String(r[dayKey] || '').trim().toLowerCase() : '';
            const dayNum = rawDay.replace(/[^0-9]/g, '');

            const hasAnyDaySpecified = data.some(item => {
                if ((item.Event || '').toLowerCase().includes('contingent')) {
                    const k = Object.keys(item).find(key => key.trim().toLowerCase() === 'day');
                    const d = k ? String(item[k] || '').trim() : '';
                    return d.length > 0;
                }
                return false;
            });

            if (hasAnyDaySpecified) {
                return dayNum === activeDayFilter;
            }
            // If no day numbers are configured in the sheet yet, display on Day 1
            return activeDayFilter === '1';
        }

        return true;
    });

    if (!filtered.length) {
        const emptyTitle = isContingent ? `Day ${activeDayFilter} Docket Under Seal` : `Simulation Docket Under Seal`;
        const emptyDesc = isContingent
            ? `No exhibits are currently scheduled for Day ${activeDayFilter}. Check other days or revisit as rounds are published.`
            : `Briefs, schedules, and submission parameters for this division will be unsealed according to the festival schedule.`;
        container.innerHTML = `
            <div class="rounds-empty-docket text-center reveal">
                <span class="r-empty-code">STATUS // PENDING</span>
                <h3 class="r-empty-title">${emptyTitle}</h3>
                <p class="r-empty-desc">${emptyDesc}</p>
            </div>`;
        initScrollReveal();
        return;
    }

    const now = new Date();
    let html = '';
    let globalIndex = 0;
    let roundIndex = 0;

    window.roundsDossierRegistry = window.roundsDossierRegistry || {};

    // Group all exhibits strictly according to the Round column
    const grouped = {};
    filtered.forEach(r => {
        const roundName = (r.Round || '').trim() || 'General Exhibits';
        if (!grouped[roundName]) grouped[roundName] = [];
        grouped[roundName].push(r);
    });

    for (const [roundName, items] of Object.entries(grouped)) {
        roundIndex++;
        const currentRoundIdx = roundIndex;

        // Common round deadline: check if any row in items has Deadline / RoundDeadline (or combined with Date)
        let roundDeadline = new Date(NaN);
        for (const it of items) {
            const d = extractRowDateTime(it, 'deadline', items);
            if (!isNaN(d.getTime())) {
                roundDeadline = d;
                break;
            }
        }
        const hasValidRoundDeadline = !isNaN(roundDeadline.getTime());

        // Common round submit link: check if any row in items has SubmitLink / RoundSubmitLink
        const submitItem = items.find(it => {
            const k = Object.keys(it).find(key => /submit/i.test(key));
            return k && it[k] && it[k].trim();
        });
        const submitKey = submitItem ? Object.keys(submitItem).find(key => /submit/i.test(key)) : null;
        const roundSubmitLink = (submitItem && submitKey) ? submitItem[submitKey].trim() : '';

        // Check if all exhibits with release dates are still in the future
        const exhibitsWithRelease = items.map(it => extractRowDateTime(it, 'release', items)).filter(d => !isNaN(d.getTime()));
        const isRoundLocked = exhibitsWithRelease.length > 0 && exhibitsWithRelease.every(rel => now < rel);

        // Round countdown badge for the round masthead
        let roundCountdownTag = '';
        if (hasValidRoundDeadline && !isRoundLocked) {
            const deadlineFormatted = roundDeadline.toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            if (now <= roundDeadline) {
                const diff = roundDeadline - now;
                const d = Math.floor(diff / 864e5), h = Math.floor((diff / 36e5) % 24), m = Math.floor((diff / 6e4) % 60);
                const countdownStr = (d > 0 ? d + 'd ' : '') + (h > 0 ? h + 'h ' : '') + m + 'm';
                roundCountdownTag = `<span class="round-deadline-tag" title="Submission Deadline: ${deadlineFormatted}"><span class="dot live"></span> Deadline in ${countdownStr}</span>`;
            } else {
                roundCountdownTag = `<span class="round-deadline-tag closed-tag" title="Concluded: ${deadlineFormatted}"><span class="dot closed"></span> Concluded</span>`;
            }
        }

        let roundSubmitBtnHtml = '';
        if (roundSubmitLink) {
            const safeSubmitUrl = sanitizeUrl(roundSubmitLink);
            if (isRoundLocked) {
                roundSubmitBtnHtml = `<button class="round-submit-btn disabled" disabled onclick="event.stopPropagation();" title="Submissions open upon round release">Round Locked</button>`;
            } else if (safeSubmitUrl !== '#') {
                roundSubmitBtnHtml = `<a href="${safeSubmitUrl}" target="_blank" rel="noopener noreferrer" class="round-submit-btn" onclick="event.stopPropagation();">Submit Round →</a>`;
            }
        }

        const preparedItems = items.map((r) => {
            globalIndex++;
            const idxNum = globalIndex;
            const release = extractRowDateTime(r, 'release', items);
            const hasValidRelease = !isNaN(release.getTime());
            const releaseFormatted = hasValidRelease ? release.toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

            let timeInfo = '';
            let actions = '';
            let statusLabel = 'Live';
            let dotClass = 'live';

            if (hasValidRelease && now < release) {
                // Exhibit has not unlocked yet (individual release timing)
                const diff = release - now;
                const d = Math.floor(diff / 864e5), h = Math.floor((diff / 36e5) % 24), m = Math.floor((diff / 6e4) % 60);
                const countdownStr = (d > 0 ? d + 'd ' : '') + (h > 0 ? h + 'h ' : '') + m + 'm';

                timeInfo = `<span class="meta-strip-item"><strong>Unlocks:</strong> ${releaseFormatted}</span> <span class="meta-countdown-tag">T-minus ${countdownStr}</span>`;
                actions = `<button class="btn-action-secondary" disabled style="opacity:0.4;cursor:not-allowed">Locked until Release</button>`;
                statusLabel = 'Unlocks in ' + countdownStr;
                dotClass = 'locked';
            } else {
                // Exhibit is unlocked! Deadlines belong strictly to the round header
                const safeBriefUrl = r.BriefLink ? sanitizeUrl(r.BriefLink) : '#';
                actions = (r.BriefLink && safeBriefUrl !== '#') ? `<a href="${safeBriefUrl}" target="_blank" rel="noopener noreferrer" class="btn-action-secondary">Read Brief ↗</a>` : '';

                if (hasValidRoundDeadline && now > roundDeadline) {
                    statusLabel = 'Concluded';
                    dotClass = 'closed';
                } else {
                    statusLabel = 'Live';
                    dotClass = 'live';
                }
                timeInfo = hasValidRelease ? `<span class="meta-strip-item"><strong>Released:</strong> ${releaseFormatted}</span>` : '';
            }

            const roundTag = escapeHtml(r.Round || activeRoundFilter);
            const title = escapeHtml(r.Title || `Exhibit ${idxNum}`);
            const fullDesc = r.Description ? escapeHtml(r.Description).trim() : '';

            return {
                idx: idxNum,
                roundTag: roundTag,
                title: title,
                desc: fullDesc,
                statusLabel: statusLabel,
                dotClass: dotClass,
                timeInfo: timeInfo,
                actions: actions
            };
        });

        window.roundsDossierRegistry[currentRoundIdx] = preparedItems;

        const streamRowsHtml = preparedItems.map((item, i) => `
            <div class="stream-row ${i === 0 ? 'active' : ''}" 
                 data-round-idx="${currentRoundIdx}" 
                 data-ex-idx="${i}" 
                 tabindex="0"
                 role="button"
                 aria-selected="${i === 0 ? 'true' : 'false'}"
                 onclick="switchRoundExhibit(${currentRoundIdx}, ${i}, this)"
                 onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();switchRoundExhibit(${currentRoundIdx}, ${i}, this);}">
                <div class="stream-row-header">
                    <h3 class="stream-row-title">${item.title}</h3>
                    <div class="stream-row-beacon" style="${item.dotClass === 'live' ? 'color:var(--accent-green)' : item.dotClass === 'locked' ? 'color:var(--accent-amber)' : 'color:var(--text-dim)'}">
                        <span class="dot ${item.dotClass}"></span> ${item.statusLabel}
                    </div>
                </div>
            </div>
        `).join('');

        const initialItem = preparedItems[0];
        const canvasHtml = `
            <div class="dossier-canvas" id="dossier-canvas-${currentRoundIdx}">
                <span class="canvas-tag">${initialItem.roundTag}</span>
                <h2 class="canvas-title">${initialItem.title}</h2>
                ${initialItem.desc ? `<p class="canvas-text">${initialItem.desc}</p>` : ''}
                ${initialItem.timeInfo ? `<div class="canvas-meta-strip">${initialItem.timeInfo}</div>` : ''}
                ${initialItem.actions ? `<div class="canvas-actions">${initialItem.actions}</div>` : ''}
            </div>
        `;

        const safeRound = escapeHtml(roundName);
        const countText = `${items.length} Exhibit${items.length === 1 ? '' : 's'}`;

        html += `
        <div class="round-accordion-group reveal" data-round-group="${safeRound}">
            <div class="round-accordion-header" tabindex="0" role="button" aria-expanded="false" onclick="toggleRoundAccordion(this)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleRoundAccordion(this);}">
                <div class="round-header-left">
                    <h2 class="round-header-title">${safeRound}</h2>
                    <span class="round-header-badge">${countText}</span>
                </div>
                <div class="round-header-right">
                    ${roundCountdownTag}
                    ${roundSubmitBtnHtml}
                    <div class="round-dropdown-btn">
                        <span>Exhibits</span>
                        <svg class="round-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="6 9 12 15 18 9"/>
                        </svg>
                    </div>
                </div>
            </div>
            <div class="round-accordion-body">
                <div class="round-accordion-body-inner">
                    <div class="editorial-split-dossier ${items.length > 4 ? 'has-scrollable-stream' : ''}">
                        <div class="dossier-stream-rail ${items.length > 4 ? 'stream-rail-scrollable' : ''}">
                            ${streamRowsHtml}
                        </div>
                        ${canvasHtml}
                    </div>
                </div>
            </div>
        </div>`;
    }

    container.innerHTML = html;
    initScrollReveal();
}

window.switchRoundExhibit = function(roundIdx, exIdx, rowEl) {
    const parentRail = rowEl.closest('.dossier-stream-rail');
    if (parentRail) {
        parentRail.querySelectorAll('.stream-row').forEach(r => {
            r.classList.remove('active');
            r.setAttribute('aria-selected', 'false');
        });
    }
    rowEl.classList.add('active');
    rowEl.setAttribute('aria-selected', 'true');

    const items = window.roundsDossierRegistry ? window.roundsDossierRegistry[roundIdx] : null;
    if (!items || !items[exIdx]) return;
    const item = items[exIdx];

    const canvas = document.getElementById('dossier-canvas-' + roundIdx);
    if (!canvas) return;

    canvas.innerHTML = `
        <span class="canvas-tag">${item.roundTag}</span>
        <h2 class="canvas-title">${item.title}</h2>
        ${item.desc ? `<p class="canvas-text">${item.desc}</p>` : ''}
        ${item.timeInfo ? `<div class="canvas-meta-strip">${item.timeInfo}</div>` : ''}
        ${item.actions ? `<div class="canvas-actions">${item.actions}</div>` : ''}
    `;

    canvas.style.animation = 'none';
    canvas.offsetHeight;
    canvas.style.animation = 'canvasFade 0.28s var(--ease-out)';

    if (window.innerWidth <= 860) {
        rowEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
};

// ──────────────────────────────────────────────────────────────
// 5. BAR CHART LEADERBOARD (Contingent only)
// ──────────────────────────────────────────────────────────────
let allScoresData = [];
let searchQuery = '';

async function initScores() {
    const container = document.getElementById('scores-table-container');
    if (!container) return;

    let isLive = false;
    const res = await fetchCsvWithFallback(
        resolvedScoresUrl || CONFIG.SCORES_CSV_URL,
        CONFIG.FALLBACK_SCORES_CSV_URL
    );

    if (res.ok) {
        resolvedScoresUrl = res.url;
        allScoresData = parseCSV(res.text);
        isLive = allScoresData.length > 0;
    } else {
        allScoresData = [];
    }

    renderBarChart(isLive);

    let searchDebounceTimer = null;
    const search = document.getElementById('scores-search');
    if (search) {
        search.addEventListener('input', e => {
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => {
                searchQuery = e.target.value.toLowerCase().trim();
                renderBarChart(isLive);
            }, 80);
        });
    }

    if (isLive && CONFIG.AUTO_REFRESH_INTERVAL) {
        setInterval(async () => {
            try {
                const refreshRes = await fetchCsvWithFallback(
                    resolvedScoresUrl || CONFIG.SCORES_CSV_URL,
                    CONFIG.FALLBACK_SCORES_CSV_URL
                );
                if (refreshRes.ok) {
                    const fresh = parseCSV(refreshRes.text);
                    if (fresh.length > 0) allScoresData = fresh;
                    renderBarChart(true);
                }
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
    
    // Assign permanent ranks based on full contingent list (handling ties)
    contingentRows.forEach((row, i) => {
        if (i > 0 && (parseFloat(row.Score) || 0) === (parseFloat(contingentRows[i-1].Score) || 0)) {
            row._rank = contingentRows[i-1]._rank;
        } else {
            row._rank = i + 1;
        }
    });

    // Cancel active FLIP transitions and clear transforms before measuring positions
    container.querySelectorAll('.horizon-ledger-row').forEach(row => {
        row.style.transition = 'none';
        row.style.transform = 'none';
    });

    // Capture initial positions for FLIP animation
    const firstPositions = new Map();
    container.querySelectorAll('.horizon-ledger-row, .bar-row').forEach(row => {
        const key = row.getAttribute('data-team');
        if (key) firstPositions.set(key, row.getBoundingClientRect().top);
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
        if (searchQuery) {
            container.innerHTML = `
                <div class="rounds-empty-docket text-center reveal">
                    <span class="r-empty-code">QUERY // ZERO MATCHES</span>
                    <h3 class="r-empty-title">No contingents found matching "${escapeHtml(searchQuery)}"</h3>
                    <p class="r-empty-desc">Check spelling or search by institutional affiliation.</p>
                </div>`;
        } else {
            container.innerHTML = `
                <div class="rounds-empty-docket text-center reveal">
                    <span class="r-empty-code">STANDINGS // PENDING RELEASE</span>
                    <h3 class="r-empty-title">Relative Horizon Ledger Under Seal</h3>
                    <p class="r-empty-desc">The live contingent spectrum will activate once the opening round evaluation concludes.</p>
                </div>`;
        }
        return;
    }

    // Compute max score for bar width proportions (use overall max, not just filtered max)
    const rawMax = Math.max(0, ...contingentRows.map(r => parseFloat(r.Score) || 0));
    const maxScore = isFinite(rawMax) && rawMax > 0 ? rawMax : 0;

    const rows = filtered.map((row) => {
        const rank = row._rank;
        const rawScore = parseFloat(row.Score);
        const score = isNaN(rawScore) ? 0 : rawScore;
        const pct = maxScore > 0 ? Math.max(0, Math.min(100, (score / maxScore * 100))).toFixed(1) : "0.0";
        const teamKey = escapeHtml((row.Team || 'team_' + rank).replace(/\s+/g, '_'));

        let rankClass = 'rank-general';
        let fillClass = '';
        if (rank === 1) { 
            rankClass = 'rank-gold'; 
            fillClass = 'rank-gold-fill'; 
        } else if (rank === 2) { 
            rankClass = 'rank-silver'; 
            fillClass = 'rank-silver-fill'; 
        } else if (rank === 3) { 
            rankClass = 'rank-bronze'; 
            fillClass = 'rank-bronze-fill'; 
        }

        const rankDisplay = String(rank).padStart(2, '0');

        return `
        <div class="horizon-ledger-row" data-team="${teamKey}" data-pct="${pct}">
            <div class="horizon-rank-num ${rankClass}">${rankDisplay}</div>
            <div class="horizon-team-block">
                <div class="horizon-team-name">${escapeHtml(row.Team || 'Team ' + rank)}</div>
                <div class="horizon-team-college">${escapeHtml(row.College || '')}</div>
            </div>
            <div class="horizon-relative-track">
                <div class="relative-gauge-groove">
                    <div class="relative-gauge-fill ${fillClass}" style="width:0%"></div>
                </div>
            </div>
        </div>`;
    }).join('');

    container.innerHTML = `
    <div class="relative-horizon-ledger">
        <div class="horizon-ledger-header">
            <div>Rank</div>
            <div>Contingent</div>
            <div></div>
        </div>
        ${rows}
    </div>`;

    // FLIP Animation: invert and play
    if (firstPositions.size > 0) {
        container.querySelectorAll('.horizon-ledger-row').forEach(row => {
            const key = row.getAttribute('data-team');
            if (key && firstPositions.has(key)) {
                const firstTop = firstPositions.get(key);
                const lastTop = row.getBoundingClientRect().top;
                const deltaY = firstTop - lastTop;
                if (deltaY !== 0) {
                    row.style.transform = `translateY(${deltaY}px)`;
                    row.style.transition = 'none';
                    requestAnimationFrame(() => {
                        row.style.transition = 'transform 0.38s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease';
                        row.style.transform = 'translateY(0)';
                    });
                }
            }
        });
    }

    // Animate relative gauge bars in after a short delay
    requestAnimationFrame(() => {
        setTimeout(() => {
            container.querySelectorAll('.relative-gauge-fill').forEach((fill, i) => {
                const row = fill.closest('.horizon-ledger-row');
                const pct = row ? row.getAttribute('data-pct') : 0;
                fill.style.transitionDelay = `${i * 0.04}s`;
                fill.style.width = pct + '%';
            });
        }, 80);
    });
}

// ──────────────────────────────────────────────────────────────
// 6. DYNAMIC MOTION & INTERACTION PRIMITIVES
// ──────────────────────────────────────────────────────────────

/**
 * 1. Magnetic Navigation Glider
 * Fluid sliding pill under active/hovered header nav links.
 */
function initNavGlider() {
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;

    let glider = document.getElementById('nav-glider');
    if (!glider) {
        glider = document.createElement('div');
        glider.className = 'nav-glider';
        glider.id = 'nav-glider';
        glider.setAttribute('aria-hidden', 'true');
        navLinks.prepend(glider);
    }

    const links = Array.from(navLinks.querySelectorAll('a:not(.nav-cta)'));
    if (!links.length) return;

    let activeLink = links.find(l => l.classList.contains('active')) || null;

    function moveGlider(targetEl) {
        if (!targetEl || window.innerWidth <= 768) {
            glider.style.opacity = '0';
            return;
        }
        const navRect = navLinks.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        const offsetLeft = targetRect.left - navRect.left;
        const offsetTop = targetRect.top - navRect.top;
        const width = targetRect.width;
        const height = targetRect.height;

        glider.style.width = `${width}px`;
        glider.style.height = `${height}px`;
        glider.style.transform = `translate3d(${offsetLeft}px, ${offsetTop}px, 0)`;
        glider.style.opacity = '1';
    }

    links.forEach(link => {
        link.addEventListener('mouseenter', () => moveGlider(link));
    });

    navLinks.addEventListener('mouseleave', () => {
        if (activeLink) {
            moveGlider(activeLink);
        } else {
            glider.style.opacity = '0';
        }
    });

    const refreshGlider = () => {
        if (activeLink) moveGlider(activeLink);
    };

    refreshGlider();
    setTimeout(refreshGlider, 120);
    window.addEventListener('resize', refreshGlider);
    if (document.fonts) document.fonts.ready.then(refreshGlider);
}

/**
 * 2. Cursor-Damped Ambient Spotlight
 * Tracks cursor inside hero section with continuous lerp physics and a
 * seamless, distance-attenuated fade out as the cursor or viewport moves past the hero.
 */
function initHeroSpotlight() {
    const hero = document.querySelector('.hero-section');
    if (!hero) return;

    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let spotlight = document.getElementById('hero-spotlight');
    if (!spotlight) {
        spotlight = document.createElement('div');
        spotlight.className = 'hero-spotlight';
        spotlight.id = 'hero-spotlight';
        hero.prepend(spotlight);
    }

    const radius = 300; // Half of 600px width/height
    let heroWidth = hero.offsetWidth || window.innerWidth;
    let heroHeight = hero.offsetHeight || 600;
    let heroTop = 0;

    function updateHeroMetrics() {
        const rect = hero.getBoundingClientRect();
        heroTop = rect.top + window.scrollY;
        heroWidth = hero.offsetWidth;
        heroHeight = hero.offsetHeight;
    }
    updateHeroMetrics();
    window.addEventListener('resize', updateHeroMetrics, { passive: true });

    let targetX = heroWidth / 2;
    let targetY = heroHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    let targetOpacity = 0;
    let currentOpacity = 0;
    let mouseX = -1000;
    let mouseY = -1000;
    let hasMouse = false;
    let isHeroVisible = true;
    let rafId = null;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        hasMouse = true;
        if (isHeroVisible && !rafId) {
            rafId = requestAnimationFrame(loop);
        }
    }, { passive: true });

    window.addEventListener('scroll', () => {
        if (isHeroVisible && hasMouse && !rafId) {
            rafId = requestAnimationFrame(loop);
        }
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
        hasMouse = false;
        if (isHeroVisible && !rafId) {
            rafId = requestAnimationFrame(loop);
        }
    });

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            isHeroVisible = entries[0].isIntersecting;
            if (!isHeroVisible) {
                targetOpacity = 0;
                spotlight.style.opacity = '0';
                if (rafId) {
                    cancelAnimationFrame(rafId);
                    rafId = null;
                }
            } else {
                updateHeroMetrics();
                if (!rafId) {
                    rafId = requestAnimationFrame(loop);
                }
            }
        }, { threshold: 0 });
        observer.observe(hero);
    }

    function loop() {
        if (hasMouse && isHeroVisible) {
            const scrollY = window.scrollY;
            const heroViewportTop = heroTop - scrollY;
            targetX = mouseX;
            targetY = mouseY - heroViewportTop;

            // Vertical fade attenuation:
            const fadeBottomStart = heroHeight - 160;
            const fadeBottomEnd = heroHeight + 220;
            const fadeTopStart = 60;
            const fadeTopEnd = -80;

            let opacityY = 1;
            if (targetY > fadeBottomStart) {
                opacityY = 1 - (targetY - fadeBottomStart) / (fadeBottomEnd - fadeBottomStart);
            } else if (targetY < fadeTopStart) {
                opacityY = (targetY - fadeTopEnd) / (fadeTopStart - fadeTopEnd);
            }

            // Horizontal edge softening
            let opacityX = 1;
            if (targetX < 40) {
                opacityX = Math.max(0, (targetX + 80) / 120);
            } else if (targetX > heroWidth - 40) {
                opacityX = Math.max(0, (heroWidth + 80 - targetX) / 120);
            }

            // Viewport scroll factor (fades gracefully as hero scrolls out of view)
            const heroViewportBottom = heroViewportTop + heroHeight;
            let scrollFactor = 1;
            if (heroViewportBottom < 0 || heroViewportTop > window.innerHeight) {
                scrollFactor = 0;
            } else if (heroViewportBottom < 250) {
                scrollFactor = Math.max(0, heroViewportBottom / 250);
            }

            targetOpacity = Math.max(0, Math.min(1, opacityY * opacityX * scrollFactor)) * 0.7;
        } else {
            targetOpacity = 0;
        }

        // Smooth physics-based lerp for both position and opacity
        currentX += (targetX - currentX) * 0.08;
        currentY += (targetY - currentY) * 0.08;
        currentOpacity += (targetOpacity - currentOpacity) * 0.08;

        const deltaX = Math.abs(targetX - currentX);
        const deltaY = Math.abs(targetY - currentY);
        const deltaOp = Math.abs(targetOpacity - currentOpacity);

        if (currentOpacity > 0.005) {
            spotlight.style.opacity = currentOpacity.toFixed(3);
            spotlight.style.transform = `translate3d(${currentX - radius}px, ${currentY - radius}px, 0)`;
        } else if (spotlight.style.opacity !== '0') {
            spotlight.style.opacity = '0';
        }

        const isConverged = deltaX < 0.15 && deltaY < 0.15 && deltaOp < 0.002;
        if (isHeroVisible && !isConverged && (hasMouse || currentOpacity > 0.005)) {
            rafId = requestAnimationFrame(loop);
        } else {
            rafId = null;
        }
    }

    rafId = requestAnimationFrame(loop);
}

/**
 * 3. Tactile Button Click Haptics & Shockwave Ripple
 * Emits an expanding cyan shockwave on button clicks.
 */
function initButtonHaptics() {
    document.addEventListener('pointerdown', (e) => {
        const btn = e.target.closest('.btn, .carousel-btn');
        if (!btn) return;

        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const shockwave = document.createElement('div');
        shockwave.className = 'btn-shockwave';
        shockwave.style.left = `${x}px`;
        shockwave.style.top = `${y}px`;

        btn.appendChild(shockwave);
        setTimeout(() => { shockwave.remove(); }, 600);
    });
}

// ──────────────────────────────────────────────────────────────
// 7. INIT
// ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initTypewriter();
    initCarousel();
    initLightbox();
    initNavGlider();
    initHeroSpotlight();
    initButtonHaptics();
    initFilterGlider();
    initHeroZenFullscreen();

    // Mobile nav
    const toggle = document.querySelector('.mobile-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (toggle && navLinks) {
        toggle.addEventListener('click', () => navLinks.classList.toggle('open'));
    }

    // Bind config links
    document.querySelectorAll('.link-case').forEach(el => {
        el.href = sanitizeUrl(CONFIG.CASE_COMPETITION_LINK);
        el.setAttribute('rel', 'noopener noreferrer');
    });
    document.querySelectorAll('.link-quiz').forEach(el => {
        el.href = sanitizeUrl(CONFIG.CONTINGENT_QUIZ_LINK);
        el.setAttribute('rel', 'noopener noreferrer');
    });
    document.querySelectorAll('.contact-email-link').forEach(el => {
        el.href = `mailto:${CONFIG.CONTACT_EMAIL}`;
        if (!el.textContent.trim()) el.textContent = CONFIG.CONTACT_EMAIL;
    });
    document.querySelectorAll('.instagram-link').forEach(el => {
        el.href = sanitizeUrl(CONFIG.INSTAGRAM_URL);
        el.setAttribute('rel', 'noopener noreferrer');
        if (!el.textContent.trim()) el.textContent = `@${CONFIG.INSTAGRAM_HANDLE}`;
    });

    // Check registration deadline for hero action buttons
    checkRegistrationDeadline();

    // Engines
    initRounds();
    initScores();
    initTrailer();
    initScrollReveal();
});

// ──────────────────────────────────────────────────────────────
// 5A. REGISTRATION DEADLINE ENGINE
// ──────────────────────────────────────────────────────────────
function checkRegistrationDeadline() {
    const cutoffStr = (typeof CONFIG !== 'undefined' && CONFIG.REGISTRATION_CUTOFF_DATE)
        ? CONFIG.REGISTRATION_CUTOFF_DATE
        : "2026-12-10T23:59:59+05:30";
    const cutoff = new Date(cutoffStr);
    if (!isNaN(cutoff.getTime()) && new Date() > cutoff) {
        const heroActions = document.querySelector('.hero-actions');
        if (heroActions) heroActions.style.display = 'none';
    }
}
checkRegistrationDeadline();

// ──────────────────────────────────────────────────────────────
// 5B. DYNAMIC TRAILER ENGINE (Google Sheet Controlled)
// ──────────────────────────────────────────────────────────────
function getYouTubeEmbedUrl(url) {
    if (!url || typeof url !== 'string') return null;
    const cleanUrl = url.trim();
    // Fast path: direct 11-character video ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) {
        return `https://www.youtube-nocookie.com/embed/${cleanUrl}?autoplay=0&rel=0`;
    }
    try {
        const parsed = new URL(cleanUrl);
        const host = parsed.hostname.toLowerCase();
        let videoId = null;
        if (host === 'youtu.be') {
            videoId = parsed.pathname.slice(1).split(/[?#&/]/)[0];
        } else if (host === 'youtube.com' || host === 'www.youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
            if (parsed.searchParams.has('v')) {
                videoId = parsed.searchParams.get('v');
            } else {
                const match = parsed.pathname.match(/\/(?:embed|shorts|v)\/([a-zA-Z0-9_-]{11})/i);
                if (match) videoId = match[1];
            }
        }
        if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
            return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0`;
        }
    } catch (_) {
        const regExp = /(?:(?:www\.|m\.)?youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
        const match = cleanUrl.match(regExp);
        if (match && match[1] && /^[a-zA-Z0-9_-]{11}$/.test(match[1])) {
            return `https://www.youtube-nocookie.com/embed/${match[1]}?autoplay=0&rel=0`;
        }
    }
    return null;
}

async function initTrailer() {
    const section = document.getElementById('trailer-section');
    const iframe = document.getElementById('trailer-iframe');
    if (!section || !iframe) return;

    if (!CONFIG.TRAILER_CSV_URL && !CONFIG.FALLBACK_TRAILER_CSV_URL) {
        section.style.display = 'none';
        return;
    }

    // 1. Instant optimistic restore from session cache so page reload never drops or flickers
    let wasCached = false;
    try {
        const cachedUrl = sessionStorage.getItem('cognito_trailer_embed');
        if (cachedUrl) {
            const cachedEmbed = getYouTubeEmbedUrl(cachedUrl);
            if (cachedEmbed) {
                iframe.src = cachedEmbed;
                section.style.display = '';
                section.querySelectorAll('.reveal, .reveal-scale').forEach(el => el.classList.add('visible'));
                wasCached = true;
            }
        }
    } catch (e) {}

    // 2. Fetch latest live sheet status in background
    try {
        const res = await fetchCsvWithFallback(
            resolvedTrailerUrl || CONFIG.TRAILER_CSV_URL,
            CONFIG.FALLBACK_TRAILER_CSV_URL
        );

        if (res.ok && res.text) {
            resolvedTrailerUrl = res.url;
            const rows = parseCSV(res.text);

            if (rows.length > 0) {
                const firstRow = rows[0];
                const keys = Object.keys(firstRow);

                // Find URL column and Show column
                const urlKey = keys.find(k => /url|link|video|youtube|embed/i.test(k));
                const showKey = keys.find(k => /show|active|confirm|release|publish|status/i.test(k));

                let videoUrl = '';
                let shouldShow = false;

                if (urlKey && showKey) {
                    videoUrl = (firstRow[urlKey] || '').trim();
                    const showVal = (firstRow[showKey] || '').trim().toLowerCase();
                    shouldShow = (showVal === 'yes' || showVal === 'y' || showVal === 'true');
                } else if (keys.length >= 2) {
                    videoUrl = (firstRow[keys[0]] || '').trim();
                    const showVal = (firstRow[keys[1]] || '').trim().toLowerCase();
                    shouldShow = (showVal === 'yes' || showVal === 'y' || showVal === 'true');
                }

                if (shouldShow && videoUrl) {
                    const embedUrl = getYouTubeEmbedUrl(videoUrl);
                    if (embedUrl) {
                        try { sessionStorage.setItem('cognito_trailer_embed', videoUrl); } catch (e) {}
                        if (iframe.src !== embedUrl) {
                            iframe.src = embedUrl;
                        }
                        section.style.display = '';
                        section.querySelectorAll('.reveal, .reveal-scale').forEach(el => el.classList.add('visible'));
                        initScrollReveal();
                        return;
                    }
                } else {
                    // Explicitly unconfirmed or blank in the Google Sheet
                    try { sessionStorage.removeItem('cognito_trailer_embed'); } catch (e) {}
                    section.style.display = 'none';
                    iframe.src = '';
                    return;
                }
            }
        }
    } catch (e) {}

    // If there was no valid cache and fetch failed or returned empty
    if (!wasCached) {
        section.style.display = 'none';
    }
}

// ──────────────────────────────────────────────────────────────
// 6. INTERACTIVE BACKGROUND NODES
// ──────────────────────────────────────────────────────────────
function initNodes() {
    const bgContainer = document.querySelector('.bg-canvas');
    if (!bgContainer) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

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
    
    // Cap DPI to 1.25 to prevent fillrate choking on 4K/Retina displays
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25);

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    window.addEventListener('resize', resize, { passive: true });
    resize();

    const particles = [];
    const numParticles = width > 768 ? 42 : 22;
    const maxDistance = 135;
    const maxDistanceSq = maxDistance * maxDistance;
    const halfDistanceSq = (maxDistance * 0.5) * (maxDistance * 0.5);
    const gravityDist = maxDistance * 2.2;
    const gravityDistSq = gravityDist * gravityDist;
    
    let mouse = { x: -1000, y: -1000 };
    let touchTimeout;

    // Desktop interaction
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    }, { passive: true });

    window.addEventListener('mouseout', () => {
        mouse.x = -1000;
        mouse.y = -1000;
    });

    // Mobile interaction: Touch and Scroll
    window.addEventListener('touchstart', (e) => {
        if (e.touches[0]) {
            mouse.x = e.touches[0].clientX;
            mouse.y = e.touches[0].clientY;
            clearTimeout(touchTimeout);
        }
    }, { passive: true });
    
    window.addEventListener('touchmove', (e) => {
        if (e.touches[0]) {
            mouse.x = e.touches[0].clientX;
            mouse.y = e.touches[0].clientY;
            clearTimeout(touchTimeout);
        }
    }, { passive: true });
    
    window.addEventListener('touchend', () => {
        touchTimeout = setTimeout(() => {
            mouse.x = -1000;
            mouse.y = -1000;
        }, 1200); 
    });

    for (let i = 0; i < numParticles; i++) {
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

    let isTabVisible = !document.hidden;
    document.addEventListener('visibilitychange', () => {
        isTabVisible = !document.hidden;
        if (isTabVisible) {
            requestAnimationFrame(animate);
        }
    });

    function animate() {
        if (!isTabVisible) return;

        ctx.clearRect(0, 0, width, height);

        const closeLines = [];
        const farLines = [];

        // 1. Update particle physics
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;

            // Screen-wrap (Infinite Flow)
            if (p.x < 0) p.x = width;
            else if (p.x > width) p.x = 0;
            
            if (p.y < 0) p.y = height;
            else if (p.y > height) p.y = 0;

            // Collect edge connections (test squared distance first)
            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const distSq = dx * dx + dy * dy;

                if (distSq < maxDistanceSq) {
                    if (distSq < halfDistanceSq) {
                        closeLines.push(p.x, p.y, p2.x, p2.y);
                    } else {
                        farLines.push(p.x, p.y, p2.x, p2.y);
                    }
                }
            }

            // Mouse gravity well (disabled in zen fullscreen mode)
            if (!window.isZenFullscreen && !document.body.classList.contains('zen-fullscreen-mode')) {
                const dxm = p.x - mouse.x;
                const dym = p.y - mouse.y;
                const distmSq = dxm * dxm + dym * dym;

                if (distmSq < gravityDistSq) {
                    const distm = Math.sqrt(distmSq);
                    if (distm > 0.1) {
                        const force = (1 - distm / gravityDist) * 0.02;
                        p.vx -= (dxm / distm) * force;
                        p.vy -= (dym / distm) * force;
                    }
                }
            }
            
            // Gracefully return to base drifting velocity over time
            p.vx += (p.baseVx - p.vx) * 0.02;
            p.vy += (p.baseVy - p.vy) * 0.02;
        }

        // 2. Batch draw connecting lines with only 2 stroke flushes
        ctx.lineWidth = 0.5;
        if (closeLines.length > 0) {
            ctx.beginPath();
            for (let k = 0; k < closeLines.length; k += 4) {
                ctx.moveTo(closeLines[k], closeLines[k + 1]);
                ctx.lineTo(closeLines[k + 2], closeLines[k + 3]);
            }
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.085)';
            ctx.stroke();
        }

        if (farLines.length > 0) {
            ctx.beginPath();
            for (let k = 0; k < farLines.length; k += 4) {
                ctx.moveTo(farLines[k], farLines[k + 1]);
                ctx.lineTo(farLines[k + 2], farLines[k + 3]);
            }
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.035)';
            ctx.stroke();
        }

        // 3. Batch draw node dots with a single fill call
        ctx.beginPath();
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            ctx.moveTo(p.x + p.radius, p.y);
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        }
        ctx.fillStyle = 'rgba(0, 240, 255, 0.42)';
        ctx.fill();

        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
}

// Call on load
initNodes();

// ──────────────────────────────────────────────────────────────
// 7. MAGNETIC BUTTONS
// ──────────────────────────────────────────────────────────────
function initMagneticButtons() {
    // Select buttons and the hero logo wrapper for magnetic effect (excluding slider tabs)
    const magneticElements = document.querySelectorAll('.btn, .hero-logo-wrap');
    
    magneticElements.forEach(btn => {
        let rect = null;

        btn.addEventListener('mouseenter', () => {
            rect = btn.getBoundingClientRect();
        });

        btn.addEventListener('mousemove', (e) => {
            if (!rect) rect = btn.getBoundingClientRect();
            const h = rect.width / 2;
            const v = rect.height / 2;
            const x = e.clientX - rect.left - h;
            const y = e.clientY - rect.top - v;
            
            // The pull factor (gentle, subtle effect with translate3d)
            btn.style.transform = `translate3d(${x * 0.15}px, ${y * 0.15}px, 0)`;
            btn.style.transition = 'transform 0.1s ease-out';
        });

        btn.addEventListener('mouseleave', () => {
            rect = null;
            btn.style.transform = '';
            btn.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'; // snappy bounce back
        });
    });
}

initMagneticButtons();

// ──────────────────────────────────────────────────────────────
// 8. HERO LOGO ZEN FULLSCREEN EASTER EGG
// ──────────────────────────────────────────────────────────────
function initHeroZenFullscreen() {
    if (window.__heroZenInitialized) return;
    window.__heroZenInitialized = true;

    const heroLogoWrap = document.querySelector('.hero-logo-wrap');
    if (!heroLogoWrap) return;

    heroLogoWrap.setAttribute('title', 'Click to toggle Zen Fullscreen');

    function getFullscreenElement() {
        return document.fullscreenElement 
            || document.webkitFullscreenElement 
            || document.mozFullScreenElement 
            || document.msFullscreenElement 
            || null;
    }

    function setZenMode(enable) {
        window.isZenFullscreen = enable;
        document.body.classList.toggle('zen-fullscreen-mode', enable);
        document.documentElement.classList.toggle('zen-fullscreen-mode', enable);

        const navbar = document.querySelector('.navbar');
        const heroActions = document.querySelector('.hero-actions');
        if (navbar) {
            navbar.style.setProperty('display', enable ? 'none' : '', 'important');
        }
        if (heroActions) {
            heroActions.style.setProperty('display', enable ? 'none' : '', 'important');
        }
    }

    let isTransitioning = false;

    heroLogoWrap.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const currentlyZen = window.isZenFullscreen 
            || document.body.classList.contains('zen-fullscreen-mode') 
            || document.documentElement.classList.contains('zen-fullscreen-mode') 
            || !!getFullscreenElement();

        isTransitioning = true;
        setTimeout(() => { isTransitioning = false; }, 800);

        if (!currentlyZen) {
            setZenMode(true);

            const requestFs = document.documentElement.requestFullscreen 
                || document.documentElement.webkitRequestFullscreen 
                || document.documentElement.mozRequestFullScreen 
                || document.documentElement.msRequestFullscreen;

            if (requestFs) {
                try {
                    const res = requestFs.call(document.documentElement);
                    if (res && res.catch) res.catch(() => {});
                } catch (_) {}
            }
        } else {
            setZenMode(false);

            const exitFs = document.exitFullscreen 
                || document.webkitExitFullscreen 
                || document.mozCancelFullScreen 
                || document.msExitFullscreen;

            if (getFullscreenElement() && exitFs) {
                try {
                    const res = exitFs.call(document);
                    if (res && res.catch) res.catch(() => {});
                } catch (_) {}
            }
        }
    });

    const onFullscreenChange = () => {
        if (isTransitioning) return;
        if (!getFullscreenElement()) {
            setZenMode(false);
        } else {
            setZenMode(true);
        }
    };

    ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(evt => {
        document.addEventListener(evt, onFullscreenChange);
    });
}