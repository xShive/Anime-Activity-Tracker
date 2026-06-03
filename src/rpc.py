# ========== Imports ==========
from pypresence.presence import Presence
from flask import Flask, request, jsonify
from flask_cors import CORS
from tray import create_tray

import time
import threading

# ========== APP ID ==========
APP_ID="1510673753871352070"

# ========== Connect RPC ==========
rpc = Presence(APP_ID)
rpc.connect()
print("Successfully connected to Discord's RPC")

# ========== Heartbeat Timeout Logic ==========
last_ping_time = time.time()
is_presence_active = False
is_paused_active = False

def timeout_monitor():
    global last_ping_time, is_presence_active, is_paused_active
    while True:
        time.sleep(5)
        
        # if active, but no signal from the browser in 25 seconds
        if is_presence_active and (time.time() - last_ping_time > 25):
            print("Browser tab closed! Clearing Discord presence.")
            try:
                rpc.clear()
            except:
                pass
            is_presence_active = False

# Start the timer in the background
threading.Thread(target=timeout_monitor, daemon=True).start()

# ========== Helper ==========
def time_to_seconds(t: str) -> int:
    parts = t.split(':')
    return int(parts[0]) * 60 + int(parts[1]) if (len(parts) == 2) else int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])

# ========== Flask app ==========
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

            rpc.update(
                details=anime_title_and_number,
                state="⏸ Paused",
                large_image=cover,
            )
        else:
            is_paused_active = False

            seconds_remaining = time_to_seconds(duration) - time_to_seconds(current_time)
            end_timestamp = int(time.time()) + seconds_remaining

            rpc.update(
                details=anime_title_and_number,
                state=episode_title,
                large_image=cover,
                end=end_timestamp
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

if __name__ == '__main__':
    flask_thread = threading.Thread(target=lambda: app.run(host='127.0.0.1', port=5001)) 
    flask_thread.daemon = True      
    flask_thread.start()
    
    print("RPC client running on port 5001...")
    
    create_tray()