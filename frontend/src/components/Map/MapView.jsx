import { useEffect, useRef, useState } from "react";
import polyline from "polyline";
import axios from "axios";
import { getLowPollutionRoute, getRoute, getCurrentUser } from "../../services/api";
import MapBottomPanel from "./MapBottomPanel";
import MapCanvas from "./MapCanvas";
import PlaceHoverCard from "./PlaceHoverCard";
import "./Map.css";
import MapSearchBar from "./MapSearchBar";
import MapSidebar from "./MapSidebar";
import Chatbot from "../Chatbot/Chatbot";

const defaultCenter = [17.4948, 78.3996];
const LAST_SEARCH_STORAGE_KEY = "smartmap:last-search";
const directionsGeocodeCache = new Map();

const formatBackendError = (details, seen = new WeakSet()) => {
  if (!details) {
    return "";
  }

  if (typeof details === "string") {
    return details;
  }

  if (Array.isArray(details)) {
    return details
      .map((detail) => formatBackendError(detail, seen))
      .filter(Boolean)
      .join(" ");
  }

  if (typeof details === "object") {
    if (seen.has(details)) {
      return "";
    }

    seen.add(details);

    const nestedMessage =
      formatBackendError(details.message, seen) ||
      formatBackendError(details.error, seen) ||
      formatBackendError(details.detail, seen);

    if (nestedMessage) {
      return nestedMessage;
    }

    try {
      return JSON.stringify(details);
    } catch {
      return "";
    }
  }

  return String(details);
};

const getRouteFailureMessage = (failure) => {
  const errorData = failure?.reason?.response?.data;
  const status = failure?.reason?.response?.status;
  const backendError =
    formatBackendError(errorData?.details) ||
    formatBackendError(errorData?.error) ||
    formatBackendError(errorData) ||
    formatBackendError(failure?.reason?.message);

  if (backendError && status) {
    return `${backendError} (HTTP ${status})`;
  }

  return backendError || "Unable to fetch route details for any travel mode.";
};

const geocodePlaceWithNominatim = async (place, includeGeometry = true) => {
  const res = await axios.get(
    "https://nominatim.openstreetmap.org/search",
    {
      params: {
        format: "json",
        polygon_geojson: includeGeometry ? 1 : 0,
        limit: includeGeometry ? 10 : 5,
        q: place,
      },
      timeout: 8000,
    },
  );

  return res.data;
};

const decodeRouteCoords = (route) => {
  if (!route?.geometry) {
    return [];
  }

  return polyline.decode(route.geometry).map(([lat, lng]) => [lat, lng]);
};

const buildRouteSummary = (route, routeResponse) => ({
  distanceKm: (route.summary?.distance || 0) / 1000,
  durationMinutes: (route.summary?.duration || 0) / 60,
  safetyScore:
    route.safety_score == null ? null : Number(route.safety_score),
  safetyContext: route.safety_context || null,
  pollutionScore:
    route.pollution_score == null ? null : Number(route.pollution_score),
  pollutionContext: route.pollution_context || null,
  trafficScore:
    route.traffic_score == null ? null : Number(route.traffic_score),
  trafficContext: route.traffic_context || null,
  routeSelection: {
    selectedForSafety: Boolean(route.selected_for_safety),
    selectionReason: route.selection_reason || null,
    alternativesReturned:
      routeResponse?.metadata?.alternatives_returned ?? null,
    safestRouteEnabled: Boolean(
      routeResponse?.metadata?.safest_route_enabled,
    ),
    safestRouteFallback:
      routeResponse?.metadata?.safest_route_fallback || null,
    selectedForPollution: Boolean(route.selected_for_pollution),
    lowPollutionRouteEnabled: Boolean(
      routeResponse?.metadata?.low_pollution_route_enabled,
    ),
    lowPollutionRouteFallback:
      routeResponse?.metadata?.low_pollution_route_fallback || null,
    selectedForTraffic: Boolean(route.selected_for_traffic),
    trafficRouteEnabled: Boolean(
      routeResponse?.metadata?.traffic_route_enabled,
    ),
    trafficRouteFallback:
      routeResponse?.metadata?.traffic_route_fallback || null,
    selectedForCombinedEnvironment: Boolean(
      route.selected_for_combined_environment,
    ),
    combinedEnvironmentRouteEnabled: Boolean(
      routeResponse?.metadata?.combined_environment_route_enabled,
    ),
    selectedRouteStrategy:
      routeResponse?.metadata?.selected_route_strategy || null,
  },
});

const parseRouteDetails = (routeResponse) => {
  const routes = routeResponse?.routes || [];
  const route = routes[0];
  const secondaryRoute = routes[1];

  if (!route?.geometry) {
    throw new Error("Route data is unavailable for this travel mode.");
  }

  return {
    coords: decodeRouteCoords(route),
    secondaryCoords: decodeRouteCoords(secondaryRoute),
    summary: buildRouteSummary(route, routeResponse),
    secondarySummary: secondaryRoute
      ? buildRouteSummary(secondaryRoute, routeResponse)
      : null,
  };
};

const getSavedSearch = () => {
  try {
    const savedSearch = localStorage.getItem(LAST_SEARCH_STORAGE_KEY);

    if (!savedSearch) {
      return null;
    }

    const parsedSearch = JSON.parse(savedSearch);

    if (!Array.isArray(parsedSearch.coordinates) && !parsedSearch.label) {
      return null;
    }

    return parsedSearch;
  } catch (error) {
    console.error("Unable to read saved search:", error);
    return null;
  }
};

const MapView = () => {
  const savedSearch = getSavedSearch();
  const isFirstSafetyEffect = useRef(true);
  const routeRequestIdRef = useRef(0);
  const previousNavigationPositionRef = useRef(null);

  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [panelHeight, setPanelHeight] = useState(200);
  const [isBottomPanelCollapsed, setIsBottomPanelCollapsed] = useState(false);
  const [dragSidebar, setDragSidebar] = useState(false);
  const [dragPanel, setDragPanel] = useState(false);
  const [routeCoords, setRouteCoords] = useState([]);
  const [secondaryRouteCoords, setSecondaryRouteCoords] = useState([]);
  const [navigationActive, setNavigationActive] = useState(false);
  const [navigationPosition, setNavigationPosition] = useState(null);
  const [navigationHeading, setNavigationHeading] = useState(0);
  const [user, setUser] = useState(null);
  const [routeSummaries, setRouteSummaries] = useState({
    car: null,
    bike: null,
    walk: null,
  });
  const [secondaryRouteSummaries, setSecondaryRouteSummaries] = useState({
    car: null,
    bike: null,
    walk: null,
  });
  const [routeDataByMode, setRouteDataByMode] = useState({
    car: null,
    bike: null,
    walk: null,
  });
  const [secondaryRouteDataByMode, setSecondaryRouteDataByMode] = useState({
    car: null,
    bike: null,
    walk: null,
  });
  const [routeLoading, setRouteLoading] = useState(false);
  const [selectedRouteOption, setSelectedRouteOption] = useState("preferred");
  const [mode, setMode] = useState("car");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [searchQuery, setSearchQuery] = useState(savedSearch?.label || "");
  const [searchPosition, setSearchPosition] = useState(
    Array.isArray(savedSearch?.coordinates) ? savedSearch.coordinates : null,
  );
  const [searchLabel, setSearchLabel] = useState(savedSearch?.label || "");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchBounds, setSearchBounds] = useState(
    Array.isArray(savedSearch?.coordinates) ? savedSearch?.bounds || null : null,
  );
  const [searchOutline, setSearchOutline] = useState(
    Array.isArray(savedSearch?.coordinates) ? savedSearch?.geojson || null : null,
  );
  const [startPosition, setStartPosition] = useState(null);
  const [endPosition, setEndPosition] = useState(null);
  const [mapFocusPosition, setMapFocusPosition] = useState(
    savedSearch?.coordinates || defaultCenter,
  );
  const [hoveredPlace, setHoveredPlace] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [selectedPlacePosition, setSelectedPlacePosition] = useState(null);
  const [placeDetailsLoading, setPlaceDetailsLoading] = useState(false);
  const [placeDetailsError, setPlaceDetailsError] = useState("");
  const [showChatbot, setShowChatbot] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [filters, setFilters] = useState({
    safest: true,
    pollution: false,
    traffic: false,
  });

  const buildBounds = (boundingbox) => {
    if (!Array.isArray(boundingbox) || boundingbox.length !== 4) {
      return null;
    }

    const [south, north, west, east] = boundingbox.map(parseFloat);
    return [
      [south, west],
      [north, east],
    ];
  };

  const getCurrentLocation = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported in this browser."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve([pos.coords.latitude, pos.coords.longitude]);
        },
        () => reject(new Error("Unable to get your current location.")),
      );
    });

  const getPlaceDetails = async (place, includeGeometry = true) => {
    const trimmedPlace = place.trim();

    if (!trimmedPlace) {
      throw new Error("Please enter a location.");
    }

    if (trimmedPlace.toLowerCase() === "my location") {
      const currentLocation = await getCurrentLocation();

      return {
        coordinates: currentLocation,
        bounds: null,
        geojson: null,
        label: "My Location",
      };
    }

    const cacheKey = trimmedPlace.toLowerCase();
    let results;

    if (!includeGeometry && directionsGeocodeCache.has(cacheKey)) {
      results = directionsGeocodeCache.get(cacheKey);
    } else {
      results = await geocodePlaceWithNominatim(trimmedPlace, includeGeometry);

      if (!includeGeometry) {
        directionsGeocodeCache.set(cacheKey, results);
      }
    }

    if (!results?.length) {
      throw new Error(`No results found for "${trimmedPlace}".`);
    }

    const result =
      results.find(
        (item) =>
          item.geojson &&
          (item.type === "administrative" ||
            item.class === "boundary" ||
            item.class === "place"),
      ) ||
      results.find((item) => item.geojson) ||
      results.find((item) => item.boundingbox) ||
      results[0];

    return {
      coordinates: [parseFloat(result.lat), parseFloat(result.lon)],
      bounds: buildBounds(result.boundingbox),
      geojson: result.geojson || null,
      label: result.display_name || trimmedPlace,
    };
  };

  const getCoordinates = async (place) => {
    const details = await getPlaceDetails(place, false);
    return details.coordinates;
  };

  const getRouteRequest = (activeFilters) =>
    activeFilters.pollution && !activeFilters.traffic ? getLowPollutionRoute : getRoute;

  const getHeadingBetweenPositions = (fromPosition, toPosition) => {
    if (!fromPosition || !toPosition) {
      return 0;
    }

    const [fromLat, fromLng] = fromPosition.map((value) => value * Math.PI / 180);
    const [toLat, toLng] = toPosition.map((value) => value * Math.PI / 180);
    const deltaLng = toLng - fromLng;
    const y = Math.sin(deltaLng) * Math.cos(toLat);
    const x =
      Math.cos(fromLat) * Math.sin(toLat) -
      Math.sin(fromLat) * Math.cos(toLat) * Math.cos(deltaLng);

    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  };

  const stopNavigation = () => {
    setNavigationActive(false);
    setNavigationPosition(null);
    setNavigationHeading(0);
    previousNavigationPositionRef.current = null;
  };

  const fetchRoute = async (
    preferredMode = mode,
    preserveExistingModes = false,
  ) => {
    let requestId = null;

    try {
      if (!from || !to) {
        alert("Please enter both locations");
        return;
      }

      requestId = ++routeRequestIdRef.current;
      stopNavigation();
      setRouteLoading(true);

      const [start, end] = await Promise.all([
        getCoordinates(from),
        getCoordinates(to),
      ]);

      setStartPosition(start);
      setEndPosition(end);
      setMapFocusPosition(start);

      const coordinates = [
        [start[1], start[0]],
        [end[1], end[0]],
      ];
      const requestRoute = getRouteRequest(filters);
      const routeResponses = await Promise.allSettled(
        [preferredMode].map(async (travelMode) => {
          const response = await requestRoute(coordinates, travelMode, filters);

          return {
            mode: travelMode,
            ...parseRouteDetails(response.data),
          };
        }),
      );

      const nextRouteDataByMode = preserveExistingModes
        ? { ...routeDataByMode }
        : { car: null, bike: null, walk: null };
      const nextSecondaryRouteDataByMode = preserveExistingModes
        ? { ...secondaryRouteDataByMode }
        : { car: null, bike: null, walk: null };
      const nextRouteSummaries = preserveExistingModes
        ? { ...routeSummaries }
        : { car: null, bike: null, walk: null };
      const nextSecondaryRouteSummaries = preserveExistingModes
        ? { ...secondaryRouteSummaries }
        : { car: null, bike: null, walk: null };

      routeResponses.forEach((result) => {
        if (result.status !== "fulfilled") {
          return;
        }

        nextRouteDataByMode[result.value.mode] = result.value.coords;
        nextSecondaryRouteDataByMode[result.value.mode] =
          result.value.secondaryCoords;
        nextRouteSummaries[result.value.mode] = result.value.summary;
        nextSecondaryRouteSummaries[result.value.mode] =
          result.value.secondarySummary;
      });

      const activeRoute =
        nextRouteDataByMode[preferredMode] ||
        nextRouteDataByMode.car ||
        nextRouteDataByMode.bike ||
        nextRouteDataByMode.walk;

      if (!activeRoute) {
        // Extract the actual error from the failed requests to provide a better alert
        const firstFailure = routeResponses.find((r) => r.status === "rejected");
        throw new Error(getRouteFailureMessage(firstFailure));
      }

      if (requestId !== routeRequestIdRef.current) {
        return;
      }

      setRouteDataByMode(nextRouteDataByMode);
      setSecondaryRouteDataByMode(nextSecondaryRouteDataByMode);
      setRouteSummaries(nextRouteSummaries);
      setSecondaryRouteSummaries(nextSecondaryRouteSummaries);
      setRouteCoords(activeRoute);
      setSecondaryRouteCoords(
        nextSecondaryRouteDataByMode[preferredMode] || [],
      );
      setSelectedRouteOption("preferred");
    } catch (error) {
      if (requestId !== routeRequestIdRef.current) {
        return;
      }

      console.error("Routing error:", error);
      alert(error.message || "Unable to fetch the route.");
      clearRoutePreview();
    } finally {
      if (requestId === routeRequestIdRef.current) {
        setRouteLoading(false);
      }
    }
  };

  const clearRoutePreview = () => {
    routeRequestIdRef.current += 1;
    setRouteCoords([]);
    setSecondaryRouteCoords([]);
    stopNavigation();
    setRouteSummaries({
      car: null,
      bike: null,
      walk: null,
    });
    setSecondaryRouteSummaries({
      car: null,
      bike: null,
      walk: null,
    });
    setRouteDataByMode({
      car: null,
      bike: null,
      walk: null,
    });
    setSecondaryRouteDataByMode({
      car: null,
      bike: null,
      walk: null,
    });
    setRouteLoading(false);
    setSelectedRouteOption("preferred");
    setStartPosition(null);
    setEndPosition(null);
  };

  const clearDashboardMapState = () => {
    clearRoutePreview();
    setSearchQuery("");
    setSearchPosition(null);
    setSearchLabel("");
    setSearchBounds(null);
    setSearchOutline(null);
    setHoveredPlace(null);
    setSelectedPlace(null);
    setSelectedPlacePosition(null);
    setPlaceDetailsError("");
    setPlaceDetailsLoading(false);
    setMapFocusPosition(defaultCenter);
    localStorage.removeItem(LAST_SEARCH_STORAGE_KEY);
  };

  const runSearch = async (query) => {
    try {
      const trimmedQuery = query.trim();

      if (!trimmedQuery) {
        throw new Error("Please enter a location.");
      }

      setSearchLoading(true);
      clearRoutePreview();
      setHoveredPlace(null);
      setSelectedPlace(null);
      setSelectedPlacePosition(null);
      setPlaceDetailsError("");
      setPlaceDetailsLoading(false);

      const placeDetails = await getPlaceDetails(trimmedQuery);

      setSearchPosition(placeDetails.coordinates);
      setSearchQuery(trimmedQuery);
      setSearchLabel(placeDetails.label);
      setSearchBounds(placeDetails.bounds);
      setSearchOutline(placeDetails.geojson);
      setMapFocusPosition(placeDetails.coordinates);
      setSelectedPlacePosition(placeDetails.coordinates);
      setShowSidebar(false);
      setFrom("");
      setTo("");

      localStorage.setItem(
        LAST_SEARCH_STORAGE_KEY,
        JSON.stringify(placeDetails),
      );

      setPlaceDetailsLoading(true);
      setPlaceDetailsError("");

      try {
        const data = await fetchPlaceDetails(placeDetails.label);
        setSelectedPlace(data);
      } catch (detailsError) {
        console.error("Place details error:", detailsError);
        setSelectedPlace({
          name: placeDetails.label,
          description: "Place details are not available right now.",
          images: [],
        });
        setPlaceDetailsError(
          detailsError.message || "Unable to fetch place details.",
        );
      } finally {
        setPlaceDetailsLoading(false);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSelectedPlace(null);
      setSelectedPlacePosition(null);
      alert(error.message || "Unable to find that location.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    await runSearch(searchQuery);
  };

  const handleVoiceSearch = async (query) => {
    setSearchQuery(query);
    await runSearch(query);
  };

  const handleDirectionsFromSearch = () => {
    setSelectedPlace(null);
    setSelectedPlacePosition(null);
    setPlaceDetailsError("");
    setPlaceDetailsLoading(false);

    if (showSidebar) {
      setShowSidebar(false);
      return;
    }

    const destination = searchQuery.trim() || searchLabel;

    setShowSidebar(true);
    setFrom("My Location");

    if (destination) {
      setTo(destination);
    }
  };

  const handleMouseMove = (e) => {
    if (dragSidebar) {
      const width = e.clientX;
      if (width > 220 && width < 500) {
        setSidebarWidth(width);
      }
    }

    if (dragPanel) {
      const height = window.innerHeight - e.clientY;
      if (height > 120 && height < 400) {
        setIsBottomPanelCollapsed(false);
        setPanelHeight(height);
      }
    }
  };

  const handleMouseUp = () => {
    setDragSidebar(false);
    setDragPanel(false);
  };

  const handleSwapLocations = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
  };

  const handleModeChange = (nextMode) => {
    stopNavigation();
    setMode(nextMode);

    if (routeDataByMode[nextMode]) {
      setRouteCoords(routeDataByMode[nextMode]);
      setSecondaryRouteCoords(secondaryRouteDataByMode[nextMode] || []);
      setSelectedRouteOption(
        selectedRouteOption === "secondary" && secondaryRouteDataByMode[nextMode]?.length
          ? "secondary"
          : "preferred",
      );
      return;
    }

    if (from && to && routeCoords.length) {
      fetchRoute(nextMode, true);
    }
  };

  const handleFilterToggle = (filterName) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [filterName]: !currentFilters[filterName],
    }));
  };

  const handleClearFilters = () => {
    stopNavigation();
    setSelectedRouteOption("preferred");
    setFilters({
      safest: false,
      pollution: false,
      traffic: false,
    });
  };

  const handleRouteOptionSelect = (routeOption) => {
    setSelectedRouteOption(routeOption);
    setShowSidebar(true);
    setIsBottomPanelCollapsed(false);
    setSelectedPlace(null);
    setSelectedPlacePosition(null);
  };

  const handleStartNavigation = () => {
    const activeRouteCoords =
      selectedRouteOption === "secondary" && secondaryRouteCoords.length
        ? secondaryRouteCoords
        : routeCoords;

    if (!activeRouteCoords.length) {
      alert("Find directions first, then start navigation.");
      return;
    }

    const initialPosition = currentLocation || startPosition || activeRouteCoords[0];

    previousNavigationPositionRef.current = initialPosition;
    setNavigationPosition(initialPosition);
    setMapFocusPosition(initialPosition);
    setNavigationActive(true);
    setShowSidebar(false);
    setSelectedPlace(null);
    setSelectedPlacePosition(null);
  };

  const fetchPlaceDetails = async (place) => {
    const res = await fetch(`/api/place-details?q=${encodeURIComponent(place)}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Unable to fetch place details.");
    }

    return data;
  };

  const handlePlaceClick = async (place) => {
    setSelectedPlacePosition(place.position || searchPosition);
    setPlaceDetailsLoading(true);
    setPlaceDetailsError("");
    setSelectedPlace({
      name: place.name,
      description: "Fetching place details...",
      images: [],
    });

    try {
      const data = await fetchPlaceDetails(place.name);
      setSelectedPlace(data);
    } catch (err) {
      console.error(err);
      setSelectedPlace(null);
      setPlaceDetailsError(err.message || "Unable to fetch place details.");
    } finally {
      setPlaceDetailsLoading(false);
    }
  };

  const handleCloseSelectedPlace = () => {
    setSelectedPlace(null);
    setSelectedPlacePosition(null);
    setPlaceDetailsError("");
    setPlaceDetailsLoading(false);
  };

  const handleChatbotPlaceSelect = async (place) => {
    const latitude = Number(place.latitude);
    const longitude = Number(place.longitude);
    const position =
      Number.isFinite(latitude) && Number.isFinite(longitude)
        ? [latitude, longitude]
        : mapFocusPosition;

    setSelectedPlacePosition(position);
    setMapFocusPosition(position);
    setHoveredPlace(null);
    setPlaceDetailsError("");
    setPlaceDetailsLoading(true);
    setSelectedPlace({
      name: place.name,
      description: place.description || "Fetching place details...",
      distance_km: place.distance_km,
      images: [],
    });

    try {
      const data = await fetchPlaceDetails(place.name);
      setSelectedPlace({
        ...data,
        distance_km: place.distance_km ?? data.distance_km,
      });
    } catch (err) {
      console.error(err);
      setPlaceDetailsError(err.message || "Unable to fetch place details.");
    } finally {
      setPlaceDetailsLoading(false);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await getCurrentUser();
        setUser(response.data.user);
      } catch {
        console.log("Not logged in or session expired");
        setUser(null);
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    if(!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation([
          position.coords.latitude,
          position.coords.longitude,
        ]);
      },
      (error) => {
        console.error("Location error:", error);
      }
    );
  }, []);

  useEffect(() => {
    if (!navigationActive || !navigator.geolocation) {
      return undefined;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const nextPosition = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        const previousPosition = previousNavigationPositionRef.current;

        if (previousPosition) {
          setNavigationHeading(
            getHeadingBetweenPositions(previousPosition, nextPosition),
          );
        }

        previousNavigationPositionRef.current = nextPosition;
        setCurrentLocation(nextPosition);
        setNavigationPosition(nextPosition);
        setMapFocusPosition(nextPosition);
      },
      (error) => {
        console.error("Navigation location error:", error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000,
      },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [navigationActive]);

  useEffect(() => {
    if (isFirstSafetyEffect.current) {
      isFirstSafetyEffect.current = false;
      return;
    }

    if (!from || !to || !routeCoords.length) {
      return;
    }

    routeRequestIdRef.current += 1;
    const filterRefreshTimer = window.setTimeout(() => {
      fetchRoute(mode);
    }, 150);

    return () => window.clearTimeout(filterRefreshTimer);
    // Re-run only when route preference filters change; route inputs are read from current state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.safest, filters.pollution, filters.traffic]);

  return (
    <div
      className="map-container"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <MapSidebar
        fetchRoute={fetchRoute}
        filters={filters}
        from={from}
        onClearFilters={handleClearFilters}
        onFilterToggle={handleFilterToggle}
        onSwapLocations={handleSwapLocations}
        setFrom={setFrom}
        setTo={setTo}
        showSidebar={showSidebar && !navigationActive}
        sidebarWidth={sidebarWidth}
        to={to}
        user={user}
      />

      {showSidebar && !navigationActive && (
        <div
          className="resize-handle"
          onMouseDown={() => setDragSidebar(true)}
        />
      )}

      <div className="map-area">
        <MapSearchBar
          onDirectionsClick={() => {
            if (!navigationActive) {
              handleDirectionsFromSearch();
            }
          }}
          onMenuClick={() => {
            if (!navigationActive) {
              clearDashboardMapState();
              setShowSidebar(!showSidebar);
            }
          }}
          onSearch={handleSearch}
          onSearchChange={setSearchQuery}
          onVoiceSearch={handleVoiceSearch}
          searchLoading={searchLoading}
          searchQuery={searchQuery}
          showSidebar={showSidebar && !navigationActive}
        />

        <MapCanvas
          endLabel={to}
          endPosition={endPosition}
          handlePlaceClick={handlePlaceClick}
          hasSelectedPlace={Boolean(selectedPlace)}
          mapFocusPosition={mapFocusPosition}
          onCloseSelectedPlace={handleCloseSelectedPlace}
          onExitNavigation={stopNavigation}
          onOpenChatbot={() => setShowChatbot(true)}
          onRouteOptionSelect={handleRouteOptionSelect}
          navigationActive={navigationActive}
          navigationHeading={navigationHeading}
          navigationMode={mode}
          navigationPosition={navigationPosition}
          panelHeight={isBottomPanelCollapsed ? 0 : panelHeight}
          routeCoords={routeCoords}
          selectedRouteOption={selectedRouteOption}
          secondaryRouteCoords={secondaryRouteCoords}
          searchBounds={searchBounds}
          searchLabel={searchLabel}
          searchOutline={searchOutline}
          searchPosition={searchPosition}
          setHoveredPlace={setHoveredPlace}
          showSidebar={showSidebar && !navigationActive}
          startLabel={from}
          startPosition={startPosition}
        />

        {showChatbot && (
          <Chatbot
            locationLabel="My Current Location"
            mapPosition={currentLocation || mapFocusPosition}
            onClose={() => setShowChatbot(false)}
            onPlaceSelect={handleChatbotPlaceSelect}
          />
        )}

        {hoveredPlace && !selectedPlace && (
          <PlaceHoverCard
            place={hoveredPlace}
            onViewMore={() => handlePlaceClick(hoveredPlace)}
          />
        )}

        {selectedPlacePosition && selectedPlace && (
          <PlaceHoverCard
            detailMode
            error={placeDetailsError}
            loading={placeDetailsLoading}
            onClose={handleCloseSelectedPlace}
            place={selectedPlace}
          />
        )}

        <MapBottomPanel
          filters={filters}
          isCollapsed={isBottomPanelCollapsed}
          mode={mode}
          navigationActive={navigationActive}
          onModeChange={handleModeChange}
          onResizeStart={() => {
            setIsBottomPanelCollapsed(false);
            setDragPanel(true);
          }}
          onStartNavigation={handleStartNavigation}
          onToggleCollapse={() => setIsBottomPanelCollapsed((isCollapsed) => !isCollapsed)}
          panelHeight={panelHeight}
          place={selectedPlace}
          routeLoading={routeLoading}
          routeOption={selectedRouteOption}
          routeSummaries={routeSummaries}
          secondaryRouteSummaries={secondaryRouteSummaries}
          showSidebar={showSidebar && !navigationActive}
        />
      </div>
    </div>
  );
};

export default MapView;
