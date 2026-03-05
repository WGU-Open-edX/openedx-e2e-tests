import { test, expect } from '@playwright/test';
import { LoginPage } from './common/page-objects';

test.describe('Debug Tests', () => {
  test('verify Open edX instance is accessible', async ({ page }) => {
    await page.goto('/');

    // Log the current URL and title for debugging
    console.log('Homepage URL:', page.url());
    console.log('Homepage title:', await page.title());

    // Check if we can access the homepage
    await expect(page).not.toHaveURL(/error/);
  });

  test('verify login page loads correctly', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    console.log('Login page URL:', page.url());
    console.log('Login page title:', await page.title());

    // Verify login form elements are present
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();

    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-login-page.png' });
  });

  test('verify form submission behavior', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();

    // Fill form with test credentials
    await loginPage.emailInput.fill('testuser');
    await loginPage.passwordInput.fill('password123');

    // Log form values
    const emailValue = await loginPage.emailInput.inputValue();
    const passwordValue = await loginPage.passwordInput.inputValue();
    console.log('Email input value:', emailValue);
    console.log('Password input filled:', passwordValue.length > 0);

    // Submit form and capture what happens
    await loginPage.loginButton.click();

    // Wait a bit and see where we end up
    await page.waitForTimeout(3000);
    console.log('URL after form submission:', page.url());

    // Take screenshot of result
    await page.screenshot({ path: 'debug-after-login.png' });

    // Check for any visible error messages
    const alerts = await page.locator('[role="alert"]').allTextContents();
    if (alerts.length > 0) {
      console.log('Alert messages found:', alerts);
    }

    const tryAgainButton = page.locator('button:has-text("Try again")');
    if (await tryAgainButton.isVisible()) {
      console.log('Try again button is visible - unexpected error occurred');
    }
  });
});