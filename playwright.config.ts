import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://localhost:3210";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  reporter: "list",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npx wrangler d1 migrations apply agenda-link-db --local && npm run dev -- --port 3210",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      SESSION_SIGNING_SECRET: "local-e2e-session-secret-at-least-32-characters",
    },
  },
});
