import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./app.css";
import smartAccessIllustration from "../assets/smart_access_illustration.svg";
import {
  FaUser,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaArrowRight,
} from "react-icons/fa";

function App() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = (e) => {
    e.preventDefault();
    navigate("/dashboard");
  };

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
        </div>

        <div className="right-section">
          <h1>Welcome Back</h1>
          <p className="subtitle">Sign in to continue your journey</p>

          <form onSubmit={handleSignIn}>
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
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
              />
              {showPassword ? (
                <FaEyeSlash className="eye-icon" onClick={() => setShowPassword(false)} />
              ) : (
                <FaEye className="eye-icon" onClick={() => setShowPassword(true)} />
              )}
            </div>

            <div className="options">
              <div className="checkbox">
                
              </div>

              {/* ✅ UPDATED */}
              <span
                className="forgot-link"
                onClick={() => navigate("/otp")}
              >
                Forgot Password?
              </span>
            </div>

            <button type="submit" className="auth-submit-btn">
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