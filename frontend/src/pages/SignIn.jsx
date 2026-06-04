import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { loginUser, requestPasswordResetOtp } from "../services/api";
import "./app.css";
import smartAccessIllustration from "../assets/smart_access_illustration.svg";
import {
  FaUser,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaArrowRight,
} from "react-icons/fa";

function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [status, setStatus] = useState(location.state?.message || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const handleSignIn = async (event) => {
    event.preventDefault();
    setError("");
    setStatus("");

    try {
      setIsSubmitting(true);
      await loginUser(formData);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setStatus("");
    const email = formData.email.trim();

    if (!email) {
      setError("Enter your email first, then click Forgot Password.");
      return;
    }

    try {
      setIsSendingOtp(true);
      await requestPasswordResetOtp(email);
      sessionStorage.setItem("smartmap:password-reset-email", email);
      navigate("/otp");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send OTP.");
    } finally {
      setIsSendingOtp(false);
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
            <label>Email *</label>
            <div className="input-box">
              <FaUser className="input-icon" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </div>

            <label>Password *</label>
            <div className="input-box">
              <FaLock className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
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
                onClick={handleForgotPassword}
              >
                {isSendingOtp ? "Sending OTP..." : "Forgot Password?"}
              </span>
            </div>

            {error && <p className="auth-message auth-error">{error}</p>}
            {status && <p className="auth-message auth-success">{status}</p>}

            <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign In"} <FaArrowRight />
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

export default SignIn;
