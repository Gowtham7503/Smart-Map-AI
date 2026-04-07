import { useState } from "react";
import polyline from "polyline";
import axios from "axios";
import { getRoute } from "../../services/api";
import MapBottomPanel from "./MapBottomPanel";
import MapCanvas from "./MapCanvas";
import PlaceHoverCard from "./PlaceHoverCard";
import "./Map.css";
import MapSearchBar from "./MapSearchBar";
import MapSidebar from "./MapSidebar";
import Chatbot from "../Chatbot/Chatbot";

const defaultCenter = [17.4948, 78.3996];
const LAST_SEARCH_STORAGE_KEY = "smartmap:last-search";
const TRAVEL_MODES = ["car", "bike", "walk"];

const parseRouteDetails = (routeResponse) => {
  const route = routeResponse?.routes?.[0];

  if (!route?.geometry) {
    throw new Error("Route data is unavailable for this travel mode.");
  }

  const decoded = polyline.decode(route.geometry);

  return {
    coords: decoded.map(([lat, lng]) => [lat, lng]),
    summary: {
      distanceKm: (route.summary?.distance || 0) / 1000,
      durationMinutes: (route.summary?.duration || 0) / 60,
    },
  };
};

const getSavedSearch = () => {
  try {
    const savedSearch = localStorage.getItem(LAST_SEARCH_STORAGE_KEY);

    if (!savedSearch) {
      return null;
    }

    const parsedSearch = JSON.parse(savedSearch);

    if (!Array.isArray(parsedSearch.coordinates)) {
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

  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [panelHeight, setPanelHeight] = useState(200);
  const [dragSidebar, setDragSidebar] = useState(false);
  const [dragPanel, setDragPanel] = useState(false);
  const [routeCoords, setRouteCoords] = useState([]);
  const [routeSummaries, setRouteSummaries] = useState({
    car: null,
    bike: null,
    walk: null,
  });
  const [routeDataByMode, setRouteDataByMode] = useState({
    car: null,
    bike: null,
    walk: null,
  });
  const [routeLoading, setRouteLoading] = useState(false);
  const [mode, setMode] = useState("car");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [searchQuery, setSearchQuery] = useState(savedSearch?.label || "");
  const [searchPosition, setSearchPosition] = useState(
    savedSearch?.coordinates || null,
  );
  const [searchLabel, setSearchLabel] = useState(savedSearch?.label || "");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchBounds, setSearchBounds] = useState(savedSearch?.bounds || null);
  const [searchOutline, setSearchOutline] = useState(
    savedSearch?.geojson || null,
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

  const getPlaceDetails = async (place) => {
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

    const res = await axios.get(
      `https://nominatim.openstreetmap.org/search?format=json&polygon_geojson=1&q=${encodeURIComponent(trimmedPlace)}`,
    );

    if (!res.data?.length) {
      throw new Error(`No results found for "${trimmedPlace}".`);
    }

    const result =
      res.data.find(
        (item) =>
          item.geojson &&
          (item.type === "administrative" ||
            item.class === "boundary" ||
            item.class === "place"),
      ) ||
      res.data.find((item) => item.geojson) ||
      res.data.find((item) => item.boundingbox) ||
      res.data[0];

    return {
      coordinates: [parseFloat(result.lat), parseFloat(result.lon)],
      bounds: buildBounds(result.boundingbox),
      geojson: result.geojson || null,
      label: result.display_name || trimmedPlace,
    };
  };

  const getCoordinates = async (place) => {
    const details = await getPlaceDetails(place);
    return details.coordinates;
  };

  const fetchRoute = async (preferredMode = mode) => {
    try {
      if (!from || !to) {
        alert("Please enter both locations");
        return;
      }

      setRouteLoading(true);

      const start = await getCoordinates(from);
      const end = await getCoordinates(to);

      setStartPosition(start);
      setEndPosition(end);
      setMapFocusPosition(start);

      const coordinates = [
        [start[1], start[0]],
        [end[1], end[0]],
      ];
      const routeResponses = await Promise.allSettled(
        TRAVEL_MODES.map(async (travelMode) => {
          const response = await getRoute(coordinates, travelMode);

          return {
            mode: travelMode,
            ...parseRouteDetails(response.data),
          };
        }),
      );

      const nextRouteDataByMode = {
        car: null,
        bike: null,
        walk: null,
      };
      const nextRouteSummaries = {
        car: null,
        bike: null,
        walk: null,
      };

      routeResponses.forEach((result) => {
        if (result.status !== "fulfilled") {
          return;
        }

        nextRouteDataByMode[result.value.mode] = result.value.coords;
        nextRouteSummaries[result.value.mode] = result.value.summary;
      });

      const activeRoute =
        nextRouteDataByMode[preferredMode] ||
        nextRouteDataByMode.car ||
        nextRouteDataByMode.bike ||
        nextRouteDataByMode.walk;

      if (!activeRoute) {
        throw new Error("Unable to fetch route details for any travel mode.");
      }

      setRouteDataByMode(nextRouteDataByMode);
      setRouteSummaries(nextRouteSummaries);
      setRouteCoords(activeRoute);
    } catch (error) {
      console.error("Routing error:", error);
      alert(error.message || "Unable to fetch the route.");
      clearRoutePreview();
    } finally {
      setRouteLoading(false);
    }
  };

  const clearRoutePreview = () => {
    setRouteCoords([]);
    setRouteSummaries({
      car: null,
      bike: null,
      walk: null,
    });
    setRouteDataByMode({
      car: null,
      bike: null,
      walk: null,
    });
    setRouteLoading(false);
    setStartPosition(null);
    setEndPosition(null);
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
    setMode(nextMode);

    if (routeDataByMode[nextMode]) {
      setRouteCoords(routeDataByMode[nextMode]);
    }
  };

  const handleFilterToggle = (filterName) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [filterName]: !currentFilters[filterName],
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      safest: false,
      pollution: false,
      traffic: false,
    });
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
        showSidebar={showSidebar}
        sidebarWidth={sidebarWidth}
        to={to}
      />

      {showSidebar && (
        <div
          className="resize-handle"
          onMouseDown={() => setDragSidebar(true)}
        />
      )}

      <div className="map-area">
        <MapSearchBar
          onDirectionsClick={handleDirectionsFromSearch}
          onSearch={handleSearch}
          onSearchChange={setSearchQuery}
          onVoiceSearch={handleVoiceSearch}
          searchLoading={searchLoading}
          searchQuery={searchQuery}
          showSidebar={showSidebar}
        />

        <MapCanvas
          endPosition={endPosition}
          handlePlaceClick={handlePlaceClick}
          mapFocusPosition={mapFocusPosition}
          onOpenChatbot={() => setShowChatbot(true)}
          panelHeight={panelHeight}
          routeCoords={routeCoords}
          searchBounds={searchBounds}
          searchLabel={searchLabel}
          searchOutline={searchOutline}
          searchPosition={searchPosition}
          setHoveredPlace={setHoveredPlace}
          showSidebar={showSidebar}
          startPosition={startPosition}
        />

        {showChatbot && <Chatbot onClose={() => setShowChatbot(false)} />}

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
            place={selectedPlace}
          />
        )}

        <MapBottomPanel
          mode={mode}
          onModeChange={handleModeChange}
          onResizeStart={() => setDragPanel(true)}
          panelHeight={panelHeight}
          place={selectedPlace}
          routeLoading={routeLoading}
          routeSummaries={routeSummaries}
          showSidebar={showSidebar}
        />
      </div>
    </div>
  );
};

export default MapView;
