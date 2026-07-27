import { readFileSync } from "node:fs";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["tests/**/*.spec.{ts,tsx}"],
    provide: {
      selectionHighlightCss: readFileSync(
        new URL("src/styles/selection-highlight.css", import.meta.url),
        "utf8",
      ),
      tokenBridgeCss: readFileSync(
        new URL("src/styles/tailwind-token-bridge.css", import.meta.url),
        "utf8",
      ),
    },
  },
});
