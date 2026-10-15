import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: ['es2018', 'chrome70', 'edge79', 'firefox65', 'safari12']
  }
})
