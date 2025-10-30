// ============================================================================
// services/Api.js
// Single axios client with safe baseURL resolution and path normalization.
// - Dev: VITE_API_BASE_URL="/" → same-origin; Vite proxy handles CORS.
// - Prod: leave VITE_API_BASE_URL empty or set to "/" so NGINX routes:
//         /auth/*  → api.danxils.com/auth/*
//         /api/*   → api.danxils.com/api/*
// Also normalizes any accidental "/api/auth/*" to "/auth/*" for login flows.
// ============================================================================
import axios from "axios";

function resolveBaseUrl() {
    const w = typeof window !== "undefined" ? window : {};
    const winBase = (w.__API_BASE_URL__ || "").trim();
    const viteBase = (import.meta?.env?.VITE_API_BASE_URL || "").trim();
    const base = winBase || viteBase;
    if (!base || base === "/") return "/";        // same-origin; proxy/nginx handle
    return base.replace(/\/+$/, "");
}

const api = axios.create({
    baseURL: resolveBaseUrl(),
    withCredentials: true,
    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
    },
});

// --- Request normalizer ------------------------------------------------------
// If someone passes "/api/auth/login", rewrite to "/auth/login".
// This protects us from legacy code or accidental prefixes.
api.interceptors.request.use((config) => {
    if (typeof config.url === "string") {
        const u = config.url;
        // Only fix the three auth endpoints; leave other /api/* alone.
        const fixed = u
            .replace(/^\/api\/auth\/login(\b|\/)/, "/auth/login$1")
            .replace(/^\/api\/auth\/refresh(\b|\/)/, "/auth/refresh$1")
            .replace(/^\/api\/auth\/logout(\b|\/)/, "/auth/logout$1");
        if (fixed !== u) config.url = fixed;
    }
    return config;
});

// --- Response error mapper (lightweight) ------------------------------------
api.interceptors.response.use(
    (res) => res,
    (err) => {
        err.message = err?.response?.data?.message || err.message || "Request failed";
        return Promise.reject(err);
    }
);

export default api;
