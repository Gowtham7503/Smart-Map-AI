import { useEffect } from "react";
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

const MapViewportController = ({ focusBounds, focusPosition, routeCoords }) => {
  const map = useMap();

  useEffect(() => {
    if (routeCoords.length > 0) {
      map.flyToBounds(routeCoords, {
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

    if (focusPosition) {
      map.flyTo(focusPosition, 15, {
        duration: 1,
      });
    }
  }, [focusBounds, focusPosition, map, routeCoords]);

  return null;
};

const MapCanvas = ({
  endPosition,
  handlePlaceClick,
  hasSelectedPlace,
  mapFocusPosition,
  onCloseSelectedPlace,
  onOpenChatbot,
  panelHeight,
  routeCoords,
  searchBounds,
  searchLabel,
  searchOutline,
  searchPosition,
  setHoveredPlace,
  showSidebar,
  startPosition,
  startLabel,
  endLabel,
}) => {
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
      className="leaflet-map"
    >
      <EnableZoom />
      <MapControls
        bottomOffset={showSidebar ? panelHeight : 0}
        hasSelectedPlace={hasSelectedPlace}
        onCloseSelectedPlace={onCloseSelectedPlace}
        onOpenChatbot={onOpenChatbot}
      />
      <MapViewportController
        focusPosition={mapFocusPosition}
        routeCoords={routeCoords}
        focusBounds={searchBounds}
      />

      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
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

      {routeCoords.length > 0 && (
        <Polyline
          key={JSON.stringify(routeCoords)}
          positions={routeCoords}
          pathOptions={{
            color: "#2ecc71",
            weight: 6,
            opacity: 1,
          }}
        />
      )}
    </MapContainer>
  );
};

export default MapCanvas;
