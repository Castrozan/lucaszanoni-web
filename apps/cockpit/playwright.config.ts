import { defineConfig, devices } from "@playwright/test";

const cockpitPreviewPort = 4173;
const cockpitBaseUrl = `http://localhost:${cockpitPreviewPort}`;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: cockpitBaseUrl,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `pnpm exec vite --port ${cockpitPreviewPort} --strictPort`,
    url: `${cockpitBaseUrl}/cockpit/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      VITE_COCKPIT_SESSIONS: "global:Jarvis,build:Build",
      VITE_COCKPIT_MACHINES: "local:Local:ws://localhost:8787/session",
    },
  },
});
