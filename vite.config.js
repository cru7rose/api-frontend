import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    proxy: {
      // Proxy all /api requests (This is correct)
      '/api': {
        target: 'https://api.danxils.com',
        changeOrigin: true,
        secure: true,
      },
      // Proxy all /auth requests
      '/auth': {
        target: 'https://api.danxils.com',
        changeOrigin: true,
        secure: true,
        // *** REMOVED rewrite rule ***
        // This will now correctly proxy /auth/login to https://api.danxils.com/auth/login
      },
      // Proxy requests from /nominatim (Keep as is)
      '/nominatim': {
        target: 'http://10.105.0.188:5001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/nominatim/, ''),
      },
      // Proxy requests from /osrm (Keep as is)
      '/osrm': {
        target: 'http://10.105.0.188:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/osrm/, ''),
      }
    }
  }
})