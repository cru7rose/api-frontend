// ============================================================================
// Frontend: Fix vite.config.js (For Local Development)
// FILE: vite.config.js
// REASON: Point /nominatim proxy to the new Nominatim service (port 8083),
//         not the OSRM port (5001).
// ============================================================================
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
      // Proxy all /api requests to the production domain
      '/api': {
        target: 'https://api.danxils.com', // Kept as requested
        changeOrigin: true,
        secure: true,
      },
      // Proxy all /auth requests to the production domain
      '/auth': {
        target: 'https://api.danxils.com', // Kept as requested
        changeOrigin: true,
        secure: true,
      },
      // Proxy requests from /nominatim to your NEW Nominatim server
      '/nominatim': {
        target: 'http://10.105.0.188:8083', // <-- FIX: Point to Nominatim, NOT 5001
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/nominatim/, ''),
      },
      // Proxy requests from /osrm to your OSRM server
      '/osrm': {
        target: 'http://10.105.0.188:5000', // This is correct
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/osrm/, ''),
      }
    }
  }
})