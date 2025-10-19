// PLIK: src/stores/authStore.js
import { defineStore } from 'pinia';
import apiClient from '@/services/api';
import { jwtDecode } from 'jwt-decode';

/**
 * ARCHITEKTURA: Magazyn stanu (Pinia Store) odpowiedzialny za uwierzytelnianie i autoryzację.
 * Nie zależy od routera; komponenty nawigują po udanym logowaniu.
 */
export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: localStorage.getItem('accessToken') || null,
    refreshTokenValue: localStorage.getItem('refreshToken') || null,
    user: JSON.parse(localStorage.getItem('user')) || null,
    _isInitialized: false,
  }),
  getters: {
    isAuthenticated: (state) => !!state.accessToken,
  },
  actions: {
    async login(credentials) {
      try {
        const response = await apiClient.post('/auth/login', credentials);
        const { accessToken, refreshToken, username, roles } = response.data;

        this.accessToken = accessToken;
        this.refreshTokenValue = refreshToken;
        this.user = { username, roles };

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify({ username, roles }));

        return true;
      } catch (error) {
        this.logout();
        console.error("Błąd logowania:", error);
        throw new Error('Logowanie nie powiodło się. Sprawdź login i hasło.');
      }
    },

    async refreshToken() {
      if (!this.refreshTokenValue) {
        throw new Error("Brak refresh tokena do odświeżenia sesji.");
      }
      const response = await apiClient.post('/auth/refresh', { refreshToken: this.refreshTokenValue });
      const { accessToken } = response.data;
      this.accessToken = accessToken;
      localStorage.setItem('accessToken', accessToken);
      return accessToken;
    },

    logout() {
      this.accessToken = null;
      this.refreshTokenValue = null;
      this.user = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    },

    initializeAuth() {
      if (this.accessToken) {
        try {
          const decodedToken = jwtDecode(this.accessToken);
          if (decodedToken.exp * 1000 < Date.now()) {
            console.warn("Token wygasł przy inicjalizacji. Wylogowywanie.");
            this.logout();
          }
        } catch (error) {
          console.error("Błąd dekodowania tokena. Token jest nieprawidłowy. Wylogowywanie.", error);
          this.logout();
        }
      }
      this._isInitialized = true;
    }
  },
});
