# Anime Activity Tracker for Discord

<p align="center">
  <img src="https://img.shields.io/github/license/xShive/Anime-Activity-Tracker?style=flat-square" alt="License">
  <img src="https://img.shields.io/github/v/release/xShive/Anime-Activity-Tracker?style=flat-square" alt="Version">
  <img src="https://img.shields.io/github/downloads/xShive/Anime-Activity-Tracker/total?style=flat-square" alt="Downloads">
</p>

Automatically streams whatever anime you're watching directly onto your Discord profile as a Rick Presence Card (RPC), complete with a time-remaining tracker, paused states, anime-title detecion and episode-title detection.


## Requirements

Before installing, make sure you have the following installed on your machine:
* **Python 3.8+** 
* **Discord Desktop App** (The tracker will not sync if you only use Discord in a web browser)
* A Chromium-based web browser (**Google Chrome**, **Microsoft Edge**, **Brave**, **Opera**, etc.)


## Installation & Setup

### Part 1: Install the Tracker
1. Download the latest ```AnimeTracker_Setup.exe``` from the [Releases Page](https://github.com/xShive/Anime-Activity-Tracker/releases).
2. Run the installer and follow the on-screen instructions.
3. Once the installation finishes, an **installation folder** will automatically open on your screen. Keep this window open.
  
### Part 2: Loading the Browser Extension
1. Open your browser's extension manager:
   - Chrome/Brave/Edge: Type ```chrome://extensions``` in your address bar.
   - Opera GX: Type ```opera://extensions``` in your address bar.
2. In the top-right corner, **Developer Mode to ON.**
3. Click the **'Load Unpacked'** button that appears on the top-left.
4. Select the extension folder that opened automatically.

The extension is now active! Simply watch an anime on a supported site, and your Discord status will update automatically.

## How It Works

Every 15 seconds, the extension checks your video tab to see if a show is playing. If so, its data gets scraped, and sent to the Flask server.
If you suddenly navigate away to the homepage or close your browser entirely, the server counts to 25 seconds and safeuly removes your presence off your profile automatically.


## Adding Support for New Websites
Want to track shows, anime or movies on a website that isn't supported yet? You can easily add it by updating two files:
**Note: instructions on how to do this are in ```content.js``` too!**
1. Update ```manifest.json```:
   Add the new website domain to the ```host_permissions``` and ```content_scripts``` arrays so the extension has persmission to "see" series data on that new site.
2. Update ```content.js```:
   Add a new entry to the ```SITE_CONFIGS``` object. You will need to **user your browser's Inspect Element tool** to find the correct CSS selectors for that site:
   - ```animeTitle```: The CSS selector for the show's name.
   - ```episodeTitle```: The CSS selector for the episode's name.
   - ```episodeNum```: The CSS selector for the episode's number..
   -  ```timestamps```: The CSS selector for the video time (e.g., ```.current-time``` and ```.total-duration```)
   - ```cover```: The CSS selector for poster image.
   - ```video```: The CSS selector for the pause-function

**Tips for finding selectors:**
- ```ctrl + shift + c``` allows you to click any element on the website, and it'll give you the corresponding code.
- Test your selectors using  ```document.querySelector('your-selector-here')``` to ensure they return the correct elements.
