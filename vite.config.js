// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// read backend URL from .env file, fallback to localhost:8000
const BACKEND = process.env.VITE_BACKEND_URL || 'http://localhost:8000'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // same as '0.0.0.0', lets LAN/mobile connect
    port: 5173,
    proxy: {
      '/api': {
        target: BACKEND,        // dynamically from env
        changeOrigin: true,
      },
    },
  },
})
