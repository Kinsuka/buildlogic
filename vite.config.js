import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/buildlogic/',
  test: {
    exclude: [
      "tests/e2e/**",
      "node_modules/**",
      "dist/**",
    ],
  },
})
