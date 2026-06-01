// ========== Find website ==========
const currentHost = window.location.hostname.replace("www.", "")
const SITE = SITE_CONFIGS[currentHost]
if (!SITE) {
    console.log("No config found for", currentHost)
}

// ========== State ==========
let isWatching = false;

// ========== Functions ==========
function scrapeData() {
    if (!SITE) return null;
    if (!window.location.href.includes(SITE.watchPathIncludes)) return null;

    const s = SITE.selectors;
    
    const animeTitleEl = document.querySelector(s.animeTitle);
    const titleEl = document.querySelector(s.episodeTitle);
    const numberEl = document.querySelector(s.episodeNum);
    const timestamps = document.getElementsByClassName(s.timestamps.replace(".", ""));
    const coverEl = document.querySelector(s.cover);
    const videoEl = document.querySelector(s.video);

    if (!titleEl || !timestamps || timestamps.length < 2 || !coverEl || !videoEl) {
        return null;
    }

    return {
        anime_title: animeTitleEl ? animeTitleEl.textContent.trim() : "",
        episode_title: SITE.parseEpisodeTitle(titleEl.textContent),
        episode: numberEl ? numberEl.textContent.trim() : "",
        current_time: timestamps[0].textContent,
        duration: timestamps[1].textContent,
        cover: coverEl.src || "",
        paused: videoEl.paused,
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
setInterval(function() {
    let data = scrapeData();
    
    if (data) {
        sendData(data);
        isWatching = true;
    } else if (isWatching) {
        sendStop();
        isWatching = false;
    }
}, 15000);