import { test, expect } from '@playwright/test';

test.describe('Dashboard Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login as active user
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'active-user@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.click('[data-testid="login-button"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/fitness-program/);
  });

  test('should display all dashboard sections correctly', async ({ page }) => {
    // Verify welcome message
    await expect(page.locator('h1')).toContainText('Welcome back');
    
    // Verify navigation tabs
    await expect(page.locator('[data-testid="nav-program"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-assessment"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-survey"]')).toBeVisible();
    
    // Program tab should be active by default
    await expect(page.locator('[data-testid="nav-program"]')).toHaveClass(/active/);
    
    // Should show program content
    await expect(page.locator('[data-testid="program-content"]')).toBeVisible();
  });

  test('should switch between dashboard tabs correctly', async ({ page }) => {
    // Start on program tab
    await expect(page.locator('[data-testid="program-content"]')).toBeVisible();
    
    // Switch to assessment tab
    await page.click('[data-testid="nav-assessment"]');
    await expect(page.locator('[data-testid="nav-assessment"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="assessment-content"]')).toBeVisible();
    await expect(page.locator('[data-testid="program-content"]')).not.toBeVisible();
    
    // Switch to survey tab
    await page.click('[data-testid="nav-survey"]');
    await expect(page.locator('[data-testid="nav-survey"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="survey-content"]')).toBeVisible();
    await expect(page.locator('[data-testid="assessment-content"]')).not.toBeVisible();
    
    // Switch back to program tab
    await page.click('[data-testid="nav-program"]');
    await expect(page.locator('[data-testid="nav-program"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="program-content"]')).toBeVisible();
  });

  test('should expand and collapse program sessions', async ({ page }) => {
    // Should show collapsed sessions initially
    await expect(page.locator('[data-testid="session-0"]')).toBeVisible();
    await expect(page.locator('[data-testid="session-0-exercises"]')).not.toBeVisible();
    
    // Expand first session
    await page.click('[data-testid="expand-session-0"]');
    await expect(page.locator('[data-testid="session-0-exercises"]')).toBeVisible();
    
    // Should show exercise details
    await expect(page.locator('[data-testid="exercise-0"]')).toBeVisible();
    
    // Collapse session
    await page.click('[data-testid="collapse-session-0"]');
    await expect(page.locator('[data-testid="session-0-exercises"]')).not.toBeVisible();
  });

  test('should handle program update requests', async ({ page }) => {
    // Click request updates button
    await page.click('[data-testid="request-updates"]');
    
    // Should show feedback form
    await expect(page.locator('[data-testid="update-feedback"]')).toBeVisible();
    await expect(page.locator('[data-testid="submit-update-request"]')).toBeDisabled();
    
    // Fill feedback
    await page.fill('[data-testid="update-feedback"]', 'Please add more variety to the exercises');
    
    // Submit button should be enabled
    await expect(page.locator('[data-testid="submit-update-request"]')).toBeEnabled();
    
    // Submit request
    await page.click('[data-testid="submit-update-request"]');
    
    // Should show success notification
    await expect(page.locator('[data-testid="notification"]')).toContainText('Update request submitted');
    
    // Form should be hidden
    await expect(page.locator('[data-testid="update-feedback"]')).not.toBeVisible();
  });

  test('should handle empty states gracefully', async ({ page }) => {
    // Mock empty program data by navigating to a test route
    await page.goto('/fitness-program?mock=empty');
    
    // Should show empty state
    await expect(page.locator('[data-testid="empty-program"]')).toBeVisible();
    await expect(page.locator('text=No program found')).toBeVisible();
    
    // Switch to assessment tab
    await page.click('[data-testid="nav-assessment"]');
    await expect(page.locator('[data-testid="empty-assessment"]')).toBeVisible();
    
    // Switch to survey tab
    await page.click('[data-testid="nav-survey"]');
    await expect(page.locator('[data-testid="empty-survey"]')).toBeVisible();
  });

  test('should handle loading states properly', async ({ page }) => {
    // Navigate to dashboard with slow loading mock
    await page.goto('/fitness-program?mock=slow');
    
    // Should show loading spinner
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    
    // Wait for content to load
    await expect(page.locator('[data-testid="program-content"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible();
  });

  test('should handle error states and retry functionality', async ({ page }) => {
    // Navigate to dashboard with error mock
    await page.goto('/fitness-program?mock=error');
    
    // Should show error message
    await expect(page.locator('[data-testid="error-display"]')).toBeVisible();
    await expect(page.locator('text=Error loading data')).toBeVisible();
    
    // Should show retry button
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    
    // Click retry (mock should succeed on retry)
    await page.click('[data-testid="retry-button"]');
    
    // Should show loading then success
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    await expect(page.locator('[data-testid="program-content"]')).toBeVisible({ timeout: 5000 });
  });

  test('should maintain state when refreshing page', async ({ page }) => {
    // Switch to assessment tab
    await page.click('[data-testid="nav-assessment"]');
    await expect(page.locator('[data-testid="assessment-content"]')).toBeVisible();
    
    // Refresh page
    await page.reload();
    
    // Should still be on assessment tab
    await expect(page.locator('[data-testid="nav-assessment"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="assessment-content"]')).toBeVisible();
  });

  test('should handle user logout correctly', async ({ page }) => {
    // Click user menu or logout button
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    
    // Should redirect to login page
    await expect(page).toHaveURL(/\/login/);
    
    // Try to access dashboard directly
    await page.goto('/fitness-program');
    
    // Should redirect back to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigation should be responsive
    await expect(page.locator('[data-testid="nav-program"]')).toBeVisible();
    
    // Content should be readable
    await expect(page.locator('h1')).toBeVisible();
    
    // Tabs should work on mobile
    await page.click('[data-testid="nav-assessment"]');
    await expect(page.locator('[data-testid="assessment-content"]')).toBeVisible();
  });
});
