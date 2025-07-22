// Plik: src/stores/authStore.js
import { defineStore } from 'pinia';
import apiClient from '@/services/api.js';
import router from '@/router'; // ZAIMPORTUJ ROUTER

export const useAuthStore = defineStore('auth', {
  // ... state, getters ...
  state: () => ({
    accessToken: localStorage.getItem('accessToken') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
    user: JSON.parse(localStorage.getItem('user')) || { username: null, roles: [] },
  }),
  getters: {
    isLoggedIn: (state) => !!state.accessToken,
    userRoles: (state) => {
      return state.user && Array.isArray(state.user.roles) ? state.user.roles : [];
    },
    isAdmin: (state) => { // Zmieniono z userHasRole('ADMIN') na bezpośrednie sprawdzenie
      return state.user && Array.isArray(state.user.roles) && state.user.roles.includes('ADMIN');
    },
  },
  actions: {
    // ... (login, refreshTokenAction, changePassword - jak w VUE.txt, ale bez this.router)

    logoutSilently() {
      this.accessToken = null;
      this.refreshToken = null;
      this.user = { username: null, roles: [] };
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      delete apiClient.defaults.headers.common['Authorization'];
    },
    logout() {
      this.logoutSilently();
      router.push('/login'); // UŻYJ ZAIMPORTOWANEGO ROUTERA
    },
    // ... (reszta akcji - login, refreshTokenAction, changePassword, userHasRole)
    // Skopiujmy je z poprzedniej poprawionej wersji errorStore.js dla kompletności
    async login(credentials) {
      try {
        const response = await apiClient.post('/auth/login', credentials);
        if (response.data && response.data.accessToken) {
          const { accessToken, refreshToken, username, roles } = response.data;
          this.accessToken = accessToken;
          this.refreshToken = refreshToken;
          this.user = {
            username: username || credentials.username,
            roles: Array.isArray(roles) ? roles : []
          };
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          localStorage.setItem('user', JSON.stringify(this.user));
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          return Promise.resolve(response.data);
        } else {
          throw new Error('Odpowiedź API nie zawiera tokenu dostępu.');
        }
      } catch (error) {
        console.error('Błąd logowania w authStore:', error.response?.data || error.message);
        this.logoutSilently(); // Wyloguj po błędzie
        let errorMessage = 'Nie udało się zalogować.';
        if (error.response && error.response.data) {
            if (typeof error.response.data === 'string') errorMessage = error.response.data;
            else if (error.response.data.message) errorMessage = error.response.data.message;
            else if (error.response.data.error) errorMessage = error.response.data.error;
        } else if (error.message) {
            errorMessage = error.message;
        }
        throw new Error(errorMessage);
      }
    },
    async refreshTokenAction() {
      if (!this.refreshToken) {
        this.logout(); // Tutaj wywołanie this.logout() jest OK, bo ono użyje zaimportowanego routera
        return Promise.reject(new Error('Brak refresh tokenu. Wymagane ponowne logowanie.'));
      }
      try {
        const response = await apiClient.post('/auth/refresh', { refreshToken: this.refreshToken });
        if (response.data && response.data.accessToken) {
          const { accessToken, username, roles } = response.data; // Zakładamy, że refresh też zwraca username i roles
          this.accessToken = accessToken;
          localStorage.setItem('accessToken', accessToken);
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
           if (username && roles) { // Aktualizuj dane użytkownika, jeśli są w odpowiedzi
            this.user = { username, roles: Array.isArray(roles) ? roles : [] };
            localStorage.setItem('user', JSON.stringify(this.user));
          }
          return Promise.resolve(accessToken);
        } else {
          throw new Error('Odpowiedź API odświeżania nie zawiera nowego tokenu dostępu.');
        }
      } catch (error) {
        console.error('Błąd odświeżania tokenu:', error.response?.data || error.message);
        this.logout(); // Tutaj też OK
        throw new Error('Sesja wygasła lub refresh token jest nieprawidłowy. Proszę zalogować się ponownie.');
      }
    },
    async changePassword(payload) {
      if (!this.isLoggedIn) {
        throw new Error("Użytkownik nie jest zalogowany.");
      }
      try {
        const requestBody = {
          oldPassword: payload.oldPassword,
          newPassword: payload.newPassword,
          confirmNewPassword: payload.confirmNewPassword
        };
        const response = await apiClient.post('/auth/change-password', requestBody);
        return Promise.resolve(response.data);
      } catch (error) {
        console.error('Błąd podczas zmiany hasła w authStore:', error.response?.data || error.message);
        let errorMessage = 'Nie udało się zmienić hasła.';
         if (error.response && error.response.data) {
            if (typeof error.response.data === 'string') errorMessage = error.response.data;
            else if (error.response.data.message) errorMessage = error.response.data.message;
            else if (Array.isArray(error.response.data.details) && error.response.data.details.length > 0) errorMessage = error.response.data.details.join(' ');
            else if (error.response.data.error) errorMessage = error.response.data.error;
        } else if (error.message) {
            errorMessage = error.message;
        }
        throw new Error(errorMessage);
      }
    },
    userHasRole(roleName) {
      if (this.user && Array.isArray(this.user.roles)) {
        return this.user.roles.some(role => role.toUpperCase() === roleName.toUpperCase());
      }
      return false;
    }
  },
});