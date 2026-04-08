import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

export const getRoute = (coordinates, mode = "car", filters = {}) => {
  return API.post("/route", { coordinates, mode, filters });
};
