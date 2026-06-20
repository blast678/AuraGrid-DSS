import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.warn("[AuraGrid API]", error.message);
    return Promise.reject(error);
  }
);

export const api = {
  getForecast: (zone: string) =>
    apiClient.get(`/api/forecast?zone=${encodeURIComponent(zone)}`),
  getRecommendations: () => apiClient.get("/api/recommendations"),
  getDirectives: (zone: string) =>
    apiClient.get(`/api/directives?zone=${encodeURIComponent(zone)}`),
  getSystemLogs: () => apiClient.get("/api/logs"),
};
