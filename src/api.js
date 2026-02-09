import axios from "axios";

const API_BASE =
  process.env.REACT_APP_API_BASE || "https://hrms-lite-backend-yfmo.onrender.com";

export const api = axios.create({
  baseURL: API_BASE,
});

// Automatically attach token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
