import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vercel serves at the root path; use default base '/'
export default defineConfig({
  plugins: [react()],
  base: '/',
})


