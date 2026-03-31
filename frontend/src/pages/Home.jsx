import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/UI/Button";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home">
      <h1>SmartMaps 🚀</h1>
      <p>Safe • Smart • Sustainable Navigation</p>

      <Button text="Go to Dashboard" onClick={() => navigate("/dashboard")} />
    </div>
  );
};

export default Home;