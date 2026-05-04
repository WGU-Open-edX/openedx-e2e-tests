"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const page_objects_1 = require("../common/page-objects");
test_1.test.describe('Authentication Tests', () => {
    let loginPage;
    test_1.test.beforeEach(async ({ page }) => {
        loginPage = new page_objects_1.LoginPage(page);
        await loginPage.navigate();
    });
    (0, test_1.test)('user can login with valid credentials', async ({ page }) => {
        // Wait for login form to be fully loaded
        await (0, test_1.expect)(loginPage.emailInput).toBeVisible();
        await (0, test_1.expect)(loginPage.passwordInput).toBeVisible();
        await (0, test_1.expect)(loginPage.loginButton).toBeVisible();
        // Attempt login with credentials from environment
        const username = process.env.TEST_USER;
        const password = process.env.TEST_PASS;
        if (!username || !password) {
            throw new Error('TEST_USER and TEST_PASS environment variables must be set');
        }
        await loginPage.login(username, password);
        // Expect successful redirect to learner dashboard
        await (0, test_1.expect)(page).toHaveURL(/learner-dashboard/, { timeout: 15000 });
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