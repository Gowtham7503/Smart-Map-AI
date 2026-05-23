import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./app.css";
import smartAccessIllustration from "../assets/smart_access_illustration.svg";
import { loginUser } from "../services/api";
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
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setStatusMessage("");
    setIsSubmitting(true);

    try {
      await loginUser(formData);
      navigate("/dashboard");
    } catch (error) {
      setStatusMessage(
        error.response?.data?.error || "Unable to sign in. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
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
                name="email"
                type="text"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email or hallticket number"
              />
            </div>

            <label>Password *</label>
            <div className="input-box">
              <FaLock className="input-icon" />
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleInputChange}
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
              {isSubmitting ? "Signing In..." : "Sign In"} <FaArrowRight />
            </button>
          </form>

          {statusMessage && <p className="auth-message error">{statusMessage}</p>}

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
