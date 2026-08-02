import { useEffect, useMemo } from "react";
import {
  GeoJSON,
  MapContainer,
  Marker,
  Popup,
  Polyline,
  Rectangle,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const EnableZoom = () => {
  const map = useMap();

  useEffect(() => {
    map.scrollWheelZoom.enable();
  }, [map]);

  return null;
};

const MapControls = ({
  bottomOffset,
  hasSelectedPlace,
  onCloseSelectedPlace,
  onOpenChatbot,
}) => {
  const map = useMap();

  const handleLocate = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      map.setView([latitude, longitude], 15);
    });
  };

  return (
    <>
      <div className="map-controls">
        <button
          className="map-btn chatbot-btn"
          onClick={onOpenChatbot}
          type="button"
          aria-label="Open chatbot"
        >
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none">
            <defs>
              <linearGradient id="chatbotIconGradient" x1="4" y1="6" x2="20" y2="20" gradientUnits="userSpaceOnUse">
                <stop stopColor="#60A5FA" />
                <stop offset="0.5" stopColor="#A78BFA" />
                <stop offset="1" stopColor="#34D399" />
              </linearGradient>
            </defs>
            <path
              d="M8 18.5c-2.761 0-5-2.015-5-4.5s2.239-4.5 5-4.5h8c2.761 0 5 2.015 5 4.5s-2.239 4.5-5 4.5h-4.5L8 21v-2.5z"
              stroke="url(#chatbotIconGradient)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9 13h.01M12 13h.01M15 13h.01"
              stroke="url(#chatbotIconGradient)"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <button className="map-btn" type="button" aria-label="Map filters">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
            <path
              d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path d="M9 4v14M15 6v14" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
      </div>

      <div className="map-controls-bottom" style={{ bottom: bottomOffset + 12 }}>
        {hasSelectedPlace && (
          <button
            className="control-btn"
            onClick={onCloseSelectedPlace}
            type="button"
            aria-label="Back to route details"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
              <path
                d="M14.5 5.5L8 12l6.5 6.5"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}

        <button className="control-btn" onClick={handleLocate}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
            <path
              d="M12 21s-6-5.5-6-10a6 6 0 1 1 12 0c0 4.5-6 10-6 10z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="11" r="2" fill="currentColor" />
          </svg>
        </button>

        <button className="control-btn" onClick={() => map.zoomIn()}>
          +
        </button>

        <button className="control-btn" onClick={() => map.zoomOut()}>
          −
        </button>
      </div>
    </>
  );
};

const MapViewportController = ({
  focusActive,
  focusBounds,
  focusPosition,
  navigationActive,
  navigationPosition,
  routeCoords,
  secondaryRouteCoords,
}) => {
  const map = useMap();

  useEffect(() => {
    if (navigationActive && navigationPosition) {
      map.flyTo(navigationPosition, 18, {
        duration: 0.7,
      });
      return;
    }

    if (routeCoords.length > 0) {
      const routeBounds =
        secondaryRouteCoords.length > 0
          ? [...routeCoords, ...secondaryRouteCoords]
          : routeCoords;

      map.flyToBounds(routeBounds, {
        padding: [60, 60],
        duration: 1,
      });
      return;
    }

    if (focusBounds) {
      map.flyToBounds(focusBounds, {
        padding: [60, 60],
        duration: 1,
      });
      return;
    }

    if (focusActive && focusPosition) {
      map.flyTo(focusPosition, 15, {
        duration: 1,
      });
    }
  }, [
    focusBounds,
    focusActive,
    focusPosition,
    map,
    navigationActive,
    navigationPosition,
    routeCoords,
    secondaryRouteCoords,
  ]);

  return null;
};

const getNavigationLabel = (mode) => {
  if (mode === "bike") {
    return "Bike";
  }

  if (mode === "walk") {
    return "Walking";
  }

  return "Vehicle";
};

const getTrafficHotspotLevel = (hotspot) => {
  if (hotspot?.road_closure || hotspot?.congestion >= 0.65) {
    return "heavy";
  }

  if (hotspot?.congestion >= 0.35) {
    return "moderate";
  }

  return "slow";
};

const getTrafficHotspotStyle = (hotspot) => {
  const level = getTrafficHotspotLevel(hotspot);

  if (level === "heavy") {
    return {
      color: "#b91c1c",
      weight: 9,
    };
  }

  if (level === "moderate") {
    return {
      color: "#c2410c",
      weight: 8,
    };
  }

  return {
    color: "#a16207",
    weight: 7,
  };
};

const getTrafficHotspotLabel = (hotspot) => {
  if (hotspot?.road_closure) {
    return "Road closure reported";
  }

  const congestionPercent = Math.round((hotspot?.congestion || 0) * 100);

  if (hotspot?.estimated) {
    return `Route average traffic slowdown: ${congestionPercent}%`;
  }

  return `${congestionPercent}% traffic slowdown`;
};

const getDistanceScore = (point, latitude, longitude) => {
  const [pointLatitude, pointLongitude] = point;
  return (
    (pointLatitude - latitude) ** 2 +
    (pointLongitude - longitude) ** 2
  );
};

const getNearestRouteIndex = (routeCoords, hotspot) => {
  const latitude = Number(hotspot.latitude);
  const longitude = Number(hotspot.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return -1;
  }

  let nearestIndex = -1;
  let nearestScore = Infinity;

  routeCoords.forEach((point, index) => {
    const score = getDistanceScore(point, latitude, longitude);

    if (score < nearestScore) {
      nearestScore = score;
      nearestIndex = index;
    }
  });

  return nearestIndex;
};

const buildTrafficSegments = (routeCoords, trafficHotspots) => {
  if (!routeCoords.length || !trafficHotspots.length) {
    return [];
  }

  const segmentRadius = Math.max(2, Math.ceil(routeCoords.length / 80));

  return trafficHotspots
    .map((hotspot, index) => {
      const nearestIndex = getNearestRouteIndex(routeCoords, hotspot);

      if (nearestIndex < 0) {
        return null;
      }

      const startIndex = Math.max(0, nearestIndex - segmentRadius);
      const endIndex = Math.min(routeCoords.length - 1, nearestIndex + segmentRadius);
      const positions = routeCoords.slice(startIndex, endIndex + 1);

      if (positions.length < 2) {
        return null;
      }

      return {
        endIndex,
        hotspot,
        id: `${nearestIndex}-${index}`,
        positions,
        startIndex,
      };
    })
    .filter(Boolean);
};

const buildBaseRouteSegments = (routeCoords, trafficSegments) => {
  if (!routeCoords.length) {
    return [];
  }

  if (!trafficSegments.length) {
    return [
      {
        id: "full",
        positions: routeCoords,
      },
    ];
  }

  const mergedTrafficRanges = trafficSegments
    .map((segment) => ({
      startIndex: segment.startIndex,
      endIndex: segment.endIndex,
    }))
    .sort((first, second) => first.startIndex - second.startIndex)
    .reduce((ranges, range) => {
      const previousRange = ranges[ranges.length - 1];

      if (!previousRange || range.startIndex > previousRange.endIndex + 1) {
        ranges.push({ ...range });
        return ranges;
      }

      previousRange.endIndex = Math.max(previousRange.endIndex, range.endIndex);
      return ranges;
    }, []);

  const baseSegments = [];
  let startIndex = 0;

  mergedTrafficRanges.forEach((range, index) => {
    if (range.startIndex - startIndex >= 1) {
      baseSegments.push({
        id: `base-${index}`,
        positions: routeCoords.slice(startIndex, range.startIndex + 1),
      });
    }

    startIndex = range.endIndex;
  });

  if (routeCoords.length - 1 - startIndex >= 1) {
    baseSegments.push({
      id: "base-end",
      positions: routeCoords.slice(startIndex),
    });
  }

  return baseSegments;
};

const MapCanvas = ({
  endPosition,
  handlePlaceClick,
  hasSelectedPlace,
  mapFocusPosition,
  mapFocusActive = false,
  navigationActive,
  navigationHeading = 0,
  navigationMode,
  navigationPosition,
  onCloseSelectedPlace,
  onExitNavigation,
  onOpenChatbot,
  onRouteOptionSelect,
  panelHeight,
  routeCoords,
  selectedRouteOption = "preferred",
  secondaryRouteCoords = [],
  searchBounds,
  searchLabel,
  searchOutline,
  searchPosition,
  setHoveredPlace,
  showSidebar,
  startPosition,
  startLabel,
  endLabel,
  trafficHotspots = [],
  showTrafficHotspots = false,
  theme = "bright",
}) => {
  const tileLayerUrl =
    theme === "dark"
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
  const activeRouteCoords =
    selectedRouteOption === "secondary" && secondaryRouteCoords.length
      ? secondaryRouteCoords
      : routeCoords;
  const trafficSegments = buildTrafficSegments(activeRouteCoords, trafficHotspots);
  const preferredRouteSegments =
    showTrafficHotspots && selectedRouteOption === "preferred"
      ? buildBaseRouteSegments(routeCoords, trafficSegments)
      : buildBaseRouteSegments(routeCoords, []);
  const secondaryRouteSegments =
    showTrafficHotspots && selectedRouteOption === "secondary"
      ? buildBaseRouteSegments(secondaryRouteCoords, trafficSegments)
      : buildBaseRouteSegments(secondaryRouteCoords, []);
  const navigationIcon = useMemo(
    () =>
      L.divIcon({
        className: "navigation-vehicle-icon",
        html: `
          <div class="navigation-vehicle-marker ${navigationMode || "car"}" style="--vehicle-heading: ${navigationHeading}deg">
            <span class="navigation-vehicle-arrow"></span>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      }),
    [navigationHeading, navigationMode],
  );

  const renderInteractiveMarker = (place, popupLabel) => (
    <Marker
      position={place.position}
      eventHandlers={{
        mouseover: () => setHoveredPlace(place),
        mouseout: () => setHoveredPlace(null),
        click: () => handlePlaceClick(place),
      }}
    >
      <Popup>{popupLabel}</Popup>
    </Marker>
  );

  return (
    <MapContainer
      center={mapFocusPosition}
      zoom={12}
      zoomControl={false}
      className={`leaflet-map ${navigationActive ? "navigation-map-3d" : ""}`}
    >
      <EnableZoom />
      <MapControls
        bottomOffset={showSidebar ? panelHeight : 0}
        hasSelectedPlace={hasSelectedPlace}
        onCloseSelectedPlace={onCloseSelectedPlace}
        onOpenChatbot={onOpenChatbot}
      />
      <MapViewportController
        focusActive={mapFocusActive}
        focusPosition={mapFocusPosition}
        navigationActive={navigationActive}
        navigationPosition={navigationPosition}
        routeCoords={routeCoords}
        secondaryRouteCoords={secondaryRouteCoords}
        focusBounds={searchBounds}
      />

      <TileLayer
        url={tileLayerUrl}
        attribution="&copy; OpenStreetMap &copy; CartoDB"
      />

      {startPosition &&
        renderInteractiveMarker(
          {
            name: startLabel || "Start",
            category: "Route point",
            position: startPosition,
          },
          startLabel || "Start",
        )}

      {endPosition &&
        renderInteractiveMarker(
          {
            name: endLabel || "Destination",
            category: "Route point",
            position: endPosition,
          },
          endLabel || "Destination",
        )}

      {searchPosition &&
        renderInteractiveMarker(
          {
            name: searchLabel || "Searched location",
            category: "Location",
            position: searchPosition,
          },
          searchLabel || "Searched location",
        )}

      {searchOutline && (
        <GeoJSON
          data={searchOutline}
          style={{
            color: "#0b57d0",
            weight: 1,
            opacity: 1,
            fillOpacity: 0,
            dashArray: "10 6",
          }}
        />
      )}

      {!searchOutline && searchBounds && (
        <Rectangle
          bounds={searchBounds}
          pathOptions={{
            color: "#0b57d0",
            weight: 1,
            opacity: 1,
            fillOpacity: 0,
            dashArray: "10 6",
          }}
        />
      )}

      {secondaryRouteSegments.map((segment) => (
        <Polyline
          key={`secondary-${segment.id}`}
          positions={segment.positions}
          pathOptions={{
            color: "#16a34a",
            weight: selectedRouteOption === "secondary" ? 7 : 5,
            opacity: selectedRouteOption === "secondary" ? 1 : 0.8,
            dashArray: "1 12",
            lineCap: "round",
          }}
        >
          <Popup>Second preference route</Popup>
        </Polyline>
      ))}

      {preferredRouteSegments.map((segment) => (
        <Polyline
          key={`preferred-${segment.id}`}
          positions={segment.positions}
          pathOptions={{
            color: "#2ecc71",
            weight: selectedRouteOption === "preferred" ? 7 : 5,
            opacity: selectedRouteOption === "preferred" ? 1 : 0.65,
          }}
        >
          <Popup>Preferred route</Popup>
        </Polyline>
      ))}

      {routeCoords.length > 0 && (
        <Polyline
          key={`preferred-hit-${JSON.stringify(routeCoords)}`}
          eventHandlers={{
            click: () => onRouteOptionSelect?.("preferred"),
          }}
          positions={routeCoords}
          pathOptions={{
            color: "#000000",
            weight: 18,
            opacity: 0.01,
          }}
        />
      )}

      {secondaryRouteCoords.length > 0 && (
        <Polyline
          key={`secondary-hit-${JSON.stringify(secondaryRouteCoords)}`}
          eventHandlers={{
            click: () => onRouteOptionSelect?.("secondary"),
          }}
          positions={secondaryRouteCoords}
          pathOptions={{
            color: "#000000",
            weight: 22,
            opacity: 0.01,
          }}
        />
      )}

      {showTrafficHotspots &&
        trafficSegments.map((segment) => {
          const style = getTrafficHotspotStyle(segment.hotspot);

          return (
            <Polyline
              key={`traffic-segment-${segment.id}`}
              positions={segment.positions}
              pathOptions={{
                color: style.color,
                weight: style.weight,
                opacity: 0.95,
                lineCap: "round",
              }}
            >
              <Popup>{getTrafficHotspotLabel(segment.hotspot)}</Popup>
            </Polyline>
          );
        })}

      {navigationActive && navigationPosition && (
        <Marker
          position={navigationPosition}
          icon={navigationIcon}
          interactive={false}
          zIndexOffset={1200}
        >
          <Popup>{getNavigationLabel(navigationMode)} pointer</Popup>
        </Marker>
      )}

      {navigationActive && (
        <button
          className="exit-navigation-btn"
          onClick={onExitNavigation}
          type="button"
        >
          Exit navigation
        </button>
      )}

      {routeCoords.length > 0 && secondaryRouteCoords.length > 0 && (
        <div className="route-map-legend" aria-label="Route options">
          <span>
            <i className="route-map-legend-line preferred" />
            Preferred
          </span>
          <span>
            <i className="route-map-legend-line secondary" />
            Second option
          </span>
        </div>
      )}

      {showTrafficHotspots && trafficSegments.length > 0 && (
        <div className="traffic-map-legend" aria-label="Traffic hotspots">
          <span>
            <i className="traffic-map-dot slow" />
            Light traffic
          </span>
          <span>
            <i className="traffic-map-dot moderate" />
            Moderate traffic
          </span>
          <span>
            <i className="traffic-map-dot heavy" />
            Heavy traffic
          </span>
        </div>
      )}
    </MapContainer>
  );
};

export default MapCanvas;
