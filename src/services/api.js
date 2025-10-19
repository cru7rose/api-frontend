/**
 * ARCHITECTURE: Axios singleton configured to cooperate with the Vite proxy in development.
 * Responsibilities:
 * - Use baseURL from env; when set to "/" (recommended for dev), requests are same-origin and get proxied.
 */
import axios from "axios";

function resolveBaseUrl() {
  const w = typeof window !== "undefined" ? window : {};
  const winBase = (w.__API_BASE_URL__ || "").trim();
  const viteBase = (import.meta?.env?.VITE_API_BASE_URL || "").trim();
  const base = (winBase || viteBase);
  if (!base) return "/";          // default to same-origin → dev proxy handles cross-origin
  if (base === "/") return "/";   // explicit proxy mode
  return base.replace(/\/+$/, "");
}

const api = axios.create({
  baseURL: resolveBaseUrl(),
  withCredentials: true,
  headers: {
    "Accept": "application/json",
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    err.message = err?.response?.data?.message || err.message || "Request failed";
    return Promise.reject(err);
  }
);

export default api;
