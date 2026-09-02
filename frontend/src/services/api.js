import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  withCredentials: true,
});

export const getRoute = (coordinates, mode = "car", filters = {}) => {
  return API.post("/route", { coordinates, mode, filters });
};

export const getLowPollutionRoute = (coordinates, mode = "car", filters = {}) => {
  return API.post("/route/pollution", { coordinates, mode, filters });
};

export const getMapWeatherSamples = (points) => {
  return API.post("/map/weather", { points });
};

export const getMapPollutionSamples = (points) => {
  return API.post("/map/pollution", { points });
};

export const getChatbotRecommendations = (
  message,
  position,
  locationLabel,
  history = [],
) => {
  return API.post("/chatbot/recommendations", {
    message,
    latitude: position?.[0] ?? null,
    longitude: position?.[1] ?? null,
    location_label: locationLabel,
    history,
  });
};

export const getShortestRoute = (coordinates, mode = "car") => {
  return API.post("/route/shortest", { coordinates, mode });
};

export const registerUser = (userData) => {
  return API.post("/auth/register", userData);
};

export const loginUser = (credentials) => {
  return API.post("/auth/login", credentials);
};

export const requestPasswordResetOtp = (email) => {
  return API.post("/auth/request-password-reset-otp", { email });
};

export const verifyPasswordResetOtp = (otp) => {
  return API.post("/auth/verify-password-reset-otp", { otp });
};

export const resetPassword = (password) => {
  return API.post("/auth/reset-password", { password });
};

export const getCurrentUser = () => {
  return API.get("/auth/me");
};

export const logoutUser = () => {
  return API.post("/auth/logout");
};
