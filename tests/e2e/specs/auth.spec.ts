import { expect, fillCredentials, test } from '../fixtures/auth';

/**
 * Authentication, end to end.
 */

const COURSES = /\/courses$/;
const LOGIN = /\/login$/;

test.describe('signing in', () => {
  test('valid credentials reach courses', async ({ page, account, signIn }) => {
    await signIn(page);

    await expect(page).toHaveURL(COURSES);
    await expect(page.getByRole('heading', { name: /Analysis Hub/ })).toBeVisible();
    // Proves the session belongs to this account rather than merely existing.
    await page.getByRole('button', { name: 'Account menu' }).click();
    await expect(page.getByText(account.email)).toBeVisible();
  });

  test('a wrong password is refused and keeps the user on the form', async ({ page, account }) => {
    await page.goto('/login');
    await fillCredentials(page, account.email, 'definitely-not-the-password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    // The error is an inline MUI Alert above the form. A bare getByRole('alert')
    // would also match the app's global Snackbar, so it is scoped to the form.
    const form = page.locator('form');
    await expect(form.getByRole('alert')).toBeVisible();

    await expect(page).toHaveURL(LOGIN);
    await expect(page.getByRole('button', { name: 'Account menu' })).toHaveCount(0);
  });

  test('empty fields are caught before any request', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
    await expect(page).toHaveURL(LOGIN);
  });
});

test.describe('registering', () => {
  test('a new university account lands signed in', async ({ page }) => {
    // authStore.register() calls login() with the same credentials on success,
    // so a successful registration ends on the courses page, not back at the form.
    const email = `e2e.signup.${Date.now().toString(36)}@uni-hildesheim.de`;

    await page.goto('/register');
    await page.getByLabel('Full name').fill('Registration Test');
    await page.getByLabel('University email').fill(email);
    await page.getByLabel('Password', { exact: true }).fill('e2e-password-1234');
    await page.getByLabel('Confirm password').fill('e2e-password-1234');
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page).toHaveURL(COURSES);
    await expect(page.getByRole('heading', { name: /Analysis Hub/ })).toBeVisible();
  });

  test('an address outside the university domain is rejected', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel('Full name').fill('Outsider');
    await page.getByLabel('University email').fill('someone@gmail.com');
    await page.getByLabel('Password', { exact: true }).fill('e2e-password-1234');
    await page.getByLabel('Confirm password').fill('e2e-password-1234');
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(
      page.getByText('Use your university address, ending in @uni-hildesheim.de'),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/register$/);
  });

  test('mismatched passwords are caught', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel('Full name').fill('Typo Fingers');
    await page.getByLabel('University email').fill('typo@uni-hildesheim.de');
    await page.getByLabel('Password', { exact: true }).fill('e2e-password-1234');
    await page.getByLabel('Confirm password').fill('e2e-password-9999');
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });
});

test.describe('route guards', () => {
  test('an anonymous visit to a protected route returns there after signing in', async ({
    page,
    account,
  }) => {
    await page.goto('/courses');

    // RequireAuth bounces to the login screen, remembering where we were going.
    await expect(page).toHaveURL(LOGIN);

    await fillCredentials(page, account.email, account.password);
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Back to the original destination.
    await expect(page).toHaveURL(/\/courses$/);
  });

  test('a signed-in user is kept off the login screen', async ({ page, signIn }) => {
    await signIn(page);

    await page.goto('/login');

    await expect(page).toHaveURL(COURSES);
  });
});

test.describe('session lifetime', () => {
  test('the session survives a full page reload', async ({ page, signIn }) => {
    await signIn(page);

    await page.reload();

    // Nothing persists the access token, so surviving a reload proves the
    // refresh cookie was exchanged for a new session by SessionGate.
    await expect(page).toHaveURL(COURSES);
    await expect(page.getByRole('heading', { name: /Analysis Hub/ })).toBeVisible();
  });

  test('the refresh token is httpOnly, path-scoped, and invisible to scripts', async ({
    page,
    context,
    signIn,
  }) => {
    await signIn(page);

    const refreshCookie = (await context.cookies()).find((c) => c.name === 'spa_refresh_token');

    expect(refreshCookie, 'no spa_refresh_token cookie was set').toBeTruthy();
    expect(refreshCookie?.httpOnly).toBe(true);
    // Scoped to the auth router, so it is never attached to course or student
    // requests -- only the code that rotates it can ever see it.
    expect(refreshCookie?.path).toBe('/api/auth');

    // The point of httpOnly: script injected into the page cannot read it.
    const scriptVisible = await page.evaluate(() => document.cookie);
    expect(scriptVisible).not.toContain('spa_refresh_token');
  });

  test('signing out ends the session', async ({ page, signIn }) => {
    await signIn(page);

    await page.getByRole('button', { name: 'Account menu' }).click();
    await page.getByRole('menuitem', { name: 'Sign out' }).click();

    await expect(page).toHaveURL(LOGIN);

    // And the session is genuinely gone, not merely navigated away from.
    await page.goto('/courses');
    await expect(page).toHaveURL(LOGIN);

    const refreshCookie = (await page.context().cookies()).find(
      (c) => c.name === 'spa_refresh_token',
    );
    expect(refreshCookie, 'the refresh cookie outlived sign-out').toBeFalsy();
  });
});
