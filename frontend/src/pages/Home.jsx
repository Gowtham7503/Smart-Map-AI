import "./Home.css";
import smartMapsLogoDark from "../assets/smartmaps_logo_dark.svg";
import smartMapsLogo from "../assets/smartmaps_logo.svg";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HomeSections from "../components/Home/HomeSections";

// Premium High-Resolution Unsplash Images curated for Smart Navigation, Road Safety & Transit
const bannerImages = [
  {
    url: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=2000&q=80",
    tag: "Smart City Mobility",
    caption: "Intelligent Urban Navigation",
  },
  {
    url: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=2000&q=80",
    tag: "Next-Gen GPS",
    caption: "Real-Time Route Optimization",
  },
  {
    url: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=2000&q=80",
    tag: "Safety-First Corridors",
    caption: "Well-Lit & Secure Travel Routing",
  },
  {
    url: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=2000&q=80",
    tag: "Scenic & Clean Routes",
    caption: "Low-Emission Eco-Friendly Journeys",
  },
  {
    url: "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=2000&q=80",
    tag: "Smooth Highway Transit",
    caption: "Seamless Highway & Mountain Routing",
  },
  {
    url: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=2000&q=80",
    tag: "Urban Traffic Intelligence",
    caption: "Live Dynamic Route Insights",
  },
];

const Home = ({ onToggleTheme, theme = "bright" }) => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Smooth automatic slideshow cycling every 5 seconds
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerImages.length);
    }, 5000);

    return () => clearInterval(slideTimer);
  }, []);

  useEffect(() => {
    const heroSection = document.querySelector(".hero-section");
    const sections = Array.from(document.querySelectorAll("section[id]"));
    const targets = heroSection ? [heroSection, ...sections] : sections;

    if (!targets.length) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visibleEntry) {
          const targetId = visibleEntry.target.id || "home";
          setActiveSection(targetId);
        }
      },
      { threshold: [0.2, 0.35, 0.6] }
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 16);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="home-page">
      <header className={`navbar${scrolled ? " scrolled" : ""}`}>
        <img
          className="brand-logo-img home-logo"
          src={theme === "bright" && scrolled ? smartMapsLogoDark : smartMapsLogo}
          alt="SmartMaps"
        />

        <ul className="nav-links">
          <li>
            <button
              className="nav-link nav-theme-toggle"
              onClick={onToggleTheme}
              type="button"
              aria-label={`Switch to ${theme === "dark" ? "bright" : "dark"} theme`}
            >
              {theme === "dark" ? "Bright" : "Dark"}
            </button>
          </li>
          <li>
            <a href="#about" className={activeSection === "about" ? "nav-link active" : "nav-link"}>
              About us
            </a>
          </li>
          <li>
            <a href="#features" className={activeSection === "features" ? "nav-link active" : "nav-link"}>
              Features
            </a>
          </li>
          <li>
            <a href="#contact" className={activeSection === "contact" ? "nav-link active" : "nav-link"}>
              Contact
            </a>
          </li>
        </ul>
      </header>

      <main className="hero-section">
        <div className="banner-slideshow" aria-hidden="true">
          {bannerImages.map((image, index) => (
            <div
              className={`banner-slide-item ${index === currentSlide ? "active" : ""}`}
              key={image.url}
            >
              <img
                src={image.url}
                alt={image.caption}
                className="banner-slide-img"
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
                referrerPolicy="no-referrer"
              />
            </div>
          ))}
        </div>
        <div className="overlay"></div>

        <div className="hero-shell">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="hero-badge-dot"></span>
              <span>{bannerImages[currentSlide].tag}</span>
            </div>

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

            <div className="hero-actions">
              <button className="hero-btn primary" onClick={() => navigate("/dashboard")}>
                Explore Now
              </button>
              <a href="#features" className="hero-btn secondary">
                Discover Features
              </a>
            </div>
          </div>

          <div className="hero-indicators" role="tablist" aria-label="Slideshow controls">
            {bannerImages.map((image, index) => (
              <button
                key={image.url}
                className={`hero-dot ${index === currentSlide ? "active" : ""}`}
                onClick={() => setCurrentSlide(index)}
                type="button"
                aria-label={`Slide ${index + 1}: ${image.tag}`}
                title={image.tag}
              >
                <span className="hero-dot-bar"></span>
              </button>
            ))}
          </div>
        </div>
      </main>

      <HomeSections />
    </div>
  );
};

export default Home;

