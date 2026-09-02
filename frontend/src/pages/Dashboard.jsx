import React from "react";
import MapView from "../components/Map/MapView";

const Dashboard = ({ theme = "bright", onToggleTheme }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <MapView theme={theme} onToggleTheme={onToggleTheme} />
    </div>
  );
};

export default Dashboard;
