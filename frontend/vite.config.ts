import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    // In development, proxy API and upload requests to Flask backend
    proxy: mode === "development"
      ? {
          "/api": {
            target: "http://127.0.0.1:5000",
            changeOrigin: true,
          },
          "/uploads": {
            target: "http://127.0.0.1:5000",
            changeOrigin: true,
          },
        }
      : undefined,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
