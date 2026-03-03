"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const page_objects_1 = require("../common/page-objects");
const src_1 = require("../../src");
test_1.test.describe('Authentication Tests', () => {
    let loginPage;
    test_1.test.beforeEach(async ({ page }) => {
        loginPage = new page_objects_1.LoginPage(page);
        await loginPage.navigate();
    });
    (0, test_1.test)('user can login with valid credentials', async ({ page }, testInfo) => {
        const vr = new src_1.VisualRegression(page, testInfo);
        // Wait for login form to be fully loaded
        await (0, test_1.expect)(loginPage.emailInput).toBeVisible();
        await (0, test_1.expect)(loginPage.passwordInput).toBeVisible();
        await (0, test_1.expect)(loginPage.loginButton).toBeVisible();
        // Capture login page baseline
        await vr.captureAndCompare({
            name: 'login-page-initial',
            fullPage: true,
        });
        await (0, src_1.assertA11y)(page, { warnOnly: true, report: true, reportName: 'login-page' }, testInfo);
        // Attempt login
        await loginPage.login('testuser', 'password123');
        // Wait for navigation or error
        await page.waitForLoadState('networkidle');
        // Check if we're on dashboard or got an error
        const currentUrl = page.url();
        // eslint-disable-next-line no-console
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
        await (0, test_1.expect)(page).toHaveURL(/dashboard/);
        // Navigate to account settings page for visual regression demo
        await page.goto('http://apps.local.openedx.io:1997/account/');
        await page.waitForLoadState('networkidle');
        // Capture account page state after successful login
        // Mask dynamic content like timestamps and user-specific data
        await vr.captureAndCompare({
            name: 'account-page-after-login',
            fullPage: true,
            threshold: 0.15, // Allow minor rendering differences (anti-aliasing, fonts)
            mask: [
                '.timestamp',
                '[data-testid="user-greeting"]',
                '.last-login-time',
            ],
        });
        await (0, src_1.assertA11y)(page, { warnOnly: true, report: true, reportName: 'account-page' }, testInfo);
    });
    (0, test_1.test)('user sees error with invalid credentials', async ({ page }) => {
        await loginPage.login('invalid@example.com', 'wrongpassword');
        await (0, test_1.expect)(page.locator('[role="alert"]')).toBeVisible();
    });
    (0, test_1.test)('login form validation works', async ({ page }) => {
        await loginPage.loginButton.click();
        await (0, test_1.expect)(page.locator('.pgn__form-text-invalid')).toHaveCount(2);
    });
    (0, test_1.test)('password visibility toggle works', async () => {
        await loginPage.passwordInput.fill('testpassword');
        await (0, test_1.expect)(loginPage.passwordInput).toHaveAttribute('type', 'password');
        await loginPage.togglePasswordVisibility();
        await (0, test_1.expect)(loginPage.passwordInput).toHaveAttribute('type', 'text');
    });
});
//# sourceMappingURL=login.spec.js.map