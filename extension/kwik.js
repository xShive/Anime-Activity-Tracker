// convert seconds into time string (helper)
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

// searches for a <video> element
function sendVideoData() {
    const videoEl = document.querySelector("video");
    if (!videoEl) return;

    // send message to background.js (label is video_data)
    chrome.runtime.sendMessage({
        type: "video_data",
        currentTime: videoEl.currentTime != null ? fmt(videoEl.currentTime) : "",
        duration: videoEl.duration ? fmt(videoEl.duration) : "",
        paused: videoEl.paused,
    });
}

// repeatedly send data
function start() {
    sendVideoData();
    setInterval(sendVideoData, 15000);
}

start()