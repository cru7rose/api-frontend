// ============================================================================
// Pinia Auth Store — unified, uses AuthApi; no '/api' anywhere
// ============================================================================
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { jwtDecode } from 'jwt-decode';
import api from '@/services/Api.js';
import { AuthApi } from '@/services/AuthApi';

const AUTH_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USERNAME_KEY = 'auth_username';

export const useAuthStore = defineStore('auth', () => {
    const accessToken = ref(localStorage.getItem(AUTH_TOKEN_KEY) || null);
    const refreshToken = ref(localStorage.getItem(REFRESH_TOKEN_KEY) || null);
    const username = ref(localStorage.getItem(USERNAME_KEY) || null);
    const roles = ref([]);
    const authError = ref(null);
    const redirectPath = ref(null);

    const isAuthenticated = computed(() => !!accessToken.value);
    const isAdmin = computed(() => roles.value.includes('ADMIN'));

    const setAxiosAuthHeader = (token) => {
        if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        else delete api.defaults.headers.common['Authorization'];
    };

    const decode = (t) => { try { return jwtDecode(t); } catch { return null; } };

    function setAuthData({ accessToken: at, refreshToken: rt, username: un }) {
        accessToken.value = at;
        refreshToken.value = rt;
        username.value = un ?? username.value;

        const decoded = decode(at);
        roles.value = decoded?.roles || [];

        localStorage.setItem(AUTH_TOKEN_KEY, at);
        localStorage.setItem(REFRESH_TOKEN_KEY, rt ?? '');
        if (un) localStorage.setItem(USERNAME_KEY, un);

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

    const authApi = new AuthApi();

    async function login(un, pw) {
        try {
            authError.value = null;
            const result = await authApi.login(un, pw);
            if (result.ok) { setAuthData(result.value); return true; }
            authError.value = result.error?.message ?? 'Login failed';
            clearAuthData();
            return false;
        } catch (e) {
            authError.value = e?.message || 'Login failed';
            clearAuthData();
            return false;
        }
    }

    async function refresh() {
        if (!refreshToken.value) return false;
        try {
            const result = await authApi.refresh(refreshToken.value);
            if (result.ok) { setAuthData(result.value); return true; }
        } catch { /* ignore */ }
        clearAuthData();
        return false;
    }

    function logout() {
        try { authApi.logout(); } catch { /* ignore */ }
        clearAuthData();
        redirectPath.value = null;
    }

    function checkAuth() {
        const t = accessToken.value;
        if (!t) { clearAuthData(); return; }
        const decoded = decode(t);
        if (decoded && decoded.exp * 1000 > Date.now()) {
            roles.value = decoded.roles || [];
            setAxiosAuthHeader(t);
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
        login, refresh, logout, checkAuth, setRedirect, popRedirect,
    };
});
