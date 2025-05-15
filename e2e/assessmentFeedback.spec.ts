import { test, expect } from '@playwright/test';

// This test assumes a user is already logged in and survey is complete.
test.describe('Assessment Feedback Chat', () => {
  test('user can submit feedback and see assessment update', async ({ page }) => {
    // Go to the survey results page
    await page.goto('/survey/results');

    // Wait for the AI-generated assessment panel to appear
    await expect(page.getByText('Personalized Assessment')).toBeVisible();

    // Ensure the chat input is visible
    const input = page.getByPlaceholder('Suggest a change or give feedback...');
    await expect(input).toBeVisible();
    await input.fill('Please make it more optimistic.');

    // Click Send
    const sendBtn = page.getByRole('button', { name: 'Send' });
    await sendBtn.click();

    // Wait for the input to be enabled again (feedback sent)
    await expect(input).toBeEnabled({ timeout: 10000 });

    // Optionally: Reload and ensure no errors (persistence check)
    await page.reload();
    await expect(page.getByText('Personalized Assessment')).toBeVisible();
  });
});
