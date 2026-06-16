import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  requestPasswordResetOtp,
  resetPassword,
  verifyPasswordResetOtp,
} from "../services/api";
import "./Otp.css";
import LeftIllustration from "../assets/smart_access_illustration.svg";

const passwordIsStrong = (password) =>
  password.length >= 8 &&
  /[A-Z]/.test(password) &&
  /[a-z]/.test(password) &&
  /\d/.test(password) &&
  /[!@#$%^&*(),.?":{}|<>]/.test(password);

const OtpPage = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState("verify");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setMessage("");
    const resetEmail = sessionStorage.getItem("smartmap:password-reset-email");

    try {
      setIsSubmitting(true);
      await requestPasswordResetOtp(resetEmail);
      setMessage("A new OTP has been sent to your email.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to resend OTP.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    setMessage("");

    const code = otp.join("");
    if (code.length !== 6) {
      setError("Enter the 6-digit OTP.");
      return;
    }

    try {
      setIsSubmitting(true);
      await verifyPasswordResetOtp(code);
      setStep("reset");
      setMessage("OTP verified. Create your new password.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to verify OTP.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!passwordIsStrong(password)) {
      setError(
        "Password must include uppercase, lowercase, number, special character, and at least 8 characters."
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await resetPassword(password);
      sessionStorage.removeItem("smartmap:password-reset-email");
      navigate("/signin", {
        replace: true,
        state: { message: "Password reset successfully. Please sign in." },
      });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to reset password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="otp-container">
      <div className="otp-card">
        <div className="left-section">
          <img src={LeftIllustration} alt="Illustration" />
        </div>

        <div className="right-section">
          <h2>{step === "verify" ? "Verify OTP" : "Reset Password"}</h2>

          <p className="sub-text">
            {step === "verify"
              ? "Enter the 6-digit OTP sent to your registered email."
              : "Create a new password for your account."}
          </p>

          {step === "verify" ? (
            <>
              <label>Enter OTP *</label>
              <div className="otp-inputs">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleChange(e.target.value, index)}
                  />
                ))}
              </div>

              <div className="resend">
                <span>Didn't receive the code?</span>
                <button type="button" onClick={handleResendOtp} disabled={isSubmitting}>
                  Resend OTP
                </button>
              </div>

              <button className="verify-btn" onClick={handleVerifyOtp} disabled={isSubmitting}>
                {isSubmitting ? "Verifying..." : "Verify OTP"}
              </button>
            </>
          ) : (
            <>
              <label>New Password *</label>
              <input
                className="otp-form-input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter new password"
              />

              <label>Confirm Password *</label>
              <input
                className="otp-form-input"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm new password"
              />

              <button className="verify-btn" onClick={handleResetPassword} disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Change Password"}
              </button>
            </>
          )}

          {error && <p className="auth-message auth-error">{error}</p>}
          {message && <p className="auth-message auth-success">{message}</p>}

          <button className="back-btn" onClick={() => navigate("/signin")}>
            Back to Sign In
          </button>

          <p className="note">
            OTP will expire in <span>5 minutes</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OtpPage;
