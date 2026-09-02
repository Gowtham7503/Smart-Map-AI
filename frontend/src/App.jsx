import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Navigate, Routes, Route, useLocation } from "react-router-dom";
import { FaMoon, FaSun } from "react-icons/fa";

import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import SignIn from "./pages/SignIn";
import Register from "./pages/Register";
import OtpPage from "./pages/OTP";
import { getCurrentUser } from "./services/api";
import "./App.css";

const THEME_STORAGE_KEY = "smartmap:theme";

const getInitialTheme = () => {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

  if (savedTheme === "dark" || savedTheme === "bright") {
    return savedTheme;
  }

  return "bright";
};

function ProtectedRoute({ children }) {
  const [authState, setAuthState] = useState("checking");

  useEffect(() => {
    let isMounted = true;

    getCurrentUser()
      .then(() => {
        if (isMounted) {
          setAuthState("authenticated");
        }
      })
      .catch(() => {
        if (isMounted) {
          setAuthState("unauthenticated");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (authState === "checking") {
    return null;
  }

  return authState === "authenticated" ? children : <Navigate to="/signin" replace />;
}

function AppContent() {
  const location = useLocation();
  const [theme, setTheme] = useState(getInitialTheme);
  const isHome = location.pathname === "/";
  const isDashboard = location.pathname === "/dashboard";

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "dark" ? "bright" : "dark"));
  };

  return (
    <>
      {!isHome && !isDashboard && (
        <button
          className={`theme-toggle-btn ${isDashboard ? "dashboard-theme-toggle" : ""}`}
          onClick={toggleTheme}
          type="button"
          aria-label={`Switch to ${theme === "dark" ? "bright" : "dark"} theme`}
          title={`Switch to ${theme === "dark" ? "bright" : "dark"} theme`}
        >
          {theme === "dark" ? <FaSun /> : <FaMoon />}
          <span className="theme-toggle-label">
            {theme === "dark" ? "bright" : "dark"}
          </span>
        </button>
      )}
      <Routes>
        <Route path="/" element={<Home onToggleTheme={toggleTheme} theme={theme} />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard theme={theme} onToggleTheme={toggleTheme} />
            </ProtectedRoute>
          }
        />
        <Route path="/signin" element={<SignIn theme={theme} />} />
        <Route path="/register" element={<Register theme={theme} />} />

        {/* ✅ NEW ROUTE */}
        <Route path="/otp" element={<OtpPage />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
