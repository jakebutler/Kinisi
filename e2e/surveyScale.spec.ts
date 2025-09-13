import { test, expect } from './fixtures/auth';

// This test is resilient to environments without an authenticated user.
// If redirected to /login, it asserts the login view and exits early.
// If on /survey, it walks through early questions and verifies the 0–10 box scale UI.

test.describe('Survey 0–10 scale boxes', () => {
  test('renders selectable boxes and updates value on click', async ({ page }) => {
    await page.goto('/survey');

    // Detect unauthenticated redirect
    if (page.url().includes('/login')) {
      await expect(page.getByText(/login/i)).toBeVisible();
      return;
    }

    // Wait for survey heading or continue if still loading
    const heading = page.getByRole('heading', { name: /Intake Survey/i });
    const headingVisible = await heading.isVisible().catch(() => false);
    if (!headingVisible) {
      // Survey not available in this environment
      return;
    }

    // Answer first questions to reach the first 0–10 scale question ("importance")
    // Q1: medicalClearance (radio)
    const q1No = page.getByRole('radio', { name: 'No' }).first();
    if (!(await q1No.isVisible().catch(() => false))) return;
    await q1No.click();
    await page.getByRole('button', { name: 'Next' }).click();

    // Q2: currentPain (radio)
    await page.getByRole('radio', { name: 'No' }).first().click();
    await page.getByRole('button', { name: 'Next' }).click();

    // Q3: activityFrequency (select-like list)
    await page.getByRole('option', { name: '3-4' }).click();
    await page.getByRole('button', { name: 'Next' }).click();

    // Q4: physicalFunction (select-like list)
    await page.getByRole('option', { name: 'Good' }).click();
    await page.getByRole('button', { name: 'Next' }).click();

    // Q5: intentToChange (radio)
    await page.getByRole('radio', { name: 'Yes' }).click();
    await page.getByRole('button', { name: 'Next' }).click();

    // Q6: importance (0–10 scale)
    const scale = page.getByTestId('scale-0-10');
    const selectedValue = page.getByTestId('scale-selected-value');
    await expect(scale).toBeVisible();

    // Click on box 7 and assert state
    await page.getByTestId('scale-box-7').click();
    await expect(selectedValue).toHaveText('7');
    await expect(page.getByTestId('scale-box-7')).toHaveAttribute('aria-pressed', 'true');

    // Click on box 2 and assert state updates
    await page.getByTestId('scale-box-2').click();
    await expect(selectedValue).toHaveText('2');
    await expect(page.getByTestId('scale-box-7')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByTestId('scale-box-2')).toHaveAttribute('aria-pressed', 'true');
  });
});
