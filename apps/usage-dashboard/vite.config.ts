import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";
import appRegistry from "../../packages/config/src/app-registry.json";

const usageDashboardMountPath = appRegistry.find(
  (registryEntry) => registryEntry.id === "usage-dashboard",
)?.mountPath;

if (!usageDashboardMountPath) {
  throw new Error("no app-registry entry with id usage-dashboard");
}

export default defineConfig({
  base: usageDashboardMountPath,
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.spec.{ts,tsx}"],
  },
});
