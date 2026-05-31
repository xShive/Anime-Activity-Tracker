# ========== Imports ==========
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS

import os
import requests

# ========== Environment Variable Setup ==========
load_dotenv()
PC_IP = os.getenv("PC_IP")
PC_URL = f"http://{PC_IP}:5001"

# ========== Flask app ==========
app = Flask(__name__)
CORS(app)

@app.route('/watching', methods=['POST'])
def watching():
    data = request.get_json()
    print(f"Received: {data}")
    requests.post(f"{PC_URL}/update", json=data)
    return jsonify({ "status": "ok" })

@app.route('/stopped', methods=['POST'])
def stopped():
    requests.post(f"{PC_URL}/clear")
    return jsonify({ "status": "ok" })

# ========== Start server ==========
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)