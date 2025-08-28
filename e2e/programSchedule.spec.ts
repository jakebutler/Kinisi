import { test, expect } from './fixtures/auth';

// Preconditions:
// - Dev server running (playwright.config.ts baseURL)
// - Authenticated session in the browser context (or route permits)
// - A valid program exists with the given ID for the logged-in user
// - Set E2E_PROGRAM_ID in the environment to run this test

const PROGRAM_ID = process.env.E2E_PROGRAM_ID;

test.describe('Program schedule flow', () => {
  test.skip(!PROGRAM_ID, 'Set E2E_PROGRAM_ID to run this test');

  test('Generate Schedule -> View Calendar', async ({ page }) => {
    const id = PROGRAM_ID as string;

    // Go to program details page
    await page.goto(`/program/${id}`);

    // Ensure page loaded
    await expect(page.getByRole('heading', { name: 'Your Fitness Program' })).toBeVisible();

    // Click Generate Schedule
    const genBtn = page.getByRole('button', { name: 'Generate Schedule' });
    await expect(genBtn).toBeVisible();
    await genBtn.click();

    // Wait for success message or button reset
    await expect(page.getByText('Schedule generated.')).toBeVisible({ timeout: 20000 });

    // Click View Calendar
    const viewCalBtn = page.getByRole('button', { name: 'View Calendar' });
    await expect(viewCalBtn).toBeVisible();
    await viewCalBtn.click();

    // Calendar page assertions
    await expect(page).toHaveURL(new RegExp(`/program/${id}/calendar`));
    await expect(page.getByRole('heading', { name: 'Program Calendar' })).toBeVisible();
    // Optional: basic UI elements
    await expect(page.getByRole('link', { name: 'Back to Program' })).toBeVisible();
  });
});
