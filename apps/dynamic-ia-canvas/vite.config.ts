import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";
import appRegistry from "../../packages/config/src/app-registry.json" with { type: "json" };

const dynamicCanvasMountPath = appRegistry.find(
  (registryEntry) => registryEntry.id === "dynamic-ia-canvas",
)?.mountPath;

if (!dynamicCanvasMountPath) {
  throw new Error("no app-registry entry with id dynamic-ia-canvas");
}

export default defineConfig({
  base: dynamicCanvasMountPath,
  plugins: [react(), tailwindcss()],
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    outDir: "dist/client",
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
