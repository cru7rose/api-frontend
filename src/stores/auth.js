// Pinia auth store with checkAuth(), login(), logout()
// Uses a single axios instance configured to cooperate with Nginx/Vite proxy.

import { defineStore } from 'pinia'
import api from '@/services/api' // your axios singleton (baseURL="/", withCredentials=true)

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,          // { username, roles:[] }
        token: null,         // optional if you use cookie session
        redirectAfterLogin: null,
        loading: false,
        error: null,
    }),

    getters: {
        isAuthenticated: (s) => !!s.user,
        isAdmin: (s) => Array.isArray(s.user?.roles) && s.user.roles.includes('ADMIN'),
        username: (s) => s.user?.username || null,
    },

    actions: {
        setRedirect(path) {
            this.redirectAfterLogin = path || null
        },

        async checkAuth() {
            // Hit a lightweight “me” endpoint if you have one; otherwise piggyback orders/me/etc.
            // If you don’t have /auth/me, this will gracefully no-op and keep the app usable.
            try {
                this.loading = true
                this.error = null

                // Prefer: /auth/me
                const res = await api.get('/auth/me').catch(() => null)
                if (res?.status === 200 && res.data) {
                    this.user = {
                        username: res.data.username ?? res.data.name ?? 'user',
                        roles: res.data.roles ?? [],
                    }
                    return true
                }

                // Fallback: consider not authenticated
                this.user = null
                return false
            } finally {
                this.loading = false
            }
        },

        async login({ username, password }) {
            try {
                this.loading = true
                this.error = null

                // Your backend path is EXACTLY /auth/login
                const res = await api.post('/auth/login', { username, password })
                // If backend sets cookie, no token is needed; if it returns JWT, capture it:
                if (res.data?.token) this.token = res.data.token

                // Optionally fetch profile
                await this.checkAuth()
                return { ok: true }
            } catch (e) {
                this.error = e.message || 'Login failed'
                return { ok: false, error: this.error }
            } finally {
                this.loading = false
            }
        },

        async logout() {
            try {
                await api.post('/auth/logout') // your backend path
            } catch (_) {
                // ignore
            } finally {
                this.user = null
                this.token = null
            }
        },
    },
})
