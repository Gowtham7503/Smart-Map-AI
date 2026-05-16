import React from "react";
import { Link } from "react-router-dom";
import "./app.css";
import smartAccessIllustration from "../assets/smart_access_illustration.svg";
import {
  FaUser,
  FaLock,
  FaEye,
  FaArrowRight,
  FaMapMarkerAlt,
} from "react-icons/fa";

function App() {
  return (
    <div className="main-container">
      <div className="login-card">
        <div className="left-section">
          <div className="illustration-wrapper">
            <img
              src={smartAccessIllustration}
              alt="Smart access illustration"
              className="illustration-image"
            />
          </div>

          <div className="bottom-text"></div>
        </div>

        <div className="right-section">
          <div className="logo">
            <FaMapMarkerAlt className="logo-icon" />
            <span>
              Smart<span className="green">Maps</span>
            </span>
          </div>

          <h1>Welcome Back</h1>
          <p className="subtitle">Sign in to continue your journey</p>

          <form>
            <label>Email / Hallticket Number *</label>
            <div className="input-box">
              <FaUser className="input-icon" />
              <input
                type="text"
                placeholder="Enter your email or hallticket number"
              />
            </div>

            <label>Password *</label>
            <div className="input-box">
              <FaLock className="input-icon" />
              <input type="password" placeholder="Enter your password" />
              <FaEye className="eye-icon" />
            </div>

            <div className="options">
              <div className="checkbox">
                <input type="checkbox" />
                <span>Show Password</span>
              </div>

              <a href="/">Forgot Password?</a>
            </div>

            <button type="submit">
              Sign In <FaArrowRight />
            </button>
          </form>

          <div className="divider">
            <span></span>
            OR
            <span></span>
          </div>

          <p className="signup">
            Don't have an account?
            <Link to="/register"> Create Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
