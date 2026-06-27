import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";
import { execSync } from "node:child_process";
import appRegistry from "../../packages/config/src/app-registry.json";

const shellMountPath = appRegistry.find(
  (registryEntry) => registryEntry.id === "shell",
)?.mountPath;

if (!shellMountPath) {
  throw new Error("no app-registry entry with id shell");
}

function resolveBuildShortSha(): string {
  const fromEnvironment =
    process.env.ATRIUM_BUILD_SHA ?? process.env.GITHUB_SHA ?? "";
  if (fromEnvironment) {
    return fromEnvironment.slice(0, 7);
  }
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "";
  }
}

export default defineConfig({
  base: shellMountPath,
  plugins: [react(), tailwindcss()],
  define: {
    __ATRIUM_BUILD_SHA__: JSON.stringify(resolveBuildShortSha()),
    __ATRIUM_BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.spec.{ts,tsx}"],
  },
});
