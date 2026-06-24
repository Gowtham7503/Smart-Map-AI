from functools import lru_cache
from math import asin, cos, radians, sin, sqrt
import re

from flask import Blueprint, jsonify, request
import requests


chatbot_bp = Blueprint("chatbot", __name__)

OVERPASS_API_URLS = (
    "http://overpass-api.de/api/interpreter",
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
)
OVERPASS_TIMEOUT = (3, 30)
OVERPASS_HEADERS = {
    "Accept": "application/json",
    "User-Agent": "smartmap/1.0 (nearby place recommendations)",
}
DEFAULT_RADIUS_METERS = 2000
MAX_RECOMMENDATIONS = 6

CATEGORY_KEYWORDS = {
    "restaurant": (
        "restaurant",
        "restaurants",
        "food",
        "eat",
        "dinner",
        "lunch",
        "breakfast",
    ),
    "temple": ("temple", "temples", "mandir", "worship", "religious"),
    "cafe": ("cafe", "cafes", "coffee"),
    "museum": ("museum", "museums"),
    "park": ("park", "parks", "garden", "gardens"),
    "attraction": (
        "famous",
        "attraction",
        "attractions",
        "landmark",
        "landmarks",
        "places",
        "place",
        "visit",
        "sightseeing",
        "tourist",
    ),
}

CATEGORY_LABELS = {
    "restaurant": "restaurants",
    "temple": "temples",
    "cafe": "cafes",
    "museum": "museums",
    "park": "parks",
    "attraction": "famous places",
}


def parse_number(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def detect_category(message):
    normalized_message = re.sub(r"[^a-z0-9\s]", " ", message.lower())
    words = set(normalized_message.split())

    for category, keywords in CATEGORY_KEYWORDS.items():
        if words.intersection(keywords):
            return category

    if words.intersection({"nearby", "recommend", "recommendation", "recommendations"}):
        return "attraction"

    return None


def get_category_query(category, latitude, longitude, radius):
    location = f"(around:{radius},{latitude},{longitude})"
    selectors = {
        "restaurant": [f'nwr{location}["amenity"="restaurant"]["name"];'],
        "temple": [
            f'nwr{location}["amenity"="place_of_worship"]["religion"="hindu"]["name"];',
            f'nwr{location}["building"="temple"]["name"];',
        ],
        "cafe": [f'nwr{location}["amenity"="cafe"]["name"];'],
        "museum": [f'nwr{location}["tourism"="museum"]["name"];'],
        "park": [
            f'nwr{location}["leisure"="park"]["name"];',
            f'nwr{location}["leisure"="garden"]["name"];',
        ],
        "attraction": [
            f'nwr{location}["tourism"~"attraction|museum|viewpoint|gallery"]["name"];',
            f'nwr{location}["historic"]["name"];',
            f'nwr{location}["leisure"="park"]["name"];',
        ],
    }
    return (
        "[out:json][timeout:25];("
        + "".join(selectors[category])
        + ");out center tags;"
    )


def haversine_distance_km(latitude_a, longitude_a, latitude_b, longitude_b):
    earth_radius_km = 6371
    latitude_delta = radians(latitude_b - latitude_a)
    longitude_delta = radians(longitude_b - longitude_a)
    calculation = (
        sin(latitude_delta / 2) ** 2
        + cos(radians(latitude_a))
        * cos(radians(latitude_b))
        * sin(longitude_delta / 2) ** 2
    )
    return earth_radius_km * 2 * asin(sqrt(calculation))


def get_element_coordinates(element):
    if element.get("lat") is not None and element.get("lon") is not None:
        return element["lat"], element["lon"]

    center = element.get("center") or {}
    return center.get("lat"), center.get("lon")


def get_place_description(tags, category):
    if tags.get("cuisine"):
        cuisine = tags["cuisine"].replace(";", ", ").replace("_", " ")
        return f"Cuisine: {cuisine}"
    if tags.get("denomination"):
        return tags["denomination"].replace("_", " ").title()
    if tags.get("historic"):
        return f"Historic {tags['historic'].replace('_', ' ')}"
    if tags.get("tourism"):
        return tags["tourism"].replace("_", " ").title()
    if category == "park":
        return "Park or garden"
    return CATEGORY_LABELS[category][:-1].capitalize()


def get_popularity_score(tags):
    return (
        (5 if tags.get("wikipedia") else 0)
        + (4 if tags.get("wikidata") else 0)
        + (2 if tags.get("website") else 0)
        + (1 if tags.get("opening_hours") else 0)
        + (1 if tags.get("image") else 0)
    )


@lru_cache(maxsize=256)
def fetch_recommendations(category, latitude, longitude, radius):
    query = get_category_query(category, latitude, longitude, radius)
    successful_response = None
    last_error = None
    session = requests.Session()
    session.trust_env = False

    for overpass_api_url in OVERPASS_API_URLS:
        try:
            response = session.post(
                overpass_api_url,
                data={"data": query},
                headers=OVERPASS_HEADERS,
                timeout=OVERPASS_TIMEOUT,
            )
            response.raise_for_status()
            successful_response = response
            break
        except requests.RequestException as error:
            last_error = error

    if successful_response is None:
        raise last_error or requests.RequestException(
            "No Overpass API endpoint was available."
        )

    recommendations = []
    seen_names = set()

    for element in successful_response.json().get("elements", []):
        tags = element.get("tags") or {}
        name = (tags.get("name:en") or tags.get("name") or "").strip()
        place_latitude, place_longitude = get_element_coordinates(element)

        if not name or place_latitude is None or place_longitude is None:
            continue

        normalized_name = name.casefold()
        if normalized_name in seen_names:
            continue

        seen_names.add(normalized_name)
        recommendations.append(
            {
                "name": name,
                "description": get_place_description(tags, category),
                "distance_km": round(
                    haversine_distance_km(
                        latitude,
                        longitude,
                        place_latitude,
                        place_longitude,
                    ),
                    1,
                ),
                "latitude": place_latitude,
                "longitude": place_longitude,
                "popularity_score": get_popularity_score(tags),
            }
        )

    recommendations.sort(
        key=lambda place: (-place["popularity_score"], place["distance_km"], place["name"])
    )
    return tuple(
        {
            key: value
            for key, value in place.items()
            if key != "popularity_score"
        }
        for place in recommendations[:MAX_RECOMMENDATIONS]
    )


@chatbot_bp.route("/recommendations", methods=["POST"])
def get_chatbot_recommendations():
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    latitude = parse_number(data.get("latitude"))
    longitude = parse_number(data.get("longitude"))
    location_label = (data.get("location_label") or "the current map area").strip()

    if not message:
        return jsonify({"error": "Please enter a message."}), 400

    category = detect_category(message)
    if category is None:
        return jsonify(
            {
                "reply": (
                    "I can recommend nearby restaurants, temples, cafes, parks, "
                    "museums, and famous places. Try asking \"famous places nearby\" "
                    "or \"restaurants around here\"."
                ),
                "recommendations": [],
            }
        )

    if latitude is None or longitude is None:
        return jsonify(
            {
                "reply": "Search for a location on the map first, then ask me what is nearby.",
                "recommendations": [],
            }
        )

    try:
        recommendations = list(
            fetch_recommendations(
                category,
                round(latitude, 4),
                round(longitude, 4),
                DEFAULT_RADIUS_METERS,
            )
        )
    except requests.RequestException:
        return jsonify(
            {
                "reply": (
                    "I could not reach the nearby-places service just now. "
                    "Please try again in a moment."
                ),
                "recommendations": [],
                "service_available": False,
            }
        )

    category_label = CATEGORY_LABELS[category]
    reply = (
        f"Here are some {category_label} near {location_label}. "
        "Famous or well-documented places are shown first."
        if recommendations
        else f"I could not find named {category_label} near {location_label}."
    )
    return jsonify(
        {
            "reply": reply,
            "category": category,
            "recommendations": recommendations,
        }
    )
