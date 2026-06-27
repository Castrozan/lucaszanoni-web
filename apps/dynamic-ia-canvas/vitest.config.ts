import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@/core": resolve(__dirname, "src/modules/core"),
      "@/canvas": resolve(__dirname, "src/modules/canvas"),
      "@/sandbox": resolve(__dirname, "src/modules/sandbox"),
      "@/generation": resolve(__dirname, "src/modules/generation"),
      "@/catalog": resolve(__dirname, "src/modules/catalog"),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: [],
  },
});
