import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";
import appRegistry from "../../packages/config/src/app-registry.json";

const cockpitMountPath = appRegistry.find(
  (registryEntry) => registryEntry.id === "cockpit",
)?.mountPath;

if (!cockpitMountPath) {
  throw new Error("no app-registry entry with id cockpit");
}

export default defineConfig({
  base: cockpitMountPath,
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    include: ["tests/**/*.spec.{ts,tsx}"],
  },
});
