import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
});

export const getRoute = (coordinates, mode = "car", filters = {}) => {
  return API.post("/route", { coordinates, mode, filters });
};

export const registerUser = (userData) => {
  return API.post("/auth/register", userData);
};

export const loginUser = (credentials) => {
  return API.post("/auth/login", credentials);
};

export const getCurrentUser = () => {
  return API.get("/auth/me");
};

export const logoutUser = () => {
  return API.post("/auth/logout");
};
