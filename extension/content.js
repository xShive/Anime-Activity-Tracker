function scrapeData() {
    let titleElement = document.querySelector(".ep-title");
    let numberElement = document.querySelector(".ep-number")
    let timestampElements = document.getElementsByClassName("vds-time"); 
    let imageElement = document.querySelector("img[style*='view-transition-name: poster']")
    let videoElement = document.querySelector("video");

    if (!titleElement || !timestampElements || !imageElement || !videoElement) {
        return null
    }

    let raw_title;

    if (titleElement.textContent.includes("· ")) {
        let parts = titleElement.textContent.split("· ");
        raw_title = parts[1].trim();
    } else {
        raw_title = titleElement.textContent.trim();
    }
    

    return {
        title: raw_title,
        episode: numberElement ? numberElement.textContent.trim() : "",
        current_time: timestampElements[0].textContent,
        duration: timestampElements[1].textContent,
        cover: imageElement ? imageElement.src : "",
        paused: videoElement.paused
    };
}

