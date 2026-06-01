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

async function sendData(data) {
    try {
        await fetch(`${LOCAL_URL}/watching`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
    } catch (error) {}
}

function sendStop() {
    fetch(`${LOCAL_URL}/stopped`, { method: "POST" });
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