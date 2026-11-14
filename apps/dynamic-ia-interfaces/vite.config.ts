import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";
import appRegistry from "../../packages/config/src/app-registry.json" with { type: "json" };

const dynamicInterfacesMountPath = appRegistry.find(
  (registryEntry) => registryEntry.id === "dynamic-ia-interfaces",
)?.mountPath;

if (!dynamicInterfacesMountPath) {
  throw new Error("no app-registry entry with id dynamic-ia-interfaces");
}

export default defineConfig({
  base: dynamicInterfacesMountPath,
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
