# Test info

- Name: Assessment Feedback Chat >> user can submit feedback and see assessment update
- Location: /Users/jacobbutler/Documents/GitHub/Kinisi/kinisi-app/e2e/assessmentFeedback.spec.ts:5:3

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toBeVisible()

Locator: getByText('Personalized Assessment')
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for getByText('Personalized Assessment')

    at /Users/jacobbutler/Documents/GitHub/Kinisi/kinisi-app/e2e/assessmentFeedback.spec.ts:10:61
```

# Page snapshot

```yaml
- navigation:
  - link "Kinisi":
    - /url: /
  - link "Sign In":
    - /url: /login
  - link "Register":
    - /url: /register
- main:
  - form "Login form":
    - heading "Sign In" [level=1]
    - text: Email
    - textbox "Email"
    - text: Password
    - textbox "Password"
    - button "Sign In"
    - link "Register":
      - /url: /register
    - link "Forgot Password?":
      - /url: /forgot-password
- alert
- button "Open Next.js Dev Tools":
  - img
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | // This test assumes a user is already logged in and survey is complete.
   4 | test.describe('Assessment Feedback Chat', () => {
   5 |   test('user can submit feedback and see assessment update', async ({ page }) => {
   6 |     // Go to the survey results page
   7 |     await page.goto('/survey/results');
   8 |
   9 |     // Wait for the AI-generated assessment panel to appear
> 10 |     await expect(page.getByText('Personalized Assessment')).toBeVisible();
     |                                                             ^ Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
  11 |
  12 |     // Ensure the chat input is visible
  13 |     const input = page.getByPlaceholder('Suggest a change or give feedback...');
  14 |     await expect(input).toBeVisible();
  15 |     await input.fill('Please make it more optimistic.');
  16 |
  17 |     // Click Send
  18 |     const sendBtn = page.getByRole('button', { name: 'Send' });
  19 |     await sendBtn.click();
  20 |
  21 |     // Wait for the input to be enabled again (feedback sent)
  22 |     await expect(input).toBeEnabled({ timeout: 10000 });
  23 |
  24 |     // Optionally: Reload and ensure no errors (persistence check)
  25 |     await page.reload();
  26 |     await expect(page.getByText('Personalized Assessment')).toBeVisible();
  27 |   });
  28 | });
  29 |
```