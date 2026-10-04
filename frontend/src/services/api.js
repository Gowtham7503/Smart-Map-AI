import axios from "axios";

const AUTH_TOKEN_KEY = "smartmap:auth-token";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  withCredentials: true,
});

const getAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY);

const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
};

const clearAuthToken = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

API.interceptors.request.use((config) => {
  const token = getAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

API.interceptors.response.use(
  (response) => {
    setAuthToken(response.data?.token);
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      clearAuthToken();
    }

    return Promise.reject(error);
  },
);

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

export const logoutUser = async () => {
  try {
    return await API.post("/auth/logout");
  } finally {
    clearAuthToken();
  }
};
