from functools import lru_cache
from math import asin, cos, radians, sin, sqrt
import json
import os
import re

from flask import Blueprint, jsonify, request
import requests
from dotenv import load_dotenv

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
load_dotenv(os.path.join(BASE_DIR, ".env"))

chatbot_bp = Blueprint("chatbot", __name__)

OVERPASS_API_URLS = (
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
)
OVERPASS_TIMEOUT = (3, 25)
OVERPASS_HEADERS = {
    "Accept": "application/json",
    "User-Agent": "smartmap/1.0 (nearby place recommendations)",
}
DEFAULT_RADIUS_METERS = 3000
MAX_RECOMMENDATIONS = 6

GEMINI_API_KEY = (
    os.getenv("GEMINI_API_KEY")
    or os.getenv("GOOGLE_GEMINI_API_KEY")
    or ""
).strip()

GEMINI_MODELS = [
    model.strip()
    for model in os.getenv(
        "GEMINI_MODELS",
        "gemini-3.5-flash-lite,gemini-3.1-flash-lite,gemini-2.5-flash-lite",
    ).split(",")
    if model.strip()
]
GEMINI_TIMEOUT = (3, 10)

SYSTEM_PROMPT = """You are SmartMaps AI - an intelligent navigation & city routing co-pilot.
Your goal is to help users find routes, navigate safely, explore nearby places, and control the SmartMaps map interface.

You MUST always return a valid JSON object matching this schema:
{
  "reply": "Friendly, helpful conversational response explaining what you did or answering the user's travel question.",
  "action": <ActionObject or null>
}

SUPPORTED ACTIONS:
1. "directions": Routing between locations with optional safety/eco/traffic preferences.
   {
     "type": "directions",
     "from": "Origin City / Place (or 'My Location')",
     "to": "Destination City / Place",
     "mode": "car" | "bike" | "walk",
     "filters": {
       "safest": boolean,
       "pollution": boolean,
       "traffic": boolean
     }
   }
   - If origin is not given or user says "go to X" / "navigate to X", use "from": "My Location".
   - The 'from' and 'to' fields MUST ONLY contain the clean place name (e.g. "Delhi", NOT "Delhi safely").
   - If user asks for "safely", "safe route", "safety", set "safest": true.
   - If user asks for "eco", "clean route", "low pollution", set "pollution": true.
   - If user asks for "fastest", "avoid traffic", "least traffic", set "traffic": true.
   - Default mode is "car" unless user mentions bicycle/bike or walking/foot.

2. "search_place": Search and focus map on a specific landmark, city, or address.
   {
     "type": "search_place",
     "query": "Place Name"
   }

3. "toggle_filter": Toggle safety, pollution, or traffic optimization filters.
   {
     "type": "toggle_filter",
     "filters": {
       "safest": boolean,
       "pollution": boolean,
       "traffic": boolean
     }
   }

4. "start_navigation": Start turn-by-turn GPS HUD navigation.
   {
     "type": "start_navigation"
   }

5. "nearby_places": Look up nearby points of interest around the current map area.
   {
     "type": "nearby_places",
     "category": "restaurant" | "temple" | "cafe" | "museum" | "park" | "attraction"
   }

If the user is asking a general question, set action to null and provide a knowledgeable reply."""

CATEGORY_KEYWORDS = {
    "restaurant": ("restaurant", "restaurants", "food", "eat", "dinner", "lunch", "breakfast"),
    "temple": ("temple", "temples", "mandir", "worship", "religious", "church", "mosque"),
    "cafe": ("cafe", "cafes", "coffee", "tea"),
    "museum": ("museum", "museums", "art gallery", "exhibition"),
    "park": ("park", "parks", "garden", "gardens", "lake"),
    "attraction": ("famous", "attraction", "attractions", "landmark", "landmarks", "places", "place", "visit", "sightseeing", "tourist"),
}

CATEGORY_LABELS = {
    "restaurant": "restaurants",
    "temple": "places of worship",
    "cafe": "cafes",
    "museum": "museums",
    "park": "parks & gardens",
    "attraction": "famous places",
}


def parse_number(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def clean_place_string(val):
    if not val:
        return ""
    cleaned = str(val).strip(" .,!?:;\"'")
    if cleaned.lower() in ("my location", "current location", "here"):
        return "My Location"
    cleaned = re.sub(r"\s+(?:safely|safest|safe|fastest|quickest|cleanest|by car|by bike|by walk|avoiding traffic|avoid traffic)\b.*$", "", cleaned, flags=re.I)
    return cleaned.strip(" .,!?:;\"'")


def format_place_name(place):
    cleaned = clean_place_string(place)
    if cleaned == "My Location" or not cleaned:
        return cleaned
    return " ".join(word.capitalize() for word in cleaned.split())


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


def ask_gemini_flash_lite(message, history=None):
    if not GEMINI_API_KEY:
        return None

    contents = []
    if history and isinstance(history, list):
        for item in history[-6:]:
            role = "user" if item.get("sender") == "user" else "model"
            text = item.get("text", "")
            if text:
                contents.append({"role": role, "parts": [{"text": text}]})

    contents.append({"role": "user", "parts": [{"text": message}]})

    payload = {
        "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]},
        "contents": contents,
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.2,
        },
    }

    session = requests.Session()
    session.trust_env = False

    for model_name in GEMINI_MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
        try:
            res = session.post(
                url,
                headers={"x-goog-api-key": GEMINI_API_KEY},
                json=payload,
                timeout=GEMINI_TIMEOUT,
            )
            if res.status_code == 200:
                body = res.json()
                parts = (
                    body.get("candidates", [{}])[0]
                    .get("content", {})
                    .get("parts", [])
                )
                raw_text = "\n".join(p.get("text", "") for p in parts)
                parsed = parse_json_object(raw_text)
                if parsed and isinstance(parsed, dict) and "reply" in parsed:
                    if parsed.get("action") and parsed["action"].get("type") == "directions":
                        parsed["action"]["from"] = clean_place_string(parsed["action"].get("from", "My Location"))
                        parsed["action"]["to"] = clean_place_string(parsed["action"].get("to", ""))
                    return parsed
            print(
                f"Gemini API returned {res.status_code} for {model_name}: "
                f"{res.text[:300]}",
                flush=True,
            )
        except requests.RequestException as e:
            print(f"Gemini API request failed for {model_name}: {e}")
            continue

    return None


def detect_category(message):
    normalized = re.sub(r"[^a-z0-9\s]", " ", message.lower())
    words = set(normalized.split())
    for category, keywords in CATEGORY_KEYWORDS.items():
        if words.intersection(keywords):
            return category
    if words.intersection({"nearby", "recommend", "recommendation", "recommendations"}):
        return "attraction"
    return None


def fallback_rule_based_intent(message):
    normalized = re.sub(r"\s+", " ", message).strip()
    lower = normalized.lower()

    # Routing intent
    directions_match = (
        re.search(
            r"\bfrom\s+(?P<from>.+?)\s+\bto\s+(?P<to>.+)$",
            normalized,
            flags=re.IGNORECASE,
        )
        or re.search(
            r"\b(?:go|travel|drive|navigate)\s+(?:from\s+(?P<from>.+?)\s+)?to\s+(?P<to>.+)$",
            normalized,
            flags=re.IGNORECASE,
        )
        or re.search(
            r"^(?P<from>[a-zA-Z\s]+?)\s+\bto\s+(?P<to>[a-zA-Z\s]+)$",
            normalized,
            flags=re.IGNORECASE,
        )
    )
    if directions_match:
        d = directions_match.groupdict()
        origin = d.get("from") or "My Location"
        dest = d.get("to")
        if dest:
            dest = format_place_name(dest)
            origin = format_place_name(origin)
            mode = "bike" if "bike" in lower or "cycle" in lower else "walk" if "walk" in lower or "foot" in lower else "car"
            safest = any(w in lower for w in ("safe", "safely", "safest", "security"))
            pollution = any(w in lower for w in ("pollution", "eco", "clean", "cleanest"))
            traffic = any(w in lower for w in ("traffic", "fastest", "quickest", "avoid traffic"))
            return {
                "reply": f"Finding a {'safest ' if safest else ''}route from {origin} to {dest} by {mode}.",
                "action": {
                    "type": "directions",
                    "from": origin,
                    "to": dest,
                    "mode": mode,
                    "filters": {
                        "safest": safest,
                        "pollution": pollution,
                        "traffic": traffic,
                    },
                },
            }

    # Search intent
    if lower.startswith(("search ", "find ", "locate ", "where is ")):
        query = clean_place_string(re.sub(r"^(search|find|locate|where is)\s+(for\s+)?", "", normalized, flags=re.I))
        return {
            "reply": f"Searching for '{query}' on SmartMaps.",
            "action": {"type": "search_place", "query": query},
        }

    # Start navigation
    if any(w in lower for w in ("start navigation", "start driving", "begin navigation", "start route")):
        return {
            "reply": "Starting GPS turn-by-turn navigation HUD now. Drive safely!",
            "action": {"type": "start_navigation"},
        }

    # Nearby POIs
    cat = detect_category(lower)
    if cat:
        return {
            "reply": f"Finding nearby {CATEGORY_LABELS[cat]} around your current location.",
            "action": {"type": "nearby_places", "category": cat},
        }

    return {
        "reply": "I am your SmartMaps AI assistant. Ask me for directions (e.g. 'Hyderabad to Delhi safely'), to search any location, find nearby places, or toggle navigation!",
        "action": None,
    }


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
    return CATEGORY_LABELS.get(category, "Point of interest")[:-1].capitalize()


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
    query = (
        "[out:json][timeout:20];("
        + "".join(selectors.get(category, selectors["attraction"]))
        + ");out center tags;"
    )

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
            if response.status_code == 200:
                successful_response = response
                break
        except requests.RequestException as error:
            last_error = error

    if successful_response is None:
        return ()

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
        {key: value for key, value in place.items() if key != "popularity_score"}
        for place in recommendations[:MAX_RECOMMENDATIONS]
    )


@chatbot_bp.route("/recommendations", methods=["POST"])
def get_chatbot_recommendations():
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    latitude = parse_number(data.get("latitude"))
    longitude = parse_number(data.get("longitude"))
    history = data.get("history", [])

    if not message:
        return jsonify({"error": "Please enter a message."}), 400

    # 1. Ask Gemini Flash Lite with conversational context
    result = ask_gemini_flash_lite(message, history)

    # 2. Fallback if Gemini fails
    if not result:
        result = fallback_rule_based_intent(message)

    action = result.get("action")
    recommendations = []

    # 3. If action is nearby POIs and we have coordinates, fetch real data
    if action and action.get("type") == "nearby_places":
        category = action.get("category", "attraction")
        if latitude is not None and longitude is not None:
            try:
                recommendations = list(
                    fetch_recommendations(
                        category,
                        round(latitude, 4),
                        round(longitude, 4),
                        DEFAULT_RADIUS_METERS,
                    )
                )
            except Exception as e:
                print("Error fetching nearby places:", e)

    return jsonify(
        {
            "reply": result.get("reply", "Here is what I found for you."),
            "action": action,
            "recommendations": recommendations,
        }
    )
