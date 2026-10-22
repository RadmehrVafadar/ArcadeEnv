import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { portfolioProxy } from '../../scripts/portfolio-proxy.mjs'

// Vercel serves at the root path; use default base '/'
export default defineConfig({
  plugins: [react(), portfolioProxy()],
  base: '/',
  envDir: '../..',
  // Preview serves the assembled portfolio instead of inheriting the dev proxy.
  preview: { proxy: {} },
})


