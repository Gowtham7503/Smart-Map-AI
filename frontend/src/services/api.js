import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

export const getRoute = (coordinates, mode = "car") => {
  return API.post("/route", { coordinates, mode });
};
