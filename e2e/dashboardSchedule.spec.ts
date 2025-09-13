import { test, expect, waitForAuthReady } from './fixtures/auth';

// This test validates Step 4 (Schedule) on the dashboard.
// Preconditions:
// - Seed data has been inserted using `pnpm seed:e2e` (program is approved and scheduled for E2E_USER_ID)
// - Dev server running (playwright.config.ts baseURL)

test.describe('Dashboard Step 4 - Schedule', () => {
  test('Shows schedule section with calendar when schedule is complete', async ({ page }) => {
    await page.goto('/dashboard');

    // Ensure auth is ready and idle before making assertions
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

    // Page loads
    await expect(page.getByRole('heading', { name: 'Your Dashboard' })).toBeVisible();

    // Step 4: Schedule
    await expect(page.getByRole('heading', { name: 'Your Schedule' })).toBeVisible();

    // Basic smoke check that calendar content mounted (FullCalendar renders day grid elements)
    // We assert existence of at least one grid element or event container by class hints
    const calendarLocator = page.locator('.fc');
    await expect(calendarLocator.first()).toBeVisible();
  });
});
