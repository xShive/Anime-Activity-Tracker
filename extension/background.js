// ========== Icon greying ==========
// The extension enables/disables the action icon depending on which host a tab is on.
const SUPPORTED_HOSTS = [
    "miruro.tv",
    "miruro.bz",
    "crunchyroll.com",
    "miruro.to",
    "miruro.ru",
    "animepahe.pw"
];

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // if site isnt finished loading, return
    if (changeInfo.status !== "complete" || !tab.url) return;

    let isSupported = false;
    try {
        // replace url
        const host = new URL(tab.url).hostname.replace("www.", "");
        // check if raw hostname is supported
        isSupported = SUPPORTED_HOSTS.some(h => host === h);
    } catch (_) {}

    // if it is supported, shine icon. else, grey.
    isSupported ? chrome.action.enable(tabId) : chrome.action.disable(tabId);
});

// ========== Background fetches (to avoid local network popup) ==========
// listen to messages coming from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {      // message is the object from content.js, other two are auto added
    // check if it is a fetch request (content.js)
    if (message.type === "fetch") {
        // hit API
        fetch(message.url, {
            method: message.method,
            headers: message.headers,
            body: message.body ? JSON.stringify(message.body) : undefined,
        })
        .then(r => r.json())
        .then(data => sendResponse({ ok: true, data }))
        .catch(err => sendResponse({ ok: false, error: err.message }));

        return true;
    }

    // check if we have received kwik video data. forward it to content.js
    if (message.type === "video_data") {
    chrome.tabs.sendMessage(sender.tab.id, message);
    return;
}
});