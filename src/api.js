import axios from "axios";

export const api = axios.create({
  baseURL: "https://hrms-lite-backend-yfmo.onrender.com",
  timeout: 15000, // ⭐ prevents infinite loading (15 sec)
});

// ✅ Automatically attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});