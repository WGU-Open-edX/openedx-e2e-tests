import { test, expect } from '@playwright/test';
import { LoginPage } from './common/page-objects';
import { TestdocTest, VisualRegression } from '../src';
test.describe('Instructor Dashboard Tests', () => {
    let loginPage;
    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        await loginPage.navigate();
    });
    test('user can login and access the Instructor Dashboard', async ({ page }, testInfo) => {
        const testdoc = new TestdocTest(page, 'user-login', {
            title: 'How to Access the Instructor Dashboard',
            overview: 'This guide shows you how to log into Open edX and access the Instructor Dashboard.',
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
        await testdoc.fill('input[name="emailOrUsername"]', process.env.ADMIN_USER_USERNAME, 'Enter your username or email');
        await testdoc.fill('input[name="password"]', process.env.ADMIN_USER_PASSWORD, 'Enter your password');
        await testdoc.click('button[name="sign-in"]', 'Click the Sign In button');
        // Navigate to instructor dashboard certificates page
        await page.goto('http://apps.local.openedx.io:2003/instructor-dashboard/course-v1:OpenedX+DemoX+DemoCourse/certificates');
        // wait for data to load 15 seconds
        await page.waitForTimeout(15000);
        await expect(page).toHaveURL(/instructor-dashboard.*certificates/, { timeout: 15000 });
        await vr.captureAndCompare({ name: 'instructor-dashboard-certificates' });
        await testdoc.generateMarkdown();
    });
});
//# sourceMappingURL=instructor-dashboard.spec.js.map