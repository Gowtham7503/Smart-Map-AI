import "./Home.css";
import bannerImage1 from "../assets/banner-image1.jpg";
import bannerImage2 from "../assets/banner-image2.jpg";
import bannerImage3 from "../assets/banner-image3.jpg";
import bannerImage4 from "../assets/banner-image4.jpg";
import bannerImage5 from "../assets/banner-image5.jpg";
import bannerImage6 from "../assets/banner-image6.jpg";
import smartMapsLogo from "../assets/smartmaps_logo.svg";
import { useNavigate } from "react-router-dom";

const bannerImages = [
  bannerImage1,
  bannerImage2,
  bannerImage3,
  bannerImage4,
  bannerImage5,
  bannerImage6,
];

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <header className="navbar">
        <img className="brand-logo-img home-logo" src={smartMapsLogo} alt="SmartMaps" />

        <ul className="nav-links">
          <li>About us</li>
          <li>Features</li>
          <li>Contact</li>
        </ul>
      </header>

      <main className="hero-section">
        <div
          className="banner-slideshow"
          style={{ "--first-banner-image": `url(${bannerImages[0]})` }}
          aria-hidden="true"
        >
          {bannerImages.map((image, index) => (
            <img
              alt=""
              className="banner-slide"
              key={image}
              src={image}
              style={{ animationDelay: `${index * 5}s` }}
            />
          ))}
        </div>
        <div className="overlay"></div>

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
