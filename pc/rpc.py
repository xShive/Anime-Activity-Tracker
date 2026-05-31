# ========== Imports ==========
from dotenv import load_dotenv
from pypresence.presence import Presence
from flask import Flask, request, jsonify

import os
import time
import threading

# ========== Environment Variable Setup ==========
load_dotenv()
APP_ID = os.getenv("APP_ID")

# ========== Connect RPC ==========
rpc = Presence(APP_ID)
rpc.connect()
print("Successfully connected to Discord's RPC")

# ========== Helper ==========
def time_to_seconds(t):
    parts = t.split(':')
    return int(parts[0]) * 60 + int(parts[1])

# ========== Flask app ==========
app = Flask(__name__)       # create app, __name__ is current file's name
watch_start = None

@app.route('/update', methods=['POST'])
def update():
    data = request.get_json()

    title = data.get('title', '')
    episode = data.get('episode', '').replace('.', '').strip()
    episode_line = f"EP {episode}" if episode else ""
    cover = data.get('cover', '') or None
    current_time = data.get('current_time', '0:00')
    duration = data.get('duration', '0:00')
    paused = data.get('paused', False)

    if paused:
        rpc.update(
            details=title,
            state=f"⏸ Paused",
            large_image=cover,
            large_text=title,
        )
    else:
        current_seconds = time_to_seconds(current_time)
        duration_seconds = time_to_seconds(duration)
        seconds_remaining = duration_seconds - current_seconds
        # discord expects a Unix timestamp, so we need to calculate the remaining duration, get the current point in time, and add those two
        # counts down automatically
        end_timestamp = int(time.time()) + seconds_remaining

        rpc.update(
            details=title,
            state=episode,
            large_image=cover,
            large_text=title,
            end=end_timestamp
        )

    print(f"Updated: {title} - {episode} - paused={paused}")
    return jsonify({ "status": "ok" })

@app.route('/clear', methods=['POST'])
def clear():
    rpc.clear()
    print("Presence cleared")
    return jsonify({ "status": "ok" })


if __name__ == '__main__':
    flask_thread = threading.Thread(target=lambda: app.run(host='0.0.0.0', port=5001))  # creates a thread that will run flask server.
    flask_thread.daemon = True      # kill thread when main program exits (ctrl c)
    flask_thread.start()
    
    print("RPC client running on port 5001...")
    
    while True:
        time.sleep(15)      # keep thread alive