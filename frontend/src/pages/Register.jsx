import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/api";
import "./app.css";
import smartAccessIllustration from "../assets/Register.svg";
import smartMapsLogo from "../assets/smartmaps_logo.svg";
import {
  FaArrowRight,
  FaCheck,
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaUser,
} from "react-icons/fa";

const getPasswordChecks = (password) => [
  { label: "8 characters minimum", valid: password.length >= 8 },
  { label: "Uppercase letter", valid: /[A-Z]/.test(password) },
  { label: "Lowercase letter", valid: /[a-z]/.test(password) },
  { label: "Number", valid: /\d/.test(password) },
  { label: "Special character", valid: /[^A-Za-z0-9]/.test(password) },
];

function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const passwordChecks = getPasswordChecks(formData.password);
  const isPasswordStrong = passwordChecks.every((check) => check.valid);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus("");
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!isPasswordStrong) {
      setError(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await registerUser(formData);
      setStatus(response.data.message || "Account created successfully.");
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      navigate("/signin");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create account.");
    } finally {
      setIsSubmitting(false);
    }
  };

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

          <form onSubmit={handleSubmit}>
            <label>First Name *</label>
            <div className="input-box">
              <FaUser className="input-icon" />
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Enter your first name"
                required
              />
            </div>

            <label>Last Name *</label>
            <div className="input-box">
              <FaUser className="input-icon" />
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Enter your last name"
                required
              />
            </div>

            <label>Email *</label>
            <div className="input-box">
              <FaEnvelope className="input-icon" />
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
            <div className="password-rules">
              {passwordChecks.map((check) => (
                <span
                  key={check.label}
                  className={check.valid ? "password-rule valid" : "password-rule"}
                >
                  <FaCheck /> {check.label}
                </span>
              ))}
            </div>

            <label>Confirm Password *</label>
            <div className="input-box">
              <FaLock className="input-icon" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
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

            {error && <p className="auth-message auth-error">{error}</p>}
            {status && <p className="auth-message auth-success">{status}</p>}

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={isSubmitting || !isPasswordStrong}
            >
              {isSubmitting ? "Creating..." : "Create Account"} <FaArrowRight />
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
