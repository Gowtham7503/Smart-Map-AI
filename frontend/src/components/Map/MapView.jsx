import { useState } from "react";
import polyline from "polyline";
import axios from "axios";
import { getRoute } from "../../services/api";
import MapBottomPanel from "./MapBottomPanel";
import MapCanvas from "./MapCanvas";
import "./Map.css";
import MapSearchBar from "./MapSearchBar";
import MapSidebar from "./MapSidebar";

const defaultCenter = [17.4948, 78.3996];
const LAST_SEARCH_STORAGE_KEY = "smartmap:last-search";

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

  const fetchRoute = async () => {
    try {
      if (!from || !to) {
        alert("Please enter both locations");
        return;
      }

      const start = await getCoordinates(from);
      const end = await getCoordinates(to);

      setStartPosition(start);
      setEndPosition(end);
      setMapFocusPosition(start);

      const response = await getRoute([
        [start[1], start[0]],
        [end[1], end[0]],
      ]);

      if (!response.data || !response.data.routes) {
        console.error("Invalid response:", response.data);
        return;
      }

      const encoded = response.data.routes[0].geometry;
      const decoded = polyline.decode(encoded);
      const formatted = decoded.map(([lat, lng]) => [lat, lng]);

      setRouteCoords([...formatted]);
    } catch (error) {
      console.error("Routing error:", error);
      alert(error.message || "Unable to fetch the route.");
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    try {
      setSearchLoading(true);

      const placeDetails = await getPlaceDetails(searchQuery);

      setSearchPosition(placeDetails.coordinates);
      setSearchLabel(placeDetails.label);
      setSearchBounds(placeDetails.bounds);
      setSearchOutline(placeDetails.geojson);
      setMapFocusPosition(placeDetails.coordinates);

      localStorage.setItem(
        LAST_SEARCH_STORAGE_KEY,
        JSON.stringify(placeDetails),
      );
    } catch (error) {
      console.error("Search error:", error);
      alert(error.message || "Unable to find that location.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleDirectionsFromSearch = () => {
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
          searchLoading={searchLoading}
          searchQuery={searchQuery}
          showSidebar={showSidebar}
        />

        <MapCanvas
          endPosition={endPosition}
          mapFocusPosition={mapFocusPosition}
          panelHeight={panelHeight}
          routeCoords={routeCoords}
          searchBounds={searchBounds}
          searchLabel={searchLabel}
          searchOutline={searchOutline}
          searchPosition={searchPosition}
          showSidebar={showSidebar}
          startPosition={startPosition}
        />

        <MapBottomPanel
          mode={mode}
          onModeChange={setMode}
          onResizeStart={() => setDragPanel(true)}
          panelHeight={panelHeight}
          showSidebar={showSidebar}
        />
      </div>
    </div>
  );
};

export default MapView;
