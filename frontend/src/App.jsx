import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Navigate, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import SignIn from "./pages/SignIn";
import Register from "./pages/Register";
import OtpPage from "./pages/OTP";
import { getCurrentUser } from "./services/api";

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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/register" element={<Register />} />

        {/* ✅ NEW ROUTE */}
        <Route path="/otp" element={<OtpPage />} />
      </Routes>
    </Router>
  );
}

export default App;
