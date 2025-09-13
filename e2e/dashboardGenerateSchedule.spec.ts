import { test, expect, waitForAuthReady } from './fixtures/auth';

// Validates the Step 4 generate schedule path on the dashboard when a program exists but is NOT scheduled.
// Preconditions:
// - Seed unscheduled program for the E2E user using `pnpm seed:e2e:unscheduled`
// - Dev server running (playwright.config.ts baseURL)

test.describe('Dashboard Step 4 - Generate Schedule path', () => {
  test('Shows Generate Schedule and produces calendar after generation', async ({ page }) => {
    await page.goto('/dashboard');

    // Ensure auth tokens are processed and network is idle before asserting UI
    await waitForAuthReady(page);
    await page.waitForLoadState('networkidle');

    // Early fail if redirected to login; dump auth storage when DEBUG_E2E_AUTH is set
    if (page.url().includes('/login')) {
      const dump = await page.evaluate(() => ({
        href: location.href,
        keys: Object.keys(localStorage),
        sbKeys: Object.keys(localStorage).filter(k => /^sb-.*-auth-token$/.test(k)),
        values: Object.fromEntries(Object.keys(localStorage).map(k => [k, localStorage.getItem(k)])),
      }));
      if (process.env.DEBUG_E2E_AUTH) console.log('Auth debug:', dump);
      throw new Error('Redirected to /login - auth mock failed. Check auth fixture and NEXT_PUBLIC_SUPABASE_URL.');
    }

    // Dashboard Heading
    await expect(page.getByRole('heading', { name: 'Your Dashboard' })).toBeVisible();

    // Step 4 rendering (unscheduled state)
    await expect(page.getByRole('heading', { name: 'Schedule Your Sessions' })).toBeVisible();

    // Generate Schedule CTA visible
    const genBtn = page.getByRole('button', { name: 'Generate Schedule' });
    await expect(genBtn).toBeVisible();

    // Click to generate
    await genBtn.click();

    // Expect success UI (text or calendar appears). Be tolerant on implementations.
    // If a toast message is used:
    const successText = page.getByText('Schedule generated.');
    await successText.waitFor({ state: 'visible', timeout: 20000 }).catch(() => null);

    // Calendar should appear
    const calendar = page.locator('.fc');
    await expect(calendar.first()).toBeVisible({ timeout: 20000 });
  });
});
