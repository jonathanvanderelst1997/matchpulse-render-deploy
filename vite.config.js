import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'node:process'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/react') || id.includes('/node_modules/react-dom')) return 'react'
          if (id.includes('/node_modules/@supabase')) return 'supabase'
          if (id.includes('/node_modules/lucide-react')) return 'icons'
          if (id.includes('/node_modules/')) return 'vendor'
        },
      },
    },
  },
  server: {
    host: process.env.MATCHPULSE_HOST ?? '127.0.0.1',
    proxy: {
      '/api': 'http://127.0.0.1:8787',
      '/uploads': 'http://127.0.0.1:8787',
    },
  },
})
