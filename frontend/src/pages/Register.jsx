import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./app.css";
import smartAccessIllustration from "../assets/Register.svg";
import smartMapsLogo from "../assets/smartmaps_logo.svg";
import {
  FaArrowRight,
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaUser,
} from "react-icons/fa";

function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="main-container">
      <div className="login-card register-card">
        <div className="left-section">
          <div className="illustration-wrapper">
            <img
              src={smartAccessIllustration}
              alt="Smart access illustration"
              className="illustration-image register-illustration"
            />
          </div>

          <div className="bottom-text register-bottom-text">
            
          </div>
        </div>

        <div className="right-section register-section">

          <h1>Create Account</h1>
          <p className="subtitle">Join SmartMaps and start your journey</p>

          <form>
            <label>First Name *</label>
            <div className="input-box">
              <FaUser className="input-icon" />
              <input type="text" placeholder="Enter your first name" />
            </div>

            <label>Last Name *</label>
            <div className="input-box">
              <FaUser className="input-icon" />
              <input type="text" placeholder="Enter your last name" />
            </div>

            <label>Email *</label>
            <div className="input-box">
              <FaEnvelope className="input-icon" />
              <input type="email" placeholder="Enter your email" />
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

            <label>Confirm Password *</label>
            <div className="input-box">
              <FaLock className="input-icon" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
              />
              {showConfirmPassword ? (
                <FaEyeSlash
                  className="eye-icon"
                  onClick={() => setShowConfirmPassword(false)}
                />
              ) : (
                <FaEye
                  className="eye-icon"
                  onClick={() => setShowConfirmPassword(true)}
                />
              )}
            </div>

            <button type="submit" className="auth-submit-btn">
              Create Account <FaArrowRight />
            </button>
          </form>

          <div className="divider">
            <span></span>
            OR
            <span></span>
          </div>

          <p className="signup">
            Already have an account?
            <Link to="/signin"> Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
