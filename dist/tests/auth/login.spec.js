import { test, expect } from '@playwright/test';
import { LoginPage } from '../common/page-objects';
import { TestdocTest, VisualRegression } from '../../src';
test.describe('Authentication Tests', () => {
    let loginPage;
    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        await loginPage.navigate();
    });
    test('user can login with valid credentials', async ({ page }, testInfo) => {
        const testdoc = new TestdocTest(page, 'user-login', {
            title: 'How to Log In',
            overview: 'This guide shows you how to log into Open edX.',
        });
        await testdoc.initialize();
        // Wait for login form to be fully loaded
        await expect(loginPage.emailInput).toBeVisible();
        await expect(loginPage.passwordInput).toBeVisible();
        await expect(loginPage.loginButton).toBeVisible();
        // Visual regression test
        const vr = new VisualRegression(page, testInfo);
        await vr.captureAndCompare({ name: 'login-page' });
        // Attempt login with credentials from environment
        await testdoc.fill('input[name="emailOrUsername"]', process.env.TEST_USER_USERNAME, 'Enter your username or email');
        await testdoc.fill('input[name="password"]', process.env.TEST_USER_PASSWORD, 'Enter your password');
        await testdoc.click('button[name="sign-in"]', 'Click the Sign In button');
        // Expect successful redirect to learner dashboard
        await expect(page).toHaveURL(/learner-dashboard/, { timeout: 15000 });
        await testdoc.generateMarkdown();
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
//# sourceMappingURL=login.spec.js.map