import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";
import appRegistry from "../../packages/config/src/app-registry.json";

const reportsMountPath = appRegistry.find(
  (registryEntry) => registryEntry.id === "reports",
)?.mountPath;

if (!reportsMountPath) {
  throw new Error("no app-registry entry with id reports");
}

export default defineConfig({
  base: reportsMountPath,
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    include: ["tests/**/*.spec.{ts,tsx}"],
  },
});
