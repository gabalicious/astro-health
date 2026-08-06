import { defineConfig, devices } from '@playwright/test';

// Not 4321: a live dev server must never be mistaken for the built app.
const port = 4322;

export default defineConfig({
  testDir: 'e2e',
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  use: { baseURL: `http://localhost:${port}` },
  webServer: {
    // CI builds in its own step; locally `pnpm e2e` is self-contained.
    command: process.env.CI
      ? `pnpm preview --port ${port}`
      : `pnpm build && pnpm preview --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
