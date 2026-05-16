import "./Home.css";
import mapBright from "../assets/mapbright.png";
import smartMapsLogo from "../assets/smartmaps_logo.svg";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  return (
    <div className="home-page">
      {/* ?? NAVBAR */}
      <header className="navbar">
        <img className="brand-logo-img home-logo" src={smartMapsLogo} alt="SmartMaps" />

        {/* ? FIXED: use ul > li */}
        <ul className="nav-links">
          <li>About us</li>
          <li>Features</li>
          <li>Contact</li>
        </ul>
      </header>

      {/* ?? HERO SECTION */}
      <main
        className="hero-section"
        style={{
          background: `url(${mapBright}) center/cover no-repeat`,
        }}
      >
        {/* ?? OVERLAY */}
        <div className="overlay"></div>

        {/* ?? HERO CONTENT */}
        <div className="hero-content">        

          <h1>
            Smart <span id="nav-green">Navigation</span>
            <br />
            System
            <br />
            for Safer, Smarter
            <br />
            Cities
          </h1>

          <p className="description">
            SmartMaps helps users find the safest, fastest, and most eco-friendly
            routes using AI, real-time traffic data, and pollution insights.
          </p>

          <button className="hero-btn" onClick={() => navigate("/dashboard")}>
            Explore Now
          </button>
        </div>
      </main>
    </div>
  );
};

export default Home;
