/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // Route /api through the local Express server so it can inject the
      // server-side OpenRouter key. The browser never holds a credential.
      '/api': {
        target:
          process.env.VITE_DEV_PROXY_TARGET ||
          `http://localhost:${process.env.PORT || 3200}`,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
