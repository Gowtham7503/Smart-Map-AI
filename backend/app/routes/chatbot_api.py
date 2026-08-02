from functools import lru_cache
from math import asin, cos, radians, sin, sqrt
import json
import os
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
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_GEMINI_API_KEY")
GEMINI_TIMEOUT = (3, 12)

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

DIRECTION_KEYWORDS = {
    "directions",
    "direction",
    "route",
    "navigate",
    "navigation",
    "go",
    "travel",
    "drive",
    "walk",
    "bike",
    "cycling",
}

MODE_KEYWORDS = {
    "car": ("car", "drive", "driving", "cab", "taxi"),
    "bike": ("bike", "bicycle", "cycle", "cycling"),
    "walk": ("walk", "walking", "foot"),
}

FILTER_KEYWORDS = {
    "safest": ("safe", "safest", "safety", "secure"),
    "pollution": ("pollution", "clean", "cleanest", "air quality", "less polluted"),
    "traffic": ("traffic", "jam", "congestion", "fastest", "less traffic"),
}

TRAILING_ROUTE_QUALIFIER_PATTERNS = (
    r"\s+(?:with|using|use|apply|applying|enable|enabled|by)\s+.*\b(?:filter|filters|route|routing|traffic|pollution|safest|safety|safe|clean|cleanest|fastest)\b.*$",
    r"\s+(?:and\s+)?(?:avoid|less|low|lowest|minimum|minimize)\s+.*\b(?:traffic|pollution|congestion)\b.*$",
    r"\s+(?:and\s+)?(?:safe|safest|secure|fastest|clean|cleanest)\s+(?:route|routing|way)\b.*$",
)

LEADING_ROUTE_WORD_PATTERN = (
    r"^(?:i\s+need\s+to\s+|i\s+want\s+to\s+|please\s+)?"
    r"(?:go|goto|navigate|travel|drive|walk|bike|route|directions?)\s+"
)


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


def get_default_filters():
    return {
        "safest": False,
        "pollution": False,
        "traffic": False,
    }


def detect_mode(message):
    normalized_message = message.lower()

    for mode, keywords in MODE_KEYWORDS.items():
        if any(keyword in normalized_message for keyword in keywords):
            return mode

    return None


def detect_filters(message):
    normalized_message = message.lower()
    filters = get_default_filters()

    for filter_name, keywords in FILTER_KEYWORDS.items():
        if any(keyword in normalized_message for keyword in keywords):
            filters[filter_name] = True

    return filters


def normalize_place_name(place):
    if not place:
        return ""

    normalized_place = re.sub(r"\s+", " ", place).strip(" .,!?:;\"'")
    normalized_place = re.sub(
        LEADING_ROUTE_WORD_PATTERN,
        "",
        normalized_place,
        flags=re.IGNORECASE,
    ).strip(" .,!?:;\"'")

    for pattern in TRAILING_ROUTE_QUALIFIER_PATTERNS:
        normalized_place = re.sub(
            pattern,
            "",
            normalized_place,
            flags=re.IGNORECASE,
        ).strip(" .,!?:;\"'")

    if normalized_place.lower() in {"my location", "current location"}:
        return "My Location"

    return normalized_place


def parse_direction_intent_with_patterns(message):
    normalized_message = re.sub(r"\s+", " ", message).strip()
    direction_words = set(re.sub(r"[^a-z0-9\s]", " ", normalized_message.lower()).split())
    has_direction_keyword = bool(direction_words.intersection(DIRECTION_KEYWORDS))

    patterns = (
        r"^(?:.*?\b)?from\s+(?P<from>.+?)\s+(?:to|towards?)\s+(?P<to>.+)$",
        r"^(?:.*?\b)?between\s+(?P<from>.+?)\s+and\s+(?P<to>.+)$",
        r"^(?:.*?\b)?(?:to|towards?)\s+(?P<to>.+?)\s+from\s+(?P<from>.+)$",
        r"^(?:i\s+need\s+to\s+|i\s+want\s+to\s+|please\s+)?(?:go|goto|navigate|travel|drive|walk|bike)\s+(?:to\s+|towards\s+)?(?P<to>.+)$",
        r"^(?P<from>.+?)\s+(?:to|towards?)\s+(?P<to>.+)$",
    )

    for index, pattern in enumerate(patterns):
        match = re.search(pattern, normalized_message, flags=re.IGNORECASE)

        if not match:
            continue

        is_simple_to_pattern = index == len(patterns) - 1

        if is_simple_to_pattern and not has_direction_keyword:
            category = detect_category(message)
            if category is not None:
                return None

        origin = normalize_place_name(match.groupdict().get("from") or "My Location")
        destination = normalize_place_name(match.groupdict().get("to"))

        if origin and destination:
            return {
                "type": "directions",
                "from": origin,
                "to": destination,
                "mode": detect_mode(message),
                "filters": detect_filters(message),
            }

    return None


def parse_json_object(text):
    if not text:
        return None

    cleaned_text = text.strip()
    fenced_match = re.search(
        r"```(?:json)?\s*(\{.*?\})\s*```",
        cleaned_text,
        flags=re.IGNORECASE | re.DOTALL,
    )

    if fenced_match:
        cleaned_text = fenced_match.group(1)
    else:
        object_match = re.search(r"\{.*\}", cleaned_text, flags=re.DOTALL)
        if object_match:
            cleaned_text = object_match.group(0)

    try:
        return json.loads(cleaned_text)
    except json.JSONDecodeError:
        return None


def parse_direction_intent_with_gemini(message):
    if not GEMINI_API_KEY:
        return None

    prompt = (
        "Extract a map direction intent from this user message. "
        "Return only JSON with this shape: "
        '{"is_direction": boolean, "from": string|null, "to": string|null, '
        '"mode": "car"|"bike"|"walk"|null, '
        '"filters": {"safest": boolean, "pollution": boolean, "traffic": boolean}}. '
        "Use null when a location is missing. Interpret 'my location' or "
        "'current location' as 'My Location'. Enable filters only when the user asks "
        "for safer, cleaner/low pollution, or lower-traffic/fastest routing. "
        "The from and to values must contain only place names; do not include "
        "words about route filters, traffic, pollution, safety, mode, or phrases "
        "like 'with filter applied'. "
        f"Message: {message}"
    )
    endpoint = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{GEMINI_MODEL}:generateContent"
    )

    try:
        response = requests.post(
            endpoint,
            headers={"x-goog-api-key": GEMINI_API_KEY},
            json={"contents": [{"parts": [{"text": prompt}]}]},
            timeout=GEMINI_TIMEOUT,
        )
        response.raise_for_status()
    except requests.RequestException:
        return None

    parts = (
        response.json()
        .get("candidates", [{}])[0]
        .get("content", {})
        .get("parts", [])
    )
    gemini_text = "\n".join(part.get("text", "") for part in parts)
    parsed_intent = parse_json_object(gemini_text)

    if not parsed_intent or not parsed_intent.get("is_direction"):
        return None

    origin = normalize_place_name(parsed_intent.get("from"))
    destination = normalize_place_name(parsed_intent.get("to"))

    if not origin or not destination:
        return None

    filters = get_default_filters()
    filters.update(
        {
            key: bool((parsed_intent.get("filters") or {}).get(key, filters[key]))
            for key in filters
        }
    )

    mode = parsed_intent.get("mode")
    return {
        "type": "directions",
        "from": origin,
        "to": destination,
        "mode": mode if mode in MODE_KEYWORDS else detect_mode(message),
        "filters": filters,
    }


def detect_direction_intent(message):
    return parse_direction_intent_with_patterns(message) or parse_direction_intent_with_gemini(message)


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

    direction_intent = detect_direction_intent(message)
    if direction_intent:
        mode_label = direction_intent["mode"] or "car"
        active_filters = [
            label
            for key, label in (
                ("safest", "safest route"),
                ("pollution", "low-pollution route"),
                ("traffic", "lower-traffic route"),
            )
            if direction_intent["filters"].get(key)
        ]
        filter_label = ", ".join(active_filters) if active_filters else "standard route"

        return jsonify(
            {
                "reply": (
                    f"Finding a {filter_label} by {mode_label} from "
                    f"{direction_intent['from']} to {direction_intent['to']}."
                ),
                "action": direction_intent,
                "recommendations": [],
            }
        )

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
