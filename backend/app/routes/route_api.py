from flask import Blueprint, jsonify, request
from datetime import datetime
from functools import lru_cache
import os
from urllib.parse import quote

from dotenv import load_dotenv
import requests

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
ENV_PATH = os.path.join(BASE_DIR, ".env")

load_dotenv(ENV_PATH)

api = Blueprint("api", __name__)

ORS_API_KEY = os.getenv("ORS_API_KEY")
TRAFFIC_API_KEY = (os.getenv("TRAFFIC_API_KEY") or "").strip()
UNSPLASH_API_KEY = (os.getenv("UNSPLASH_API_KEY") or os.getenv("UNSPLASH_ACCESS_KEY") or "").strip()
ORS_PROFILES = {
    "car": "driving-car",
    "bike": "cycling-regular",
    "walk": "foot-walking",
}
OVERPASS_API_URL = "https://overpass-api.de/api/interpreter"
TOMTOM_FLOW_URL = "https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json"
POI_RADIUS_METERS = 500
POI_SAMPLE_LIMIT = 3
WIKIPEDIA_HEADERS = {
    "User-Agent": "smartmap/1.0 (place details lookup)",
    "Accept": "application/json",
}


def calculate_waytype_safety_score(waytype_summary):
    if not waytype_summary:
        return 0

    total_distance = 0
    weighted_score = 0

    for item in waytype_summary:
        waytype = item.get("value", 0)
        distance = item.get("distance", 0) or 0

        if waytype in [1, 2]:
            score = 1
        elif waytype in [3, 4]:
            score = 3
        else:
            score = 6

        total_distance += distance
        weighted_score += score * distance

    if total_distance == 0:
        return 0

    return round(weighted_score / total_distance, 2)


def get_main_road_ratio(waytype_summary):
    total_distance = 0
    main_road_distance = 0

    for item in waytype_summary or []:
        distance = item.get("distance", 0) or 0
        waytype = item.get("value", 0)
        total_distance += distance

        if waytype in [1, 2]:
            main_road_distance += distance

    if total_distance == 0:
        return 0

    return round(main_road_distance / total_distance, 2)


def get_time_safety_adjustment(hour, mode):
    if hour >= 22 or hour < 5:
        penalties = {
            "walk": 1.4,
            "bike": 1.1,
            "car": 0.7,
        }
        return penalties.get(mode, 0.8), "late_night"

    if 5 <= hour < 7 or 19 <= hour < 22:
        penalties = {
            "walk": 0.9,
            "bike": 0.7,
            "car": 0.4,
        }
        return penalties.get(mode, 0.5), "low_light"

    return 0, "daytime"


def decode_polyline(encoded):
    coordinates = []
    index = 0
    lat = 0
    lng = 0

    while index < len(encoded):
        shift = 0
        result = 0

        while True:
            byte = ord(encoded[index]) - 63
            index += 1
            result |= (byte & 0x1F) << shift
            shift += 5
            if byte < 0x20:
                break

        delta_lat = ~(result >> 1) if result & 1 else result >> 1
        lat += delta_lat

        shift = 0
        result = 0

        while True:
            byte = ord(encoded[index]) - 63
            index += 1
            result |= (byte & 0x1F) << shift
            shift += 5
            if byte < 0x20:
                break

        delta_lng = ~(result >> 1) if result & 1 else result >> 1
        lng += delta_lng

        coordinates.append((lat / 1e5, lng / 1e5))

    return coordinates


def sample_route_points(decoded_coordinates, sample_limit=POI_SAMPLE_LIMIT):
    if not decoded_coordinates:
        return []

    if len(decoded_coordinates) <= sample_limit:
        return decoded_coordinates

    sample_indexes = {0, len(decoded_coordinates) - 1, len(decoded_coordinates) // 2}
    return [decoded_coordinates[index] for index in sorted(sample_indexes)]


def round_coordinate(value):
    return round(value, 4)


def normalize_sampled_points(sampled_points):
    return tuple(
        (round_coordinate(lat), round_coordinate(lon))
        for lat, lon in sampled_points
    )


@lru_cache(maxsize=256)
def fetch_overpass_signals(sampled_points):
    if not sampled_points:
        return tuple(), tuple()

    point_queries = []

    for lat, lon in sampled_points:
        point_queries.extend(
            [
                f'node(around:{POI_RADIUS_METERS},{lat},{lon})["amenity"="restaurant"];',
                f'node(around:{POI_RADIUS_METERS},{lat},{lon})["amenity"="cafe"];',
                f'node(around:{POI_RADIUS_METERS},{lat},{lon})["shop"];',
                f'node(around:{POI_RADIUS_METERS},{lat},{lon})["amenity"="hospital"];',
                f'node(around:{POI_RADIUS_METERS},{lat},{lon})["amenity"="police"];',
                f'node(around:{POI_RADIUS_METERS},{lat},{lon})["highway"="street_lamp"];',
                f'way(around:{POI_RADIUS_METERS},{lat},{lon})["lit"="yes"];',
            ]
        )

    query = "[out:json];(" + "".join(point_queries) + ");out center;"
    response = requests.post(
        OVERPASS_API_URL,
        data=query,
        headers={"Content-Type": "text/plain"},
        timeout=12,
    )
    response.raise_for_status()

    poi_ids = set()
    street_light_ids = set()

    for element in response.json().get("elements", []):
        element_id = element.get("id")

        if element_id is None:
            continue

        tags = element.get("tags", {})
        element_key = f"{element.get('type', 'element')}:{element_id}"

        if (
            tags.get("amenity") in {"restaurant", "cafe", "hospital", "police"}
            or "shop" in tags
        ):
            poi_ids.add(element_key)

        if tags.get("highway") == "street_lamp" or tags.get("lit") == "yes":
            street_light_ids.add(element_key)

    return tuple(sorted(poi_ids)), tuple(sorted(street_light_ids))


def get_route_activity_score(overpass_poi_ids):
    crowd_score = len(overpass_poi_ids)
    crowd_bonus = round(min(1.5, crowd_score / 20), 2)
    return crowd_score, crowd_bonus


def get_route_lighting_score(overpass_street_light_ids, waytype_summary):
    street_light_count = len(overpass_street_light_ids)
    lamp_bonus = round(min(1.0, street_light_count / 25), 2)
    main_road_ratio = get_main_road_ratio(waytype_summary)
    main_road_bonus = round(min(0.8, main_road_ratio * 0.8), 2)
    lighting_bonus = round(min(1.5, lamp_bonus + main_road_bonus), 2)

    return street_light_count, main_road_ratio, lighting_bonus


@lru_cache(maxsize=256)
def fetch_traffic_snapshot(lat, lon):
    if not TRAFFIC_API_KEY:
        return None

    response = requests.get(
        TOMTOM_FLOW_URL,
        params={
            "key": TRAFFIC_API_KEY,
            "point": f"{lat},{lon}",
            "unit": "KMPH",
            "thickness": 10,
        },
        timeout=10,
    )
    response.raise_for_status()
    return response.json().get("flowSegmentData", {})


def get_route_traffic_score(route, mode):
    if not TRAFFIC_API_KEY:
        return 0, 0, 0

    sampled_points = get_route_sample_points(route)

    if not sampled_points:
        return 0, 0, 0

    congestion_values = []
    road_closures = 0

    for lat, lon in sampled_points:
        try:
            traffic = fetch_traffic_snapshot(
                round_coordinate(lat),
                round_coordinate(lon),
            )
        except requests.RequestException:
            continue

        if not traffic:
            continue

        current_speed = traffic.get("currentSpeed")
        free_flow_speed = traffic.get("freeFlowSpeed")

        if traffic.get("roadClosure"):
            road_closures += 1

        if current_speed and free_flow_speed:
            congestion_ratio = 1 - min(current_speed / free_flow_speed, 1)
            congestion_values.append(congestion_ratio)

    if not congestion_values and road_closures == 0:
        return 0, 0, 0

    avg_congestion = round(sum(congestion_values) / len(congestion_values), 2) if congestion_values else 0

    if mode == "car":
        traffic_penalty = round(avg_congestion * 1.2 + road_closures * 1.5, 2)
    else:
        traffic_penalty = round(avg_congestion * 0.5 + road_closures * 1.0, 2)

    return avg_congestion, road_closures, min(2.5, traffic_penalty)


def get_route_sample_points(route):
    geometry = route.get("geometry")

    if not geometry:
        return []

    try:
        decoded_coordinates = decode_polyline(geometry)
    except (TypeError, ValueError, IndexError):
        return []

    return sample_route_points(decoded_coordinates)


def score_route_for_safety(route, mode, current_hour):
    route_extras = route.get("extras") or route.get("extra_info") or {}
    waytype_summary = route_extras.get("waytype", {}).get("summary", [])
    base_safety_score = calculate_waytype_safety_score(waytype_summary)
    time_penalty, time_band = get_time_safety_adjustment(current_hour, mode)
    sampled_points = get_route_sample_points(route)
    normalized_points = normalize_sampled_points(sampled_points)

    try:
        overpass_poi_ids, overpass_street_light_ids = fetch_overpass_signals(normalized_points)
    except requests.RequestException:
        overpass_poi_ids, overpass_street_light_ids = tuple(), tuple()

    crowd_score, crowd_bonus = get_route_activity_score(overpass_poi_ids)
    street_light_count, main_road_ratio, lighting_bonus = get_route_lighting_score(
        overpass_street_light_ids, waytype_summary
    )
    traffic_congestion, road_closures, traffic_penalty = get_route_traffic_score(route, mode)
    safety_score = round(
        max(
            1,
            min(
                6,
                base_safety_score
                + time_penalty
                + traffic_penalty
                - crowd_bonus
                - lighting_bonus,
            ),
        ),
        2,
    )

    route["safety_score"] = safety_score
    route["safety_context"] = {
        "base_score": base_safety_score,
        "time_penalty": time_penalty,
        "crowd_score": crowd_score,
        "crowd_bonus": crowd_bonus,
        "street_light_count": street_light_count,
        "main_road_ratio": main_road_ratio,
        "lighting_bonus": lighting_bonus,
        "traffic_congestion": traffic_congestion,
        "traffic_penalty": traffic_penalty,
        "road_closures": road_closures,
        "time_band": time_band,
        "evaluated_hour": current_hour,
    }

    for segment in route.get("segments", []):
        segment["safety_score"] = safety_score

    return safety_score


@api.route("/route", methods=["POST"])
def get_route():
    data = request.get_json(silent=True) or {}
    coordinates = data.get("coordinates")
    mode = (data.get("mode") or "car").strip().lower()
    filters = data.get("filters") or {}
    is_safe = bool(filters.get("safest", False))

    if not ORS_API_KEY:
        return jsonify({"error": "API key not loaded"}), 500

    if not coordinates:
        return jsonify({"error": "Coordinates are required"}), 400

    profile = ORS_PROFILES.get(mode)

    if not profile:
        return jsonify({"error": "Unsupported travel mode"}), 400

    request_body = {
        "coordinates": coordinates,
        "extra_info": ["waytype", "steepness"],
    }

    if is_safe:
        request_body["alternative_routes"] = {
            "target_count": 3,
            "share_factor": 0.6,
            "weight_factor": 2,
        }

    try:
        response = requests.post(
            f"https://api.openrouteservice.org/v2/directions/{profile}",
            json=request_body,
            headers={
                "Authorization": ORS_API_KEY,
                "Content-Type": "application/json",
            },
            timeout=20,
        )
        response.raise_for_status()
        route_data = response.json()
    except requests.RequestException as error:
        should_retry_without_alternatives = (
            is_safe
            and error.response is not None
            and error.response.status_code == 400
        )

        if not should_retry_without_alternatives:
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

        fallback_body = {
            "coordinates": coordinates,
            "extra_info": ["waytype", "steepness"],
        }

        try:
            response = requests.post(
                f"https://api.openrouteservice.org/v2/directions/{profile}",
                json=fallback_body,
                headers={
                    "Authorization": ORS_API_KEY,
                    "Content-Type": "application/json",
                },
                timeout=20,
            )
            response.raise_for_status()
            route_data = response.json()
            route_data.setdefault("metadata", {})
            route_data["metadata"]["safest_route_fallback"] = (
                "Alternative routes unavailable for this request. "
                "Showing the safest score for the default route."
            )
        except requests.RequestException as retry_error:
            details = None

            if retry_error.response is not None:
                try:
                    details = retry_error.response.json()
                except ValueError:
                    details = retry_error.response.text

            return (
                jsonify({"error": "Unable to fetch route", "details": details or str(retry_error)}),
                502,
            )

    if is_safe:
        current_hour = datetime.now().hour
        routes = route_data.get("routes", [])

        for index, route in enumerate(routes):
            score_route_for_safety(route, mode, current_hour)
            route["route_rank"] = index + 1

        routes.sort(key=lambda route: route.get("safety_score", 6))

        for index, route in enumerate(routes):
            route["selected_for_safety"] = index == 0
            route["selection_reason"] = (
                "Lowest safety score among returned alternatives"
                if index == 0
                else "Alternative route with a higher safety score"
            )
            route["safety_context"]["alternatives_considered"] = len(routes)
            route["safety_context"]["selected_rank"] = index + 1

        route_data["routes"] = routes
        route_data.setdefault("metadata", {})
        route_data["metadata"]["safest_route_enabled"] = True
        route_data["metadata"]["alternatives_returned"] = len(routes)
        route_data["metadata"]["selected_route_strategy"] = (
            "Lowest safety score returned first"
        )

    return jsonify(route_data)


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
