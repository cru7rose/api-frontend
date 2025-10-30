// ============================================================================
// Frontend: Fix auth.js store (Supersedes previous version)
// FILE: src/stores/auth.js
// REASON: Corrects the import for the API client (default export)
//         and uses the correct method for setting the auth header
//         on the axios instance.
// ============================================================================
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { jwtDecode } from 'jwt-decode';
import { AuthApi } from '@/services/AuthApi';
import apiClient from '@/services/Api.js'; // default axios instance

const AUTH_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USERNAME_KEY = 'auth_username';

export const useAuthStore = defineStore('auth', () => {
    // --- State ---
    const accessToken = ref(localStorage.getItem(AUTH_TOKEN_KEY) || null);
    const refreshToken = ref(localStorage.getItem(REFRESH_TOKEN_KEY) || null);
    const username = ref(localStorage.getItem(USERNAME_KEY) || null);
    const roles = ref([]);
    const authError = ref(null);
    const redirectPath = ref(null);

    // --- Getters ---
    const isAuthenticated = computed(() => !!accessToken.value);
    const isAdmin = computed(() => roles.value.includes('ADMIN'));

    // --- Helpers ---
    const decodeToken = (t) => {
        try { return jwtDecode(t); } catch { return null; }
    };

    const setAxiosAuthHeader = (token) => {
        if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        else delete apiClient.defaults.headers.common['Authorization'];
    };

    function setAuthData({ accessToken: at, refreshToken: rt, username: un }) {
        accessToken.value = at;
        refreshToken.value = rt;
        username.value = un;

        const decoded = decodeToken(at);
        roles.value = decoded?.roles || [];

        localStorage.setItem(AUTH_TOKEN_KEY, at);
        localStorage.setItem(REFRESH_TOKEN_KEY, rt);
        localStorage.setItem(USERNAME_KEY, un);

        setAxiosAuthHeader(at);
        authError.value = null;
    }

    function clearAuthData() {
        accessToken.value = null;
        refreshToken.value = null;
        username.value = null;
        roles.value = [];

        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USERNAME_KEY);

        setAxiosAuthHeader(null);
        authError.value = null;
    }

    // --- Actions ---
    const authApi = new AuthApi();

    async function login(un, pw) {
        try {
            authError.value = null;
            const result = await authApi.login(un, pw);
            if (result.ok) { setAuthData(result.value); return true; }
            authError.value = result.error.message;
            clearAuthData();
            return false;
        } catch {
            authError.value = 'An unexpected error occurred during login.';
            clearAuthData();
            return false;
        }
    }

    function logout() {
        clearAuthData();
        redirectPath.value = null;
    }

    function checkAuth() {
        const token = accessToken.value;
        if (!token) { clearAuthData(); return; }
        const decoded = decodeToken(token);
        if (decoded && decoded.exp * 1000 > Date.now()) {
            roles.value = decoded.roles || [];
            setAxiosAuthHeader(token);
            authError.value = null;
        } else {
            clearAuthData();
        }
    }

    function setRedirect(path) { redirectPath.value = path; }
    function popRedirect() { const p = redirectPath.value; redirectPath.value = null; return p || '/worklist'; }

    return {
        accessToken, refreshToken, username, roles, authError, redirectPath,
        isAuthenticated, isAdmin,
        login, logout, checkAuth, setRedirect, popRedirect,
    };
});
