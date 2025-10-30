// ============================================================================
// Axios Client — same-origin, no /api prefix
// ============================================================================
import axios from 'axios';

const api = axios.create({
    baseURL: '/', // ← do NOT use '/api'
    withCredentials: true,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    },
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        err.message = err?.response?.data?.message || err.message || 'Request failed';
        return Promise.reject(err);
    }
);

export default api;
