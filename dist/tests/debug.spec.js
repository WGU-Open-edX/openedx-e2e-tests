"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const page_objects_1 = require("./common/page-objects");
test_1.test.describe('Debug Tests', () => {
    (0, test_1.test)('verify Open edX instance is accessible', async ({ page }) => {
        await page.goto('/');
        // Log the current URL and title for debugging
        console.log('Homepage URL:', page.url());
        console.log('Homepage title:', await page.title());
        // Check if we can access the homepage
        await (0, test_1.expect)(page).not.toHaveURL(/error/);
    });
    (0, test_1.test)('verify login page loads correctly', async ({ page }) => {
        const loginPage = new page_objects_1.LoginPage(page);
        await loginPage.navigate();
        console.log('Login page URL:', page.url());
        console.log('Login page title:', await page.title());
        // Verify login form elements are present
        await (0, test_1.expect)(loginPage.emailInput).toBeVisible();
        await (0, test_1.expect)(loginPage.passwordInput).toBeVisible();
        await (0, test_1.expect)(loginPage.loginButton).toBeVisible();
        // Take a screenshot for debugging
        await page.screenshot({ path: 'debug-login-page.png' });
    });
    (0, test_1.test)('verify form submission behavior', async ({ page }) => {
        const loginPage = new page_objects_1.LoginPage(page);
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
//# sourceMappingURL=debug.spec.js.map