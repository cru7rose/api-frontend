// ============================================================================
// Frontend: Fix authStore.js store (Supersedes previous version)
// FILE: src/stores/authStore.js
// REASON: Corrects the import for the API client (default export)
//         and uses the correct method for setting the auth header.
//         (This file is a duplicate of auth.js but required by other imports)
// ============================================================================
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { jwtDecode } from 'jwt-decode';
import { AuthApi } from '@/services/AuthApi';
// *** THIS IS THE FIX ***
import apiClient from '@/services/Api.js'; // <-- Import the default export
// *** END FIX ***

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

  // --- Internal Helpers ---
  function _decodeToken(token) {
    try {
      return jwtDecode(token);
    } catch (e) {
      console.error("Failed to decode token:", e);
      return null;
    }
  }

  function _setAuthData(authData) {
    const token = authData.accessToken;
    const refToken = authData.refreshToken;
    const user = authData.username;
    const decoded = _decodeToken(token);

    accessToken.value = token;
    refreshToken.value = refToken;
    username.value = user;
    roles.value = decoded?.roles || [];

    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refToken);
    localStorage.setItem(USERNAME_KEY, user);

    // --- FIX: Set header on the imported axios instance ---
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete apiClient.defaults.headers.common['Authorization'];
    }
    // --- END FIX ---

    authError.value = null;
  }

  function _clearAuthData() {
    accessToken.value = null;
    refreshToken.value = null;
    username.value = null;
    roles.value = [];

    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);

    // --- FIX: Clear the auth header ---
    delete apiClient.defaults.headers.common['Authorization'];
    // --- END FIX ---

    authError.value = null;
  }

  // --- Actions ---
  const authApi = new AuthApi();

  async function login(username, password) {
    try {
      authError.value = null;
      const result = await authApi.login(username, password);

      if (result.ok) {
        _setAuthData(result.value);
        return true;
      } else {
        authError.value = result.error.message;
        _clearAuthData();
        return false;
      }
    } catch (e) {
      authError.value = "An unexpected error occurred during login.";
      _clearAuthData();
      return false;
    }
  }

  function logout() {
    _clearAuthData();
    redirectPath.value = null; // Clear redirect path on logout
  }

  function checkAuth() {
    // This is called on app load
    const token = accessToken.value;
    if (token) {
      const decoded = _decodeToken(token);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        // Token is valid and not expired
        roles.value = decoded.roles || [];
        // --- FIX: Set header on the imported axios instance ---
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        // --- END FIX ---
        authError.value = null;
      } else {
        // Token is expired or invalid
        console.warn("Auth token is expired or invalid, logging out.");
        _clearAuthData();
      }
    } else {
      _clearAuthData();
    }
  }

  function setRedirect(path) {
    redirectPath.value = path;
  }

  function popRedirect() {
    const path = redirectPath.value;
    redirectPath.value = null;
    return path || '/worklist'; // Default redirect
  }

  return {
    accessToken,
    refreshToken,
    username,
    roles,
    authError,
    redirectPath,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    checkAuth,
    setRedirect,
    popRedirect,
  };
});