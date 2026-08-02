import "./Home.css";
import bannerImage1 from "../assets/banner-image1.jpg";
import bannerImage2 from "../assets/banner-image2.jpg";
import bannerImage3 from "../assets/banner-image3.jpg";
import bannerImage4 from "../assets/banner-image4.jpg";
import bannerImage5 from "../assets/banner-image5.jpg";
import bannerImage6 from "../assets/banner-image6.jpg";
import smartMapsLogo from "../assets/smartmaps_logo.svg";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HomeSections from "../components/Home/HomeSections";

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
  const [activeSection, setActiveSection] = useState("home");
  const [scrolled, setScrolled] = useState(false);

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
        <img className="brand-logo-img home-logo" src={smartMapsLogo} alt="SmartMaps" />

        <ul className="nav-links">
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

        <div className="hero-shell">
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
        </div>
      </main>

      <HomeSections />
    </div>
  );
};

export default Home;
