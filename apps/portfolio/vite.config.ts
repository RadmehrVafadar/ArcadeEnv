import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/portfolio/',
  server: {
    hmr: {
      clientPort: Number(process.env.ARCADE_PORT || 5173),
      path: '__hmr',
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        game: 'src/portfolio-game/game.html',
        blog: 'src/blog-website/blog.html',
      },
    },
  },
})
