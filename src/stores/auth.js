// ============================================================================
// stores/auth.js — Canonical auth store
// ============================================================================
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { jwtDecode } from "jwt-decode";
import apiClient from "@/services/Api.js";
import { AuthApi } from "@/services/AuthApi.js";

const AUTH_TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USERNAME_KEY = "auth_username";

export const useAuthStore = defineStore("auth", () => {
    const accessToken = ref(localStorage.getItem(AUTH_TOKEN_KEY) || null);
    const refreshToken = ref(localStorage.getItem(REFRESH_TOKEN_KEY) || null);
    const username = ref(localStorage.getItem(USERNAME_KEY) || null);
    const roles = ref([]);
    const authError = ref(null);
    const redirectPath = ref(null);

    const isAuthenticated = computed(() => !!accessToken.value);
    const isAdmin = computed(() => roles.value.includes("ADMIN"));

    function decode(token) {
        try { return jwtDecode(token); } catch { return null; }
    }

    function applyAuthHeader(token) {
        if (token) {
            apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        } else {
            delete apiClient.defaults.headers.common["Authorization"];
        }
    }

    function setAuthData({ accessToken: at, refreshToken: rt, username: un }) {
        accessToken.value = at || null;
        refreshToken.value = rt || null;
        username.value = un || null;

        localStorage.setItem(AUTH_TOKEN_KEY, at || "");
        localStorage.setItem(REFRESH_TOKEN_KEY, rt || "");
        localStorage.setItem(USERNAME_KEY, un || "");

        const decoded = at ? decode(at) : null;
        roles.value = decoded?.roles || [];

        applyAuthHeader(at);
        authError.value = null;
    }

    function clearAuth() {
        accessToken.value = null;
        refreshToken.value = null;
        username.value = null;
        roles.value = [];
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USERNAME_KEY);
        applyAuthHeader(null);
        authError.value = null;
    }

    const api = new AuthApi();

    async function login(user, pass) {
        authError.value = null;
        try {
            const res = await api.login(user, pass);
            if (res.ok) {
                setAuthData(res.value);
                return true;
            }
            authError.value = res.error?.message || "Login failed";
            clearAuth();
            return false;
        } catch (e) {
            authError.value = e?.message || "Login failed";
            clearAuth();
            return false;
        }
    }

    async function logout() {
        try { await api.logout(); } finally { clearAuth(); }
    }

    function setRedirect(path) { redirectPath.value = path || null; }

    // Re-hydrate header on boot (if token cached)
    if (accessToken.value) applyAuthHeader(accessToken.value);

    return {
        // state
        accessToken, refreshToken, username, roles, authError, redirectPath,
        // getters
        isAuthenticated, isAdmin,
        // actions
        login, logout, setRedirect,
    };
});
