import { test as base, expect, request, type Page } from '@playwright/test';

import { API_TARGET } from '../../../playwright.config';

export interface E2EAccount {
  email: string;
  password: string;
  name: string;
}

const PASSWORD = 'e2e-password-1234';

interface WorkerFixtures {
  account: E2EAccount;
}

interface TestFixtures {
  /** Signs the given page in as this worker's account, through the real form. */
  signIn: (page: Page) => Promise<void>;
}

/**
 * Every worker gets its own account
 * Refresh tokens rotate on each use, and the backend revokes *every* session
 * for an account when a rotated token is replayed 
 */
export const test = base.extend<TestFixtures, WorkerFixtures>({
  account: [
    async ({ }, use, workerInfo) => {
      const runId = process.env.E2E_RUN_ID ?? 'local';
      const account: E2EAccount = {
        email: `e2e.w${workerInfo.workerIndex}.${runId}@uni-hildesheim.de`,
        name: `E2E Worker ${workerInfo.workerIndex}`,
        password: PASSWORD,
      };

      const api = await request.newContext({ baseURL: API_TARGET });
      try {
        const response = await api.post('/api/auth/register', { data: account });
        // 409 means a previous local run already created it, which is fine.
        if (!response.ok() && response.status() !== 409) {
          throw new Error(
            `Could not register ${account.email}: HTTP ${response.status()} ${await response.text()}`,
          );
        }
      } finally {
        await api.dispose();
      }

      await use(account);
    },
    { scope: 'worker' },
  ],

  signIn: async ({ account }, use) => {
    await use(async (page: Page) => {
      await page.goto('/login');
      await fillCredentials(page, account.email, account.password);
      await page.getByRole('button', { name: 'Sign in' }).click();
      await expect(page).toHaveURL(/\/dashboard$/);
    });
  },
});

/**
 * `Password` on its own would also match `Confirm password` on the
 * registration form, so both fields are matched exactly.
 */
export async function fillCredentials(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.getByLabel('University email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
}

export { expect };
