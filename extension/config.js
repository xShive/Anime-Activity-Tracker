const LOCAL_URL = "http://127.0.0.1:5001";

// ========== Miruro Configs ==========
const MIRURO_CONFIG = {
    watchPathIncludes: "/watch",
    selectors: {
        animeTitle:   ".anime-title",
        episodeTitle: ".ep-title",
        episodeNum:   ".ep-number",
        cover:        "img[style*='view-transition-name: poster']",
        video:        "video",
    },
    parseEpisodeTitle: (raw) => {
        return raw.includes("· ") ? raw.split("· ")[1].trim() : raw.trim();
    }
};


// ========== Site Configs ==========
// Each entry should have:
// - watchPathIncludes: string or array of URL fragments that indicate a watch page
// - selectors: a set of selectors (or arrays of fallback selectors) for scraping
// - parseEpisodeTitle: function to normalise an episode title string
// - parseEpisodeNumber: (optional) function to extract an episode number when available
const SITE_CONFIGS = {
    "miruro.tv":  MIRURO_CONFIG,
    "miruro.bz":  MIRURO_CONFIG,
    "miruro.to":  MIRURO_CONFIG,
    "miruro.ru":  MIRURO_CONFIG,
    "crunchyroll.com": {
        watchPathIncludes: ["/watch", "/episode-"],
        selectors: {
            animeTitle:   "[data-t='show-title-link'] h4",
            episodeTitle: "h1.title",
            episodeNum:   "h1.title",
            cover:        ".bitmovinplayer-poster",
            video:        "video",
        },
        parseEpisodeTitle: (raw) => {
            return raw.includes(" - ") ? raw.split(" - ")[1].trim() : raw.trim();
        },
        parseEpisodeNumber: (raw) => {
            if (!raw) return "";
            const match = raw.trim().match(/^(?:E|Ep(?:isode)?)[\s:]*([0-9]+)/i) || raw.trim().match(/^([0-9]+)/);
            return match ? match[1].trim() : "";
        },
    },
};
