import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Use VITE_BACKEND_URL from .env file, or default to 8082 (dev profile with H2)
  const backendTarget = env.VITE_BACKEND_URL || 'http://localhost:8082'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/swagger-ui': {
          target: backendTarget,
          changeOrigin: true,
        },
        '/v3/api-docs': {
          target: backendTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
