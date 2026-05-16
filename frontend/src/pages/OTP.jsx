import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Otp.css";
import LeftIllustration from "../assets/OTP.svg";

const OtpPage = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const handleChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const handleSubmit = () => {
    console.log("OTP:", otp.join(""));
    navigate("/dashboard");
  };

  return (
    <div className="otp-container">
      <div className="otp-card">

        <div className="left-section">
          <img src={LeftIllustration} alt="Illustration" />
        </div>

        <div className="right-section">
          <h2>Verify Your Account</h2>

          <p className="sub-text">
            Enter the 6-digit OTP sent to <br />
            <span>john.doe@example.com</span>
          </p>

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
            <a href="#">Resend OTP</a>
            <span className="timer">00:27</span>
          </div>

          {/* ✅ FIXED BUTTON CLASSES */}
          <button className="verify-btn" onClick={handleSubmit}>
            Verify & Continue →
          </button>

          <button className="back-btn" onClick={() => navigate("/signin")}>
            ← Back to Sign In
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