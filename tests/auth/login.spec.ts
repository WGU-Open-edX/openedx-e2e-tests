import { test, expect } from '@playwright/test';
import { LoginPage } from '../common/page-objects';

test.describe('Authentication Tests', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigate();
  });

  test('user can login with valid credentials', async ({ page }) => {
    // Wait for login form to be fully loaded
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();

    // Attempt login
    await loginPage.login('testuser', 'password123');

    // Wait for navigation or error
    await page.waitForLoadState('networkidle');

    // Check if we're on dashboard or got an error
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);

    // Check for error messages
    const errorMessage = page.locator('[role="alert"]');
    const tryAgainButton = page.locator('button:has-text("Try again")');

    if (await tryAgainButton.isVisible()) {
      throw new Error('Login failed with "Try again" error page');
    }

    if (await errorMessage.isVisible()) {
      const errorText = await errorMessage.textContent();
      throw new Error(`Login failed with error: ${errorText}`);
    }

    // Expect successful redirect to dashboard
    await expect(page).toHaveURL(/dashboard/);
  });

  test('user sees error with invalid credentials', async ({ page }) => {
    await loginPage.login('invalid@example.com', 'wrongpassword');
    await expect(page.locator('[role="alert"]')).toBeVisible();
  });

  test('login form validation works', async ({ page }) => {
    await loginPage.loginButton.click();
    await expect(page.locator('.pgn__form-text-invalid')).toHaveCount(2);
  });

  test('password visibility toggle works', async () => {
    await loginPage.passwordInput.fill('testpassword');
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
    await loginPage.togglePasswordVisibility();
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'text');
  });
});