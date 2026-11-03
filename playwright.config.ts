import { defineConfig, devices } from "@playwright/test";

/**
 * Happy-path e2e against the dev servers.
 *
 * Uses the locally installed Chrome (`channel: "chrome"`) so no browser
 * download is needed. In CI, run `npx playwright install chromium` and drop
 * the channel to use the bundled browser instead.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://localhost:5173",
    channel: "chrome",
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "npm run dev:web",
      url: "http://localhost:5173",
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: "npm run dev:api",
      url: "http://127.0.0.1:3001/api/health",
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
