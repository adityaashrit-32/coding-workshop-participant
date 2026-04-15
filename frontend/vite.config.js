import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Hardcoded Lambda URL — Vite proxy forwards /api/* to it server-side,
// so the browser never makes a cross-origin request and CORS is never an issue.
const LAMBDA = 'http://ai040u29i72tgtjgi41lk2cb6vv7x9fy.lambda-url.us-east-1.localhost.localstack.cloud:4566'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target:       LAMBDA,
        changeOrigin: true,
        rewrite:      (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
