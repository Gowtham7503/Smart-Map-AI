import React, { useState } from "react";
import "./Route.css";

const RouteForm = ({ onRouteSubmit }) => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!from || !to) {
      alert("Please enter both locations");
      return;
    }

    onRouteSubmit({ from, to });
  };

  return (
    <form className="route-form" onSubmit={handleSubmit}>
      <input
        type="text"
        value={from}
        onChange={(e) => setFrom(e.target.value)}
        placeholder="From"
      />
      <input
        type="text"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        placeholder="To"
      />
      <button type="submit">Find Route</button>
    </form>
  );
};

export default RouteForm; 
