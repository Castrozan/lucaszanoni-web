import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";
import appRegistry from "../../packages/config/src/app-registry.json";

const workspaceMountPath = appRegistry.find(
  (registryEntry) => registryEntry.id === "workspace",
)?.mountPath;

if (!workspaceMountPath) {
  throw new Error("no app-registry entry with id workspace");
}

export default defineConfig({
  base: workspaceMountPath,
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    include: ["tests/**/*.spec.{ts,tsx}"],
  },
});
