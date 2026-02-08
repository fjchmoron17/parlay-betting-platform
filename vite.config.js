import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
    }
  preview: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: [
      'parlay-betting-platform-production.up.railway.app',
      'localhost',
      '127.0.0.1'
    ]
  },
  build: {
    sourcemap: false
  }
})
