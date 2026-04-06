from flask import Blueprint, jsonify, request
import os
from urllib.parse import quote

from dotenv import load_dotenv
import requests

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
ENV_PATH = os.path.join(BASE_DIR, ".env")

load_dotenv(ENV_PATH)

api = Blueprint("api", __name__)

ORS_API_KEY = os.getenv("ORS_API_KEY")
UNSPLASH_API_KEY = (os.getenv("UNSPLASH_API_KEY") or os.getenv("UNSPLASH_ACCESS_KEY") or "").strip()
ORS_PROFILES = {
    "car": "driving-car",
    "bike": "cycling-regular",
    "walk": "foot-walking",
}
WIKIPEDIA_HEADERS = {
    "User-Agent": "smartmap/1.0 (place details lookup)",
    "Accept": "application/json",
}


@api.route("/route", methods=["POST"])
def get_route():
    data = request.get_json(silent=True) or {}
    coordinates = data.get("coordinates")
    mode = (data.get("mode") or "car").strip().lower()

    if not ORS_API_KEY:
        return jsonify({"error": "API key not loaded"}), 500

    if not coordinates:
        return jsonify({"error": "Coordinates are required"}), 400

    profile = ORS_PROFILES.get(mode)

    if not profile:
        return jsonify({"error": "Unsupported travel mode"}), 400

    try:
        response = requests.post(
            f"https://api.openrouteservice.org/v2/directions/{profile}",
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

        # 🔥 1. Wikipedia API
        description = f"{clean_query} is a place."
        wiki_image = None
        wiki_link = None
        wiki_title = clean_query
        wiki_url = (
            "https://en.wikipedia.org/api/rest_v1/page/summary/"
            f"{quote(wiki_title, safe='')}"
        )
        wiki_res = requests.get(wiki_url, headers=WIKIPEDIA_HEADERS, timeout=10)

        if wiki_res.status_code != 200:
            search_res = requests.get(
                "https://en.wikipedia.org/w/api.php",
                params={
                    "action": "query",
                    "list": "search",
                    "srsearch": clean_query,
                    "format": "json",
                    "utf8": 1,
                },
                headers=WIKIPEDIA_HEADERS,
                timeout=10,
            )
            search_res.raise_for_status()
            search_results = search_res.json().get("query", {}).get("search", [])

            if search_results:
                wiki_title = search_results[0].get("title", clean_query)
                wiki_url = (
                    "https://en.wikipedia.org/api/rest_v1/page/summary/"
                    f"{quote(wiki_title, safe='')}"
                )
                wiki_res = requests.get(
                    wiki_url, headers=WIKIPEDIA_HEADERS, timeout=10
                )

        if wiki_res.status_code == 200:
            wiki_data = wiki_res.json()
            description = wiki_data.get("extract", description)
            wiki_image = wiki_data.get("thumbnail", {}).get("source")
            wiki_link = (
                wiki_data.get("content_urls", {})
                .get("desktop", {})
                .get("page")
            )

        # 🔥 2. Unsplash Images
        unsplash_res = requests.get(
            "https://api.unsplash.com/search/photos",
            params={
                "query": f"{clean_query} city",
                "per_page": 6,
                "orientation": "landscape",
                "client_id": UNSPLASH_API_KEY,
            },
            timeout=20,
        )

        unsplash_res.raise_for_status()
        unsplash_data = unsplash_res.json()

        images = [
            img["urls"]["regular"]
            for img in unsplash_data.get("results", [])
        ]

        # 🔥 Add Wikipedia image at first (if exists)
        if wiki_image:
            images.insert(0, wiki_image)

        return jsonify({
            "name": clean_query,
            "description": description,
            "images": images,
            "wiki_link": wiki_link
        })

    except requests.RequestException as error:
        print("API Error:", error)
        return jsonify({"error": "Unable to fetch place details"}), 502
