import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Send /api requests to the Flask backend while developing
  server: {
    proxy: {
      "/api": "http://localhost:5001",
    },
  },
});
