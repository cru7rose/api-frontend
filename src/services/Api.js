// ============================================================================
// Axios Client: Simple, Reliable, Same-Origin
// Back-end endpoints (expose):   /auth/login, /auth/refresh, /worklist, ...
// Front-end calls (use):         api.get('/auth/login')  → nginx → backend
// ============================================================================

import axios from 'axios';

const api = axios.create({
  baseURL: '/',                     // ✅ NO "/api" prefix
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Nice readable errors:
api.interceptors.response.use(
    response => response,
    error => {
      error.message =
          error?.response?.data?.message ||
          error.message ||
          'Request failed';
      return Promise.reject(error);
    }
);

export default api;
