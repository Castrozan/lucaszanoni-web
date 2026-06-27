import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vitest/config";

const projectRootDirectory = resolve(
  fileURLToPath(import.meta.url),
  "..",
);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@/core": resolve(projectRootDirectory, "./src/modules/core"),
      "@/intent": resolve(projectRootDirectory, "./src/modules/intent"),
      "@/specification": resolve(projectRootDirectory, "./src/modules/specification"),
      "@/conversation": resolve(projectRootDirectory, "./src/modules/conversation"),
      "@/agent": resolve(projectRootDirectory, "./src/modules/agent"),
      "@/multimodal": resolve(projectRootDirectory, "./src/modules/multimodal"),
      "@/composition": resolve(projectRootDirectory, "./src/modules/composition"),
      "@/adaptive": resolve(projectRootDirectory, "./src/modules/adaptive"),
      "@": resolve(projectRootDirectory, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/**/*.d.ts"],
    },
  },
});
