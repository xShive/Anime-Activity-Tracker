# ========== Imports ==========
from pypresence.presence import Presence
from pypresence.types import ActivityType
from flask import Flask, request, jsonify
from flask_cors import CORS
from tray import create_tray
from mal import get_mal_url
from updater import check_for_updates, CURRENT_VERSION

import time
import threading

# ========== Global Variables ==========
APP_ID="1510673753871352070"

last_ping_time = time.time()
is_presence_active = False
is_paused_active = False
rpc_connected = False
current_end_timestamp = None
last_episode = None

current_title_and_number = None

# ========== Heartbeat Timeout Logic =========
def timeout_monitor():
    """
    Every 15 seconds content.js sends a /watching ping. last_ping_time records the time of the last ping.
    The timeout_monitor thread wakes up every 5 seconds to check if it has been more than 25 seconds.
    """
    global last_ping_time, is_presence_active, is_paused_active, rpc_connected
    while True:
        time.sleep(5)
        
        # if active, but no signal from the browser in 25 seconds
        if is_presence_active and (time.time() - last_ping_time > 25):
            print("Browser tab closed! Clearing Discord presence.")
            try:
                if rpc_connected:   # check if youre not disconnected
                    rpc.clear()

            except Exception as e:
                rpc_connected = False
                print(f"ERROR: {e}")

            is_presence_active = False

# ========== Helper ==========
def time_to_seconds(t: str) -> int:
    parts = t.split(':')
    return int(parts[0]) * 60 + int(parts[1]) if (len(parts) == 2) else int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])

# ========== Flask app - API endpoints ==========
app = Flask(__name__)
CORS(app) 

@app.route('/watching', methods=['POST'])
def watching():
    global last_ping_time, is_presence_active, is_paused_active, rpc_connected, rpc, current_title_and_number
    global current_end_timestamp, last_episode

    last_ping_time = time.time() # reset timer
    is_presence_active = True

    if not rpc_connected:
        try:
            rpc = Presence(APP_ID)
            rpc.connect()
            rpc_connected = True
            current_end_timestamp = None
            print("Successfully reconnected.")
            
        except Exception as e:
            print(f"Reconnect failed: {e}")

    data = request.get_json()

    anime_title = data.get('anime_title', '')
    episode_title = data.get('episode_title', '')
    episode = data.get('episode', '').replace('.', '').strip()
    episode_line = f"EP {episode}" if episode else ""
    cover = data.get('cover', '') or None
    current_time = data.get('current_time', '0:00')
    duration = data.get('duration', '0:00')
    paused = data.get('paused', False)

    anime_title_and_number = f"{anime_title} ∙ {episode_line}"
    
    episode_changed = (episode_line != last_episode)
    last_episode = episode_line

    try:
        # if video player is blocked (crunchyroll not subscribed)
        if not current_time or not duration:
            seconds_remaining = 0
        else:
            seconds_remaining = time_to_seconds(duration) - time_to_seconds(current_time)

        mal_url = get_mal_url(anime_title)

        # Is the video finished?
        if seconds_remaining <= 0 and duration not in ("", "0:00"):
            if current_end_timestamp is not None:
                current_end_timestamp = None
                rpc.clear()     # erase countdown, only first time when 0 remaining

            rpc.update(
                details=anime_title_and_number,
                state="✓ Finished!",
                large_image=cover,
                buttons=[{"label": "View on MAL", "url": mal_url}]
            )

        # Is it paused?
        elif paused:
            if not is_paused_active:
                is_paused_active = True
                current_end_timestamp = None
                rpc.clear()

            rpc.update(
                details=anime_title_and_number,
                state="⏸ Paused",
                large_image=cover,
                buttons=[{"label": "View on MAL", "url": mal_url}]
            )

        # 3. It is playing normally
        else:
            is_paused_active = False
            new_end_timestamp = int(time.time()) + seconds_remaining
            start_timestamp = int(time.time()) - time_to_seconds(current_time)

            
            if current_end_timestamp is None or episode_changed or abs(current_end_timestamp - new_end_timestamp) > 3:
                current_end_timestamp = new_end_timestamp
            
            current_title_and_number = anime_title_and_number

            rpc.update(
                activity_type=ActivityType.WATCHING,
                details=anime_title_and_number,
                state=episode_title if episode_title else None,
                large_image=cover,
                start=start_timestamp,
                end=current_end_timestamp,
                buttons=[{"label": "View on MAL", "url": mal_url}]
            )

    except Exception as e:
        rpc_connected = False
        print(f"Discord's RPC socket failed: {e}.\nA reconnect attempt will trigger shortly.")

    return jsonify({ "status": "ok" })

@app.route('/stopped', methods=['POST'])
def stopped():
    global is_presence_active, current_end_timestamp, last_episode, current_title_and_number
    try:
        rpc.clear()
    except:
        pass
    is_presence_active = False
    current_end_timestamp = None
    last_episode = None
    current_title_and_number = None
    print("Presence cleared")
    return jsonify({ "status": "ok" })

@app.route('/update', methods=['GET'])
def update():
    latest_version, download_url = check_for_updates()
    return jsonify({"latest_version": latest_version or None, "download_url": download_url or None})

@app.route('/status', methods=['GET'])
def status():
    return jsonify({"title_number": current_title_and_number or None, "is_watching": is_presence_active, "is_paused": is_paused_active})

# ========== Main ==========
if __name__ == '__main__':
    # Connect RPC
    try:
        rpc = Presence(APP_ID)
        rpc.connect()
        rpc_connected = True
        print("Successfully connected to Discord's RPC")
        
    except Exception as e:
        print(f"Initial Discord connection failed: {e}. Will retry on next browser update.")
        rpc_connected = False

    # thread 1: flask server listens for HTTP requests on port 5001 (daemon)
    threading.Thread(target=lambda: app.run(host='127.0.0.1', port=5001), daemon=True).start() 
    print("RPC client running on port 5001...")

    # thread 2: check heartbeat every 5 seconds (daemon)
    threading.Thread(target=timeout_monitor, daemon=True).start()
    
    # main thread: blocks running tray icon
    create_tray()