import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Proxy ke backend FastAPI supaya tidak perlu setup CORS di v1
    proxy: {
      "/api": "http://127.0.0.1:8000",
    },
  },
});
