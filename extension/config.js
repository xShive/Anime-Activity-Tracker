const LOCAL_URL = "http://127.0.0.1:5001";


// ========== Site Configs ==========
// Each entry should have:
// - watchPathIncludes: string or array of URL fragments that indicate a watch page
// - selectors: a set of selectors (or arrays of fallback selectors) for scraping
// - parseEpisodeTitle: function to normalise an episode title string
// - parseEpisodeNumber: (optional) function to extract an episode number when available
const SITE_CONFIGS = {
    "miruro.tv": {
        watchPathIncludes: "/watch",    // to check if youre still watching
        selectors: {
            animeTitle:   ".anime-title",
            episodeTitle: ".ep-title",
            episodeNum:   ".ep-number",
            timestamps:   ".vds-time",       // expects [0]=current, [1]=duration
            cover:        "img[style*='view-transition-name: poster']",
            video:        "video",
        },
        parseEpisodeTitle: (raw) => {
            return raw.includes("· ") ? raw.split("· ")[1].trim() : raw.trim();
        }
    },
    "miruro.bz": {
        watchPathIncludes: "/watch",
        selectors: {
            animeTitle:   ".anime-title",
            episodeTitle: ".ep-title",
            episodeNum:   ".ep-number",
            timestamps:   ".vds-time",
            cover:        "img[style*='view-transition-name: poster']",
            video:        "video",
        },
        parseEpisodeTitle: (raw) => {
            return raw.includes("· ") ? raw.split("· ")[1].trim() : raw.trim();
        }
    },
    "miruro.to": {
        watchPathIncludes: "/watch",
        selectors: {
            animeTitle:   ".anime-title",
            episodeTitle: ".ep-title",
            episodeNum:   ".ep-number",
            timestamps:   ".vds-time",
            cover:        "img[style*='view-transition-name: poster']",
            video:        "video",
        },
        parseEpisodeTitle: (raw) => {
            return raw.includes("· ") ? raw.split("· ")[1].trim() : raw.trim();
        }
    },

    "crunchyroll.com": {
        watchPathIncludes: ["/watch", "/episode-"],
        selectors: {
            animeTitle: ["[data-t='show-title-link'] h4", "[data-testid='series-title']", "a[data-testid='show-title-link'] h4"],
            episodeTitle: ["h1.title", "[data-testid='episode-title']", "h1[data-testid='episode-title']"],
            episodeNum: ["h1.title", "[data-testid='episode-number']", "span[data-testid='episode-number']"],
            timestamps: ["[data-testid='timestamp'] span", ".player-timestamps span", ".time-display span"],
            cover: [".bitmovinplayer-poster", "[data-testid='player-poster']", ".player-poster img", ".progressive-image-base__fade--Nrn20"],
            video: ["video", ".vjs-tech"],
        },
        parseEpisodeTitle: (raw) => {
            return raw.includes(" - ") ? raw.split(" - ")[1].trim() : raw.trim();
        },
        parseEpisodeNumber: (raw) => {
            if (!raw) return "";
            const normalized = raw.trim();
            const match = normalized.match(/^(?:E|Ep(?:isode)?)[\s:]*([0-9]+)/i)
                || normalized.match(/^(?:Episode|Ep)[\s:]*([0-9]+)/i)
                || normalized.match(/^([0-9]+)/);
            return match ? match[1].trim() : "";
        },
    },
};
