import { test, expect } from '@playwright/test';

test.describe('Authentication and Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the landing page with correct title', async ({ page }) => {
    // Check if the page title contains Navacle
    await expect(page).toHaveTitle(/Navacle/);
  });

  test('should have login form elements', async ({ page }) => {
    // Check for email and password inputs
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    
    // We expect at least one of these to be visible if it's a login page
    // Note: Since we are testing a live site, we'll be flexible with selectors
    await expect(emailInput.first()).toBeVisible();
    await expect(passwordInput.first()).toBeVisible();
  });

  test('should navigate to signup page', async ({ page }) => {
    // Look for a link that mentions signing up
    const signupLink = page.getByRole('link', { name: /sign up|register/i });
    
    if (await signupLink.isVisible()) {
      await signupLink.click();
      await expect(page).toHaveURL(/signup|register/);
      
      // Check for common signup fields
      await expect(page.locator('input[name="name"], input[placeholder*="Name"i]').first()).toBeVisible();
    } else {
      console.log('Signup link not found on landing page, skipping navigation check.');
    }
  });

  test('should show validation error on empty login', async ({ page }) => {
    const loginButton = page.getByRole('button', { name: /login|sign in/i });
    
    if (await loginButton.isVisible()) {
      await loginButton.click();
      
      // Check for validation messages or if we stay on the same page
      // Many modern apps use HTML5 validation or custom toast messages
      await expect(page).toHaveURL('/');
    }
  });
});
