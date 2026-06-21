import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";
import appRegistry from "../../packages/config/src/app-registry.json";

const shellMountPath = appRegistry.find(
  (registryEntry) => registryEntry.id === "shell",
)?.mountPath;

if (!shellMountPath) {
  throw new Error("no app-registry entry with id shell");
}

export default defineConfig({
  base: shellMountPath,
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.spec.{ts,tsx}"],
  },
});
