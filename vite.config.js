import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// If deploying to https://<USER>.github.io/<REPO>/, set base to '/<REPO>/'
// This project folder name appears to be 'arcadeEnv'
export default defineConfig({
  plugins: [react()],
  base: '/arcadeEnv/',
})


