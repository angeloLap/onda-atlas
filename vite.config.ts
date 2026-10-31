import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.VITE_BASE || "/",
  plugins: [react()],
  server: {
    port: 5173,
    allowedHosts: [".trycloudflare.com"],
  },
  preview: {
    port: 4173,
    allowedHosts: [".trycloudflare.com"],
  },
});
