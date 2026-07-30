import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "pwa-production.spec.ts",
  timeout: 60_000,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:5173"
  },
  webServer: {
    command: "npm.cmd run preview -- --host 127.0.0.1 --port 5173 --strictPort",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: false
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }]
});
