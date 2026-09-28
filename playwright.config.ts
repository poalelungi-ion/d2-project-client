import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end suite. Drives a real browser against the built client, a real
 * backend and a real PostgreSQL -- the seam the unit suites cannot reach:
 * the client's runs in jsdom with no server, the backend's against SQLite
 * through FastAPI's TestClient.
 *
 * The stack comes from docker-compose.e2e.yml locally and from GitLab
 * `services:` in CI. Both expose the API at E2E_API_TARGET.
 */

/** Where `vite preview` serves the built bundle. */
export const APP_URL = process.env.E2E_APP_URL ?? 'http://localhost:5173';

/**
 * Origin of the backend, without the /api prefix. The client bundle does not
 * talk to this directly -- it calls a relative /api, which the preview server
 * proxies here (see vite.config.ts). That keeps the browser on a single
 * origin, so the refresh cookie is same-site and SameSite=lax behaves as it
 * does in local development. Tests that seed or assert over HTTP use it
 * directly, where no cookie policy applies.
 */
export const API_TARGET = process.env.E2E_API_TARGET ?? 'http://localhost:8000';

export default defineConfig({
  testDir: './tests/e2e/specs',
  globalSetup: './tests/e2e/global-setup.ts',

  // Each spec signs in as its own worker's account, so specs never share a
  // session. See tests/e2e/fixtures/auth.ts for why that matters.
  fullyParallel: true,

  // A retry masks a real failure as easily as a flake, so the rule is: any
  // spec that needs one gets an issue the same day or gets test.fixme'd.
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,

  // Fails the run if a test.only is committed by accident.
  forbidOnly: !!process.env.CI,

  reporter: process.env.CI
    ? [
        ['list'],
        ['junit', { outputFile: 'e2e-junit.xml' }],
        ['json', { outputFile: 'playwright-results.json' }],
        ['html', { open: 'never' }],
      ]
    : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: APP_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  webServer: {
    // Serves dist/, so the suite runs the same bundle a deployment would.
    // `npm run test:e2e` builds first; CI builds in its own step.
    command: 'npm run preview -- --port 5173 --strictPort',
    url: APP_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
