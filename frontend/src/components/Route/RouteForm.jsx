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
    <div></div>
  );
};

export default RouteForm; 