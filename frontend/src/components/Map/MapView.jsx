import { useMap } from "react-leaflet";
import { useEffect } from "react";

const EnableZoom = () => {
  const map = useMap();

  useEffect(() => {
    map.scrollWheelZoom.enable();
  }, [map]);

  return null;
};
import React, { useState } from "react";
import "./Map.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Marker fix (Vite)
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const position = [17.4948, 78.3996];

const routeCoords = [
  [17.4948, 78.3996],
  [17.48, 78.41],
  [17.46, 78.42],
  [17.44, 78.43],
];

const MapView = () => {
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [panelHeight, setPanelHeight] = useState(200);

  const [dragSidebar, setDragSidebar] = useState(false);
  const [dragPanel, setDragPanel] = useState(false);

  const [selectedRoute, setSelectedRoute] = useState(0);

  const routes = [
    { type: "Fastest", time: "32 min", status: "Heavy Traffic", color: "orange" },
    { type: "Safest", time: "36 min", status: "Secure Roads", color: "green" },
    { type: "Eco", time: "40 min", status: "Low Emissions", color: "blue" },
  ];

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

        <div className="route-box">
          <div className="input">
            <label>From</label>
            <input value="My Location" readOnly />
          </div>
          <div className="input">
            <label>To</label>
            <input value="Kukatpally, Hyderabad" readOnly />
          </div>
          <button className="directions-btn">Get Directions</button>
        </div>

        <div className="filters">
          <h4>Quick Filters</h4>
          <div className="filter active">Safest Route</div>
          <div className="filter">Low Pollution</div>
          <div className="filter">Avoid Traffic</div>
        </div>

        <div className="places">
          <h4>Nearby Places</h4>
          <div className="icons">
            <div>🍴</div>
            <div>⛽</div>
            <div>🏥</div>
            <div>☕</div>
          </div>
        </div>
      </div>

      {/* Sidebar Resize */}
      <div
        className="resize-handle"
        onMouseDown={() => setDragSidebar(true)}
      />

      {/* MAP */}
      <div className="map-area">
        <div className="search-bar">
          <input placeholder="Search location, place..." />
        </div>

        <MapContainer
            center={position}
            zoom={12}
            zoomControl={false}
            scrollWheelZoom={true}
            doubleClickZoom={true}
            touchZoom={true}
            dragging={true}
            className="leaflet-map"
          >
          <EnableZoom />   {/* ✅ ADD THIS */}

          <TileLayer
            attribution="&copy; OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Marker position={position}>
            <Popup>Start</Popup>
          </Marker>

          <Marker position={routeCoords[routeCoords.length - 1]}>
            <Popup>Destination</Popup>
          </Marker>

          <Polyline
            positions={routeCoords}
            color={routes[selectedRoute].color}
            weight={5}
          />
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
                  <p>{r.time}</p>
                  <span>{r.status}</span>
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