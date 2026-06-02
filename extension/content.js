// ========== Find website ==========
const currentHost = window.location.hostname.replace("www.", "");
const SITE = SITE_CONFIGS[currentHost];

console.log("DETECTED HOST:", currentHost);
console.log("SITE CONFIG FOUND:", SITE);
if (!SITE) {
    console.log("No config found for", currentHost);
}

// ========== State ==========
let isWatching = false;

// Helper: match current URL against either a string or array of path fragments.
function pathMatches(pathIncludes) {
    if (!pathIncludes) return false;
    if (Array.isArray(pathIncludes)) {
        return pathIncludes.some((p) => window.location.href.includes(p));
    }
    return window.location.href.includes(pathIncludes);
}

// Helper: try a selector or array of selectors and return the first match.
function queryOne(selectors) {
    if (!selectors) return null;
    if (Array.isArray(selectors)) {
        for (const selector of selectors) {
            try {
                const el = document.querySelector(selector);
                if (el) return el;
            } catch (e) {
                // Ignore invalid selectors and continue to next
            }
        }
        return null;
    }
    return document.querySelector(selectors);
}

// Helper: try multiple selector alternatives and return the first non-empty NodeList.
function queryAll(selectors) {
    if (!selectors) return [];
    if (Array.isArray(selectors)) {
        for (const selector of selectors) {
            try {
                const nodes = document.querySelectorAll(selector);
                if (nodes && nodes.length) return nodes;
            } catch (e) {
                // Skip invalid selectors
            }
        }
        return [];
    }
    return document.querySelectorAll(selectors) || [];
}

// Helper: prefer `og:image` meta if no explicit poster element is present.
function getMetaCover() {
    const meta =
        document.querySelector("meta[property='og:image']") ||
        document.querySelector("meta[name='og:image']") ||
        document.querySelector("meta[name='twitter:image']");
    return meta ? meta.content || meta.getAttribute("content") || "" : "";
}

// Helper: extract a usable cover image URL from different possible element shapes.
function getCoverUrl(el) {
    if (!el) return getMetaCover();
    if (el.tagName === "IMG") return el.src || getMetaCover();
    const bgImage = el.style && el.style.backgroundImage;
    if (bgImage && bgImage !== "none") {
        const match = bgImage.match(/url\((?:['"]?)(.*?)(?:['"]?)\)/);
        if (match) return match[1];
    }
    const nestedImg = el.querySelector && el.querySelector("img");
    if (nestedImg) return nestedImg.src || getMetaCover();
    return el.getAttribute("src") || getMetaCover();
}

// ========== Functions ==========
// scrapeData(): Attempts to read page data. It's resilient: it uses fallback selectors,
// returns partial data when the player is blocked, and prefers meta tags for cover art.
function scrapeData() {
    console.log("scrapeData called", {
        href: window.location.href,
        readyState: document.readyState,
        watchPathIncludes: SITE?.watchPathIncludes,
        pathMatches: SITE ? pathMatches(SITE.watchPathIncludes) : false,
    });

    if (!SITE) return null;
    if (!pathMatches(SITE.watchPathIncludes)) return null;

    const s = SITE.selectors;
    console.log("SELECTORS:", s);

    // Attempt to find elements using the configured selectors (with fallbacks).
    const animeTitleEl = queryOne(s.animeTitle);
    const titleEl = queryOne(s.episodeTitle);
    const numberEl = queryOne(s.episodeNum);
    const timestamps = queryAll(s.timestamps);
    const coverEl = queryOne(s.cover);
    const videoEl = queryOne(s.video);

    console.log("DEBUG VALUES:", {
        animeTitleEl,
        titleEl,
        timestampsLength: timestamps?.length,
        coverEl,
        videoEl,
    });

    // If there's no episode title yet, wait and retry on the next tick.
    if (!titleEl) {
        console.log("No episode title found yet; waiting for page render.", {
            titleEl,
            timestampsLength: timestamps?.length,
            coverEl,
            videoEl,
        });
        return null;
    }

    // Extract time/duration if available; otherwise return empty strings.
    const currentTime = timestamps.length > 0 ? timestamps[0].textContent.trim() : "";
    const duration = timestamps.length > 1 ? timestamps[1].textContent.trim() : "";
    const isPaused = videoEl ? videoEl.paused : true;

    if (timestamps.length < 2) {
        // Player may be blocked for anonymous users; still provide partial payload.
        console.log("Player not available or blocked; returning partial watch data.", {
            currentTime,
            duration,
            isPaused,
            cover: getCoverUrl(coverEl),
        });
    }

    // Prefer an explicit episode number element; fall back to the title text when missing.
    const rawEpisodeValue = numberEl ? numberEl.textContent : titleEl.textContent;

    return {
        anime_title: animeTitleEl ? animeTitleEl.textContent.trim() : "",
        episode_title: SITE.parseEpisodeTitle(titleEl.textContent),
        episode: SITE.parseEpisodeNumber
            ? SITE.parseEpisodeNumber(rawEpisodeValue)
            : rawEpisodeValue
            ? rawEpisodeValue.trim()
            : "",
        current_time: currentTime,
        duration: duration,
        cover: getCoverUrl(coverEl),
        paused: isPaused,
    };
}

// Relay through background worker to avoid local network popup
function bgFetch(url, method, body = null) {
    return new Promise((resolve) => {       // { } means making an object
        chrome.runtime.sendMessage({
            type: "fetch",
            url,
            method,
            headers: { "Content-Type": "application/json" },
            body,
        }, resolve);
    });
}

async function sendData(data) {
    await bgFetch(`${LOCAL_URL}/watching`, "POST", data);
    console.log("Sent:", data);
}

function sendStop() {
    bgFetch(`${LOCAL_URL}/stopped`, "POST");
    console.log("Stopped");
}

// ========== Main Loop ==========
function startScraping() {
    console.log("Starting scraper for", currentHost, "readyState=", document.readyState, "href=", window.location.href);

    const tick = async () => {
        console.log("interval tick");
        let data = scrapeData();
        console.log("scrapeData result:", data);

        if (data) {
            await sendData(data);
            isWatching = true;
        } else if (isWatching) {
            sendStop();
            isWatching = false;
        }
    };

    tick();
    setInterval(tick, 15000);
}

function waitForPageReady(callback) {
    if (document.readyState === "complete" || document.readyState === "interactive") {
        callback();
    } else {
        window.addEventListener("DOMContentLoaded", () => callback());
    }
}

waitForPageReady(() => {
    if (!SITE) return;
    setTimeout(startScraping, 1000);
});