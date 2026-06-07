// ========== Setup ==========
// check if current website is in config
const currentHost = window.location.hostname.replace("www.", "");
const SITE = SITE_CONFIGS[currentHost];

// ========== State ==========
let isWatching = false;
let kwikVideoData = null;
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "video_data") {
        kwikVideoData = message;
    }
});

// ========== URL Helpers ==========
// check if current URL is still on the /watch
function pathMatches(pathIncludes) {
    if (!pathIncludes) return false;
    if (Array.isArray(pathIncludes)) {      // crunchy has two paths (array)
        return pathIncludes.some((p) => window.location.href.includes(p));
    }
    return window.location.href.includes(pathIncludes);
}


// ========== Cover Image Helpers ==========

// Fallback: reads the cover image from the page's hidden meta tags.
// Sites add these tags for social media previews (e.g. the image Discord shows when you share a link).
// We use this when no visible cover element is found on the page.
function getMetaCover() {
    const meta =
        document.querySelector("meta[property='og:image']") ||
        document.querySelector("meta[name='og:image']") ||
        document.querySelector("meta[name='twitter:image']");
    return meta ? meta.content || meta.getAttribute("content") || "" : "";
}

// Extracts a usable image URL from a cover element.
// The cover element can be different types depending on the site:
//   - An <img> tag         → just read its src
//   - A <div> with CSS     → extract the URL from its background-image style
//   - Something nested     → look for an <img> inside it
// Falls back to getMetaCover() if nothing works.
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

// ========== Scraper ==========
function scrapeData() {
    // not a supported site, or not on a watch page
    if (!SITE) return null;
    if (!pathMatches(SITE.watchPathIncludes)) return null;

    const s = SITE.selectors;

    // find the elements on the page using the selectors defined in config.js
    const animeTitleEl = document.querySelector(s.animeTitle);
    const titleEl = document.querySelector(s.episodeTitle);
    const numberEl = document.querySelector(s.episodeNum);
    const coverEl = document.querySelector(s.cover);
    const videoEl = document.querySelector(s.video);

    // read timestamps from video element
    const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
    let currentTime, duration, isPaused;
    if (videoEl) {
        currentTime = videoEl.currentTime != null ? fmt(videoEl.currentTime) : "";
        duration = videoEl.duration ? fmt(videoEl.duration) : "";
        isPaused = videoEl.paused;
    } else if (kwikVideoData) {
        currentTime = kwikVideoData.currentTime;
        duration = kwikVideoData.duration;
        isPaused = kwikVideoData.paused;
    } else {
        currentTime = "";
        duration = "";
        isPaused = true;
    }
    // if number element exists, use it. else, full title and extract number from it in the return parseEpisodeNumber
    const rawEpisodeValue = numberEl ? numberEl.textContent : titleEl.textContent;
    
    return {
        anime_title: animeTitleEl ? animeTitleEl.textContent.trim() : "",
        episode_title: (titleEl && SITE.parseEpisodeTitle) ? SITE.parseEpisodeTitle(titleEl.textContent) : "",
        episode: SITE.parseEpisodeNumber ? SITE.parseEpisodeNumber(rawEpisodeValue) : rawEpisodeValue ? rawEpisodeValue.trim() : "",     // in 'else' another if-else: number element not working
        current_time: currentTime,
        duration: duration,
        cover: SITE.parseCoverUrl ? SITE.parseCoverUrl(getCoverUrl(coverEl)) : getCoverUrl(coverEl),
        paused: isPaused,
    };
}

// ========== Communication with Python ==========
// sends a request through background.js (instead of directly from here)
// direct requests to localhost would trigger a browser security popup, so we route through the background worker
function bgFetch(url, method, body = null) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({
            type: "fetch",
            url,
            method,
            headers: { "Content-Type": "application/json" },
            body,
        }, resolve);
    });
}

// sends the current watch data to the Python app
async function sendData(data) {
    await bgFetch(`${LOCAL_URL}/watching`, "POST", data);
}

// tells the Python app to clear the Discord presence
function sendStop() {
    bgFetch(`${LOCAL_URL}/stopped`, "POST");
}

// ========== Main Loop ==========
// scrapes the page every 15 seconds and sends the data to Python
// if data disappears (e.g. navigated away), sends a stop signal
function startScraping() {
    const tick = async () => {
        let data = scrapeData();

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

// wait for the page to finish loading before starting the scraper
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