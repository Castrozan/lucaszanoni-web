import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";
import appRegistry from "../../packages/config/src/app-registry.json";

const stackLauncherMountPath = appRegistry.find(
  (registryEntry) => registryEntry.id === "stack-launcher",
)?.mountPath;

if (!stackLauncherMountPath) {
  throw new Error("no app-registry entry with id stack-launcher");
}

export default defineConfig({
  base: stackLauncherMountPath,
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    include: ["tests/**/*.spec.{ts,tsx}"],
  },
});
