const LOCAL_URL = "http://127.0.0.1:5001";

// ========== Site Configs ==========
// To add a new site:
// 1. Add its domain to manifest.json under host_permissions and content_scripts matches
// 2. Add a new entry here with the right selectors
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
};
