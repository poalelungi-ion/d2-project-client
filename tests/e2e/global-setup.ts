import { request } from '@playwright/test';

import { API_TARGET } from '../../playwright.config';

/**
 * Blocks until the backend answers. In CI it is a service container that has
 * to run Alembic migrations against a freshly created database before it
 * serves anything, so the first request can be a good few seconds after the
 * job starts.
 */
async function waitForApi(timeoutMs = 120_000): Promise<void> {
  const api = await request.newContext({ baseURL: API_TARGET });
  const deadline = Date.now() + timeoutMs;
  let lastError = 'no attempt made';

  try {
    while (Date.now() < deadline) {
      try {
        const response = await api.get('/', { timeout: 5_000 });
        if (response.ok()) return;
        lastError = `HTTP ${response.status()}`;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      }
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
  } finally {
    await api.dispose();
  }

  throw new Error(
    `Backend at ${API_TARGET} did not become ready within ${timeoutMs / 1000}s. ` +
      `Last attempt: ${lastError}. Start it with: docker compose -f docker-compose.e2e.yml up -d`,
  );
}

export default async function globalSetup(): Promise<void> {
  // Namespaces this run's accounts. Workers read it from the environment they
  // inherit, so every worker in one run agrees on it while two runs against
  // the same database never collide.
  process.env.E2E_RUN_ID ??= Date.now().toString(36);
  await waitForApi();
}
