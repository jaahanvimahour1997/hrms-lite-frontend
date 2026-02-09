import axios from "axios";

export const api = axios.create({
  baseURL: "https://hrms-lite-backend-yfmo.onrender.com",
});

// ✅ Automatically attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
git add .
