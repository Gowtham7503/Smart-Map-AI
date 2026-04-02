import { useMap } from "react-leaflet";
import { useEffect } from "react";
import React, { useState } from "react";
import "./Map.css";
import polyline from "polyline";
import axios from "axios";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import { getRoute } from "../../services/api";
import "leaflet/dist/leaflet.css";

// ✅ Enable scroll zoom
const EnableZoom = () => {
  const map = useMap();

  useEffect(() => {
    map.scrollWheelZoom.enable();
  }, [map]);

  return null;
};

// ✅ Marker fix
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// 🌍 Default positions
const defaultStart = [17.4948, 78.3996];
const defaultEnd = [17.4435, 78.3772];

const MapView = () => {
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [panelHeight, setPanelHeight] = useState(200);

  const [dragSidebar, setDragSidebar] = useState(false);
  const [dragPanel, setDragPanel] = useState(false);

  const [selectedRoute, setSelectedRoute] = useState(0);
  const [routeCoords, setRouteCoords] = useState([]);

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [startPosition, setStartPosition] = useState(defaultStart);
  const [endPosition, setEndPosition] = useState(defaultEnd);

  const routes = [
    { type: "Fastest", color: "#2ecc71" },
    { type: "Safest", color: "#27ae60" },
    { type: "Eco", color: "#00b894" },
  ];

  // 🔍 Convert place → coordinates
  const getCoordinates = async (place) => {
    const res = await axios.get(
      `https://nominatim.openstreetmap.org/search?format=json&q=${place}`
    );

    return [
      parseFloat(res.data[0].lat),
      parseFloat(res.data[0].lon),
    ];
  };

  // 🚀 Fetch route
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

      setRouteCoords(formatted);

    } catch (error) {
      console.error("Routing error:", error);
    }
  };

  // 🖱 Resize handling
  const handleMouseMove = (e) => {
    if (dragSidebar) {
      const width = e.clientX;
      if (width > 220 && width < 500) setSidebarWidth(width);
    }

    if (dragPanel) {
      const height = window.innerHeight - e.clientY;
      if (height > 120 && height < 400) setPanelHeight(height);
    }
  };

  return (
    <div
      className="map-container"
      onMouseMove={handleMouseMove}
      onMouseUp={() => {
        setDragSidebar(false);
        setDragPanel(false);
      }}
    >
      {/* SIDEBAR */}
      <div className="sidebar" style={{ width: sidebarWidth }}>
        <div className="logo">
          <h2>Smart<span>Maps</span></h2>
          <p>Safe • Smart • Sustainable</p>
        </div>

        {/* ✅ FIXED FORM */}
        <form
          className="route-box"
          onSubmit={(e) => {
            e.preventDefault();
            fetchRoute();
          }}
        >
          <div className="input">
            <label>From</label>
            <input
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="Enter starting location"
            />
          </div>

          <div className="input">
            <label>To</label>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="Enter destination"
            />
          </div>

          <button type="submit" className="directions-btn">
            Get Directions
          </button>
        </form>

        {/* AI SECTION */}
        <div className="ai-section">
          <h4>Smart AI Assistant</h4>

          <button
            className="ai-btn"
            onClick={() => alert("AI Suggestions Coming Soon 🚀")}
          >
            🤖 Ask SmartMaps AI
          </button>
        </div>
      </div>

      {/* Resize Handle */}
      <div
        className="resize-handle"
        onMouseDown={() => setDragSidebar(true)}
      />

      {/* MAP */}
      <div className="map-area">
        <MapContainer
          center={startPosition}
          zoom={12}
          zoomControl={false}
          className="leaflet-map"
        >
          <EnableZoom />

          <TileLayer
            attribution="&copy; OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Marker position={startPosition}>
            <Popup>Start</Popup>
          </Marker>

          <Marker position={endPosition}>
            <Popup>Destination</Popup>
          </Marker>

          {/* ✅ GREEN ROUTE */}
          {routeCoords.length > 0 && (
            <>
              <Polyline
                positions={routeCoords}
                color="#2ecc71"
                weight={10}
                opacity={0.2}
              />
              <Polyline
                positions={routeCoords}
                color={routes[selectedRoute].color}
                weight={6}
              />
            </>
          )}
        </MapContainer>

        {/* BOTTOM PANEL */}
        <div className="bottom-panel" style={{ height: panelHeight }}>
          <div
            className="panel-resize-handle"
            onMouseDown={() => setDragPanel(true)}
          />

          <div className="bottom-panel-content">
            <h3>Recommended Routes</h3>

            <div className="cards">
              {routes.map((r, i) => (
                <div
                  key={i}
                  className={`card ${selectedRoute === i ? "active" : ""}`}
                  onClick={() => setSelectedRoute(i)}
                >
                  <h4>{r.type}</h4>
                </div>
              ))}
            </div>

            <div className="bottom-actions">
              <button className="filter-btn">Filters</button>
              <button className="start-btn">Start Navigation</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;