from flask import Blueprint, request, jsonify
import requests
import os
from dotenv import load_dotenv

# 🔥 FORCE LOAD ENV FROM BACKEND ROOT
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
env_path = os.path.join(BASE_DIR, ".env")

print("📁 ENV PATH:", env_path)

load_dotenv(env_path)

# 🔐 LOAD API KEY
ORS_API_KEY = os.getenv("ORS_API_KEY")

print("🔥 LOADED API KEY:", ORS_API_KEY[:5] if ORS_API_KEY else None)

route_bp = Blueprint("route", __name__)

@route_bp.route("/route", methods=["POST"])
def get_route():
    data = request.json

    # 🚨 Safety check
    if not ORS_API_KEY:
        return jsonify({"error": "API key not loaded"}), 500

    try:
        response = requests.post(
            "https://api.openrouteservice.org/v2/directions/driving-car",
            json={
                "coordinates": data["coordinates"]
            },
            headers={
                "Authorization": ORS_API_KEY,
                "Content-Type": "application/json"
            }
        )

        result = response.json()

        print("🌐 ORS RESPONSE:", result)

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500