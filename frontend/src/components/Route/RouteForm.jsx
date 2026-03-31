import React, { useState } from "react";
import "./Route.css";

const RouteForm = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Route:", from, to);
  };

  return (
    <form className="route-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="From"
        value={from}
        onChange={(e) => setFrom(e.target.value)}
      />

      <input
        type="text"
        placeholder="To"
        value={to}
        onChange={(e) => setTo(e.target.value)}
      />

      <button type="submit">Search</button>
    </form>
  );
};

export default RouteForm;