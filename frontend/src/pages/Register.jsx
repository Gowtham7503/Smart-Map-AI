import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./app.css";
import smartAccessIllustration from "../assets/Register.svg";
import { registerUser } from "../services/api";
import {
  FaArrowRight,
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaUser,
} from "react-icons/fa";

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
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setStatusMessage("");

    if (formData.password !== formData.confirmPassword) {
      setStatusMessage("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      await registerUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      });
      navigate("/signin");
    } catch (error) {
      setStatusMessage(
        error.response?.data?.error ||
          "Unable to create account. Please try again."
      );
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

          <form onSubmit={handleRegister}>
            <label>First Name *</label>
            <div className="input-box">
              <FaUser className="input-icon" />
              <input
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="Enter your first name"
              />
            </div>

            <label>Last Name *</label>
            <div className="input-box">
              <FaUser className="input-icon" />
              <input
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Enter your last name"
              />
            </div>

            <label>Email *</label>
            <div className="input-box">
              <FaEnvelope className="input-icon" />
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
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

            <label>Confirm Password *</label>
            <div className="input-box">
              <FaLock className="input-icon" />
              <input
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleInputChange}
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
              {isSubmitting ? "Creating Account..." : "Create Account"}{" "}
              <FaArrowRight />
            </button>
          </form>

          {statusMessage && <p className="auth-message error">{statusMessage}</p>}

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
