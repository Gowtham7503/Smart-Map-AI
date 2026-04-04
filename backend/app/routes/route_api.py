from flask import Blueprint, jsonify, request
import os

from dotenv import load_dotenv
import requests

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
ENV_PATH = os.path.join(BASE_DIR, ".env")

load_dotenv(ENV_PATH)

api = Blueprint("api", __name__)

ORS_API_KEY = os.getenv("ORS_API_KEY")
UNSPLASH_API_KEY = (os.getenv("UNSPLASH_API_KEY") or os.getenv("UNSPLASH_ACCESS_KEY") or "").strip()


@api.route("/route", methods=["POST"])
def get_route():
    data = request.get_json(silent=True) or {}
    coordinates = data.get("coordinates")

    if not ORS_API_KEY:
        return jsonify({"error": "API key not loaded"}), 500

    if not coordinates:
        return jsonify({"error": "Coordinates are required"}), 400

    try:
        response = requests.post(
            "https://api.openrouteservice.org/v2/directions/driving-car",
            json={"coordinates": coordinates},
            headers={
                "Authorization": ORS_API_KEY,
                "Content-Type": "application/json",
            },
            timeout=20,
        )
        response.raise_for_status()
        return jsonify(response.json())
    except requests.RequestException as error:
        details = None

        if error.response is not None:
            try:
                details = error.response.json()
            except ValueError:
                details = error.response.text

        return (
            jsonify({"error": "Unable to fetch route", "details": details or str(error)}),
            502,
        )


@api.route("/images", methods=["GET"])
def get_place_images():
    query = request.args.get("q")

    if not query:
        return jsonify({"error": "Query is required"}), 400

    if not UNSPLASH_API_KEY:
        return jsonify({"error": "UNSPLASH_API_KEY is not configured"}), 500

    try:
        response = requests.get(
            "https://api.unsplash.com/search/photos",
            params={
                "query": query,
                "per_page": 8,
                "orientation": "landscape",
                "client_id": UNSPLASH_API_KEY,
            },
            timeout=20,
        )
        response.raise_for_status()
        data = response.json()

        images = [
            {
                "url": image["urls"]["regular"],
                "thumb": image["urls"]["small"],
                "author": image["user"]["name"],
            }
            for image in data.get("results", [])
        ]

        return jsonify(
            {
                "place": query,
                "count": len(images),
                "images": images,
            }
        )
    except requests.RequestException as error:
        details = None

        if error.response is not None:
            try:
                details = error.response.json()
            except ValueError:
                details = error.response.text

        return (
            jsonify({"error": "Unable to fetch images", "details": details or str(error)}),
            502,
        )


@api.route("/place-details", methods=["GET"])
def get_place_details():
    query = request.args.get("q")

    if not query:
        return jsonify({"error": "Query required"}), 400

    if not UNSPLASH_API_KEY:
        return jsonify({"error": "UNSPLASH_API_KEY is not configured"}), 500

    try:
        clean_query = query.split(",")[0].strip()
        smart_query = f"{clean_query} city"

        print("Unsplash Query:", smart_query)

        response = requests.get(
            "https://api.unsplash.com/search/photos",
            params={
                "query": smart_query,
                "per_page": 6,
                "orientation": "landscape",
                "client_id": UNSPLASH_API_KEY,
            },
            timeout=20,
        )
        response.raise_for_status()
        data = response.json()

        images = [
            image["urls"]["regular"]
            for image in data.get("results", [])
        ]

        return jsonify(
            {
                "name": clean_query,
                "description": f"{clean_query} is a popular place.",
                "images": images,
            }
        )
    except requests.RequestException as error:
        if error.response is not None:
            print("Status:", error.response.status_code)
            print("Response:", error.response.text)

        print("Unsplash API Error:", error)

        return jsonify({"error": "Unable to fetch place details"}), 502
