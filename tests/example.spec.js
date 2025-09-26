const { test, expect } = require('@playwright/test');

test.describe('Open edX Platform Basic Tests', () => {
  test('learner dashboard loads successfully', async ({ page }) => {
    await page.goto('/learner-dashboard/');
    await expect(page).toHaveTitle(/edX/);
  });

  test('login page is accessible', async ({ page }) => {
    await page.goto('/authn/login');
    await expect(page.locator('input[name="emailOrUsername"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });
});