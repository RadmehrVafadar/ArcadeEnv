import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vercel serves at the root path; use default base '/'
export default defineConfig({
  plugins: [react()],
  base: "/",
  build: {
    chunkSizeWarningLimit: 850,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          three: ["three", "@react-three/fiber"],
          drei: ["@react-three/drei"],
        },
      },
    },
  },
});

