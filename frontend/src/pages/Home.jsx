import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/UI/Button";
import "./Home.css";
import worldMap from "../assets/world.svg";

const Home = () => {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <div className="app">
      <header className="navbar">
        <div className="logo">
          Smart<span>Maps</span>
        </div>

        <nav className="nav-links">
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#features">Features</a>
          <a href="#contact">Contact</a>
        </nav>

        <button
          className="theme-toggle"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? "☀ Light" : "🌙 Dark"}
        </button>
      </header>

      <main className="hero-section">
        <div className="background-layer">
          <div className="bg-gradient"></div>
          <div className="bg-noise"></div>
          <div className="bg-grid"></div>

          <div className="map-container">
            <img src={worldMap} alt="World Map" className="world-map-svg" />
          </div>

          {/* REAL CONNECTION LINES */}
          <svg
            className="connection-svg"
            viewBox="0 0 1600 900"
            preserveAspectRatio="none"
          >
            {/* North America */}
            <path d="M210 185 Q 320 140 390 245" className="arc" />
            <path d="M390 245 Q 520 220 650 300" className="arc" />
            <path d="M390 245 Q 470 360 470 640" className="arc" />
            <path d="M470 640 Q 520 690 550 735" className="arc" />

            {/* Europe / Asia */}
            <path d="M650 300 Q 810 220 900 270" className="arc" />
            <path d="M900 270 Q 1080 180 1180 200" className="arc" />
            <path d="M900 270 Q 1040 280 1270 350" className="arc" />
            <path d="M1180 200 Q 1280 190 1380 335" className="arc" />

            {/* Africa / Middle East */}
            <path d="M900 270 Q 840 360 980 470" className="arc" />
            <path d="M980 470 Q 920 520 880 575" className="arc" />
            <path d="M880 575 Q 760 520 780 500" className="arc" />

            {/* South America */}
            <path d="M470 640 Q 620 520 780 500" className="arc" />
            <path d="M550 735 Q 760 650 880 575" className="arc" />

            {/* Asia to Australia */}
            <path d="M1270 350 Q 1180 520 1330 690" className="arc" />
            <path d="M980 470 Q 1150 380 1270 350" className="arc" />
            <path d="M780 500 Q 980 360 1180 200" className="arc" />

            {/* Cross connections */}
            <path d="M210 185 Q 700 100 1180 200" className="arc" />
            <path d="M390 245 Q 800 120 1380 335" className="arc" />
            <path d="M650 300 Q 880 390 1330 690" className="arc" />
          </svg>

          {/* Glow nodes */}
          <span className="node n1"></span>
          <span className="node n2"></span>
          <span className="node n3"></span>
          <span className="node n4"></span>
          <span className="node n5"></span>
          <span className="node n6"></span>
          <span className="node n7"></span>
          <span className="node n8"></span>
          <span className="node n9"></span>
          <span className="node n10"></span>
          <span className="node n11"></span>
          <span className="node n12"></span>
        </div>

        <div className="hero-content">
          <p className="section-tag">ABOUT</p>

          <h1>
            Smart <span>Navigation</span>
            <br />
            System
            <br />
            for Safer,Smarter
            <br />
            Cities
          </h1>

          <p className="hero-description">
            SmartMaps helps users find the safest, fastest, and most eco-friendly
            routes using AI, real-time traffic data, and pollution insights.
          </p>

          <button className="explore-btn">
            Explore Now <span>→</span>
          </button>
        </div>
      </main>
    </div>
  );
};

export default Home;