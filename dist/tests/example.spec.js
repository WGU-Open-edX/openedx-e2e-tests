"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
test_1.test.describe('Open edX Platform Basic Tests', () => {
    (0, test_1.test)('learner dashboard loads successfully', async ({ page }) => {
        await page.goto('/learner-dashboard/');
        await (0, test_1.expect)(page).toHaveTitle(/edX/);
    });
    (0, test_1.test)('login page is accessible', async ({ page }) => {
        await page.goto('/authn/login');
        await (0, test_1.expect)(page.locator('input[name="emailOrUsername"]')).toBeVisible();
        await (0, test_1.expect)(page.locator('input[name="password"]')).toBeVisible();
    });
});
//# sourceMappingURL=example.spec.js.map