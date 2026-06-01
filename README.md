# Anime Activity Tracker for Discord

Automatically streams whatever anime you're watching directly onto your Discord profile as a Rick Presence Card (RPC), complete with a time-remaining tracker, paused states, anime-title detecion and episode-title detection.


## Requirements

Before installing, make sure you have the following installed on your machine:
* **Python 3.8+** 
* **Discord Desktop App** (The tracker will not sync if you only use Discord in a web browser)
* A Chromium-based web browser (**Google Chrome**, **Microsoft Edge**, **Brave**, **Opera**, etc.)


## Installation & Setup

### Part 1: Running the Python Server
### Part 2: Loading the Browser Extension


## How It Works

Every 15 seconds, the extension checks your video tab to see if a show is playing. If so, its data gets scraped, and sent to the Flask server.
If you suddenly navigate away to the homepage or close your browser entirely, the server counts to 25 seconds and safeuly removes your presence off your profile automatically.
