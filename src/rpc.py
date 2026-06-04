# ========== Imports ==========
from pypresence.presence import Presence
from flask import Flask, request, jsonify
from flask_cors import CORS
from tray import create_tray
from mal import get_mal_url

import time
import threading

# ========== Global Variables ==========
APP_ID="1510673753871352070"

last_ping_time = time.time()
is_presence_active = False
is_paused_active = False

# ========== Heartbeat Timeout Logic =========
def timeout_monitor():
    """
    Every 15 seconds content.js sends a /watching ping. last_ping_time records the time of the last ping.
    The timeout_monitor thread wakes up every 5 seconds to check if it has been more than 25 seconds.
    """
    global last_ping_time, is_presence_active, is_paused_active
    while True:
        time.sleep(5)
        
        # if active, but no signal from the browser in 25 seconds
        if is_presence_active and (time.time() - last_ping_time > 25):
            print("Browser tab closed! Clearing Discord presence.")
            try:
                rpc.clear()
            except Exception as e:
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
    global last_ping_time, is_presence_active, is_paused_active
    last_ping_time = time.time() # reset timer
    is_presence_active = True

    data = request.get_json()

    anime_title = data.get('anime_title', '')
    episode_title = data.get('episode_title', '')
    episode = data.get('episode', '').replace('.', '').strip()
    episode_line = f"EP {episode}" if episode else ""
    cover = data.get('cover', '') or None
    current_time = data.get('current_time', '0:00')
    duration = data.get('duration', '0:00')
    paused = data.get('paused', False)

    anime_title_and_number = f"{anime_title} - {episode_line}"

    try:
        if paused:
            if not is_paused_active:
                is_paused_active = True
                rpc.clear()

            mal_url = get_mal_url(anime_title)
            rpc.update(
                details=anime_title_and_number,
                state="⏸ Paused",
                large_image=cover,
                buttons=[{"label": "View on MAL", "url": mal_url}]
            )
        else:
            is_paused_active = False

            seconds_remaining = time_to_seconds(duration) - time_to_seconds(current_time)
            end_timestamp = int(time.time()) + seconds_remaining

            mal_url = get_mal_url(anime_title)
            print(mal_url)
            rpc.update(
                details=anime_title_and_number,
                state=episode_title,
                large_image=cover,
                end=end_timestamp,
                buttons=[{"label": "View on MAL", "url": mal_url}]
            )
        print(f"Updated: {episode_title} - {episode_line} - paused={paused}")
    except:
        pass

    return jsonify({ "status": "ok" })

@app.route('/stopped', methods=['POST'])
def stopped():
    global is_presence_active
    try:
        rpc.clear()
    except:
        pass
    is_presence_active = False
    print("Presence cleared")
    return jsonify({ "status": "ok" })


# ========== Main ==========
if __name__ == '__main__':
    # Connect RPC
    rpc = Presence(APP_ID)
    rpc.connect()
    print("Successfully connected to Discord's RPC")

    # thread 1: flask server listens for HTTP requests on port 5001 (daemon) (daemon threads die when main thread exits)
    threading.Thread(target=lambda: app.run(host='127.0.0.1', port=5001), daemon=True).start() 
    print("RPC client running on port 5001...")

    # thread 2: check heartbeat every 5 seconds (daemon)
    threading.Thread(target=timeout_monitor, daemon=True).start()
    
    # main thread: blocks running tray icon
    create_tray()