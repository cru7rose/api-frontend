import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // Frontend calls /api/... → rewrite to backend without /api prefix
      '/api': {
        target: 'https://api.danxils.com',
        changeOrigin: true,
        secure: true,
        // critical: strip /api → backend sees /auth/login, not /api/auth/login
        rewrite: (path) => path.replace(/^\/api(?=\/|$)/, ''),
        headers: { Host: 'api.danxils.com' },
      },
      // If you also call /auth/... directly, keep it too (optional)
      '/auth': {
        target: 'https://api.danxils.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/auth(?=\/|$)/, '/auth'),
        headers: { Host: 'api.danxils.com' },
      },
      // Geo helpers (unchanged intent)
      '/nominatim': {
        target: 'http://10.105.0.188:8083',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/nominatim/, ''),
      },
      '/osrm': {
        target: 'http://10.105.0.188:5000',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/osrm/, ''),
      },
    },
  },
})
