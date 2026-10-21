import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vercel serves at the root path; use default base '/'
export default defineConfig({
  plugins: [react()],
  base: '/',
  envDir: '../..',
  // Preview serves the assembled portfolio instead of inheriting the dev proxy.
  preview: { proxy: {} },
  server: {
    proxy: {
      '/portfolio/': {
        target: `http://127.0.0.1:${process.env.PORTFOLIO_PORT || 5174}`,
        ws: true,
      },
    },
  },
})


