import { test, expect } from '@playwright/test';
import { LoginPage } from '../common/page-objects';
import { VisualRegression } from '../../src';
test.describe('Authentication Tests', () => {
    let loginPage;
    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        await loginPage.navigate();
    });
    test('user can login with valid credentials', async ({ page }, testInfo) => {
        const vr = new VisualRegression(page, testInfo);
        // Wait for login form to be fully loaded
        await expect(loginPage.emailInput).toBeVisible();
        await expect(loginPage.passwordInput).toBeVisible();
        await expect(loginPage.loginButton).toBeVisible();
        await vr.captureAndCompare({ name: 'login-page', fullPage: false });
        // Attempt login with credentials from environment
        const username = process.env.TEST_USER_USERNAME;
        const password = process.env.TEST_USER_PASSWORD;
        if (!username || !password) {
            throw new Error('TEST_USER_USERNAME and TEST_USER_PASSWORD environment variables must be set');
        }
        await loginPage.login(username, password);
        // Expect successful redirect to learner dashboard
        await expect(page).toHaveURL(/learner-dashboard/, { timeout: 15000 });
        await vr.captureAndCompare({ name: 'learner-dashboard', fullPage: false });
    });
    test('user sees error with invalid credentials', async ({ page }, testInfo) => {
        const vr = new VisualRegression(page, testInfo);
        await loginPage.login('invalid@example.com', 'wrongpassword');
        await expect(page.locator('[role="alert"]')).toBeVisible();
        await vr.captureAndCompare({ name: 'login-error', fullPage: false });
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
//# sourceMappingURL=login.spec.js.map