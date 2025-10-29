// ============================================================================
// Frontend: Fix vite.config.js
// FILE: vite.config.js (Supersedes previous version)
// REASON: Removes syntax error (stray URL at the end of the file)
//         and confirms proxy rewrite for /auth is removed.
// ============================================================================
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

/**
 * ARCHITECTURE: Vite configuration file.
 * Configures the development server to proxy all API and auth requests
 * to the single canonical backend domain: 'https://api.danxils.com'.
 * This resolves development-time 403/CORS errors by forwarding
 * requests from 'localhost:5173' to the correct backend.
 */
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
      // Proxy all /api requests to the production domain
      '/api': {
        target: 'https://api.danxils.com', // Use the canonical domain
        changeOrigin: true, // Required for proxying to a different domain
        secure: true,       // Assuming production domain uses HTTPS
      },
      // Proxy all /auth requests to the production domain
      '/auth': {
        target: 'https://api.danxils.com', // Use the canonical domain
        changeOrigin: true,
        secure: true,
        // Removed rewrite: (path) => path.replace(/^\/auth/, '/api/auth')
      },
      // Proxy requests from /nominatim to your Nominatim server
      '/nominatim': {
        target: 'http://10.105.0.188:5001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/nominatim/, ''),
      },
      // Proxy requests from /osrm to your OSRM server
      '/osrm': {
        target: 'http://10.105.0.188:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/osrm/, ''),
      }
    }
  }
})
