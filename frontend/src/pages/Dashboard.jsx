import React, { useState } from "react";
import MapView from "../components/Map/MapView";
import RouteForm from "../components/Route/RouteForm";

const Dashboard = () => {
  const [routeData, setRouteData] = useState(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      
      {/* 🔥 Route Form */}
      <RouteForm onRouteSubmit={setRouteData} />

      {/* 🔥 Map */}
      <MapView routeData={routeData} />
    </div>
  );
};

export default Dashboard;