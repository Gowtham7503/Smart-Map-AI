import React from "react";
import MapView from "../components/Map/MapView";

const Dashboard = () => {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <MapView />
    </div>
  );
};

export default Dashboard;
