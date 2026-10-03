import { defineConfig, devices } from "@playwright/test";

// Smoke tests run against the static export in ./out (what Vercel serves).
// Several checkouts (agent worktrees) may run e2e at once: set PW_PORT per checkout. A server is
// never reused, so a busy port fails loudly instead of silently testing another checkout's build.
const PORT = Number(process.env.PW_PORT) || 4173;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `node scripts/serve-static.mjs out ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
