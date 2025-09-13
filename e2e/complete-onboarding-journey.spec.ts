import { test, expect } from '@playwright/test';

test.describe('Complete Onboarding Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Start from login page
    await page.goto('/login');
  });

  test('should complete full onboarding flow from registration to active dashboard', async ({ page }) => {
    // Step 1: Register new user
    await page.click('text=Sign up');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="register-button"]');

    // Wait for email confirmation (in test environment, this should be automatic)
    await expect(page).toHaveURL(/\/survey/);

    // Step 2: Complete Survey
    await expect(page.locator('h1')).toContainText('Fitness Survey');
    
    // Select exercises
    await page.check('[data-testid="exercise-strength-training"]');
    await page.check('[data-testid="exercise-cardio"]');
    
    // Fill injury information
    await page.fill('[data-testid="injuries-input"]', 'No current injuries');
    
    // Select session duration
    await page.selectOption('[data-testid="session-duration"]', '30-45 minutes');
    
    // Set confidence level
    await page.fill('[data-testid="confidence-slider"]', '7');
    
    // Select activity likelihood
    await page.selectOption('[data-testid="activity-likelihood"]', 'Very likely');
    
    // Submit survey
    await page.click('[data-testid="submit-survey"]');
    
    // Should redirect to assessment
    await expect(page).toHaveURL(/\/assessment/);

    // Step 3: Review and Approve Assessment
    await expect(page.locator('h1')).toContainText('Personalized Assessment');
    
    // Wait for assessment to load
    await expect(page.locator('[data-testid="assessment-content"]')).toBeVisible();
    
    // Approve assessment
    await page.click('[data-testid="approve-assessment"]');
    
    // Should redirect to program
    await expect(page).toHaveURL(/\/program/);

    // Step 4: Review and Approve Program
    await expect(page.locator('h1')).toContainText('Exercise Program');
    
    // Wait for program to load
    await expect(page.locator('[data-testid="program-content"]')).toBeVisible();
    
    // Expand first session to view details
    await page.click('[data-testid="expand-session-0"]');
    await expect(page.locator('[data-testid="session-0-exercises"]')).toBeVisible();
    
    // Approve program
    await page.click('[data-testid="approve-program"]');
    
    // Should redirect to schedule
    await expect(page).toHaveURL(/\/schedule/);

    // Step 5: Schedule Program
    await expect(page.locator('h1')).toContainText('Schedule');
    
    // Select start date (15th of current month)
    await page.click('[data-testid="calendar-day-15"]');
    
    // Confirm schedule
    await page.click('[data-testid="schedule-program"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/fitness-program/);

    // Step 6: Verify Dashboard Access
    await expect(page.locator('h1')).toContainText('Welcome back');
    
    // Should show navigation tabs
    await expect(page.locator('[data-testid="nav-program"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-assessment"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-survey"]')).toBeVisible();
    
    // Should show program content by default
    await expect(page.locator('[data-testid="program-content"]')).toBeVisible();
  });

  test('should handle onboarding interruption and resume correctly', async ({ page }) => {
    // Complete survey
    await page.goto('/survey');
    await page.check('[data-testid="exercise-strength-training"]');
    await page.fill('[data-testid="injuries-input"]', 'None');
    await page.selectOption('[data-testid="session-duration"]', '30-45 minutes');
    await page.fill('[data-testid="confidence-slider"]', '5');
    await page.selectOption('[data-testid="activity-likelihood"]', 'Likely');
    await page.click('[data-testid="submit-survey"]');

    // Navigate away during assessment
    await expect(page).toHaveURL(/\/assessment/);
    await page.goto('/survey'); // Try to go back to survey

    // Should redirect to current onboarding step (assessment)
    await expect(page).toHaveURL(/\/assessment/);
    
    // Complete assessment
    await page.click('[data-testid="approve-assessment"]');
    
    // Should continue to program step
    await expect(page).toHaveURL(/\/program/);
  });

  test('should allow requesting updates during program review', async ({ page }) => {
    // Navigate to program step (assuming previous steps completed)
    await page.goto('/program');
    
    await expect(page.locator('[data-testid="program-content"]')).toBeVisible();
    
    // Click request updates
    await page.click('[data-testid="request-updates"]');
    
    // Should show feedback form
    await expect(page.locator('[data-testid="update-feedback"]')).toBeVisible();
    
    // Fill feedback
    await page.fill('[data-testid="update-feedback"]', 'Please add more cardio exercises and reduce the intensity');
    
    // Submit request
    await page.click('[data-testid="submit-update-request"]');
    
    // Should show confirmation
    await expect(page.locator('text=Update request submitted')).toBeVisible();
    
    // Should still be on program page
    await expect(page).toHaveURL(/\/program/);
  });

  test('should prevent access to dashboard before completing onboarding', async ({ page }) => {
    // Try to access dashboard directly
    await page.goto('/fitness-program');
    
    // Should redirect to appropriate onboarding step
    await expect(page).toHaveURL(/\/(survey|assessment|program|schedule)/);
  });

  test('should handle errors gracefully during onboarding', async ({ page }) => {
    await page.goto('/survey');
    
    // Try to submit incomplete survey
    await page.click('[data-testid="submit-survey"]');
    
    // Should show validation errors
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('text=At least one exercise must be selected')).toBeVisible();
    
    // Fill required fields
    await page.check('[data-testid="exercise-strength-training"]');
    await page.fill('[data-testid="injuries-input"]', 'None');
    await page.selectOption('[data-testid="session-duration"]', '30-45 minutes');
    
    // Should be able to submit now
    await page.click('[data-testid="submit-survey"]');
    await expect(page).toHaveURL(/\/assessment/);
  });
});
