import { test } from '@playwright/test';
import { TestdocTest } from '../../src';
import { LoginPage } from '../common/page-objects';
test.describe('Testdoc Demo Output', () => {
    test('demonstrate testdoc output', async ({ page }) => {
        const testdoc = new TestdocTest(page, 'user-login', {
            title: 'How to Log In',
            overview: 'Step-by-step guide to logging into the Open edX platform.',
            prerequisites: ['Active account', 'Valid credentials'],
            notes: ['Use Forgot Password if needed'],
            relatedTopics: [
                { title: 'Create Account', url: '/signup' },
                'Password requirements',
            ],
            showNumbers: true,
        });
        await testdoc.initialize();
        const loginPage = new LoginPage(page);
        // Navigate to login page
        await loginPage.navigate();
        await testdoc.step({
            title: 'Navigate to the login page',
            description: 'Open the sign-in form from the home page.',
        });
        // Fill in credentials
        const username = process.env.TEST_USER_USERNAME;
        const password = process.env.TEST_USER_PASSWORD;
        if (!username || !password) {
            throw new Error('TEST_USER_USERNAME and TEST_USER_PASSWORD environment variables must be set');
        }
        await testdoc.fill({
            selector: 'input[name="emailOrUsername"]',
            value: username,
            title: 'Enter your email address',
            elementOnly: true,
            padding: 30,
        });
        await testdoc.fill({
            selector: 'input[name="password"]',
            value: password,
            title: 'Enter your password',
            elementOnly: true,
            padding: 30,
        });
        await testdoc.click({
            selector: 'button[name="sign-in"]',
            title: 'Click Sign In',
            description: 'Submit your credentials.',
            elementOnly: true,
        });
        // Wait for navigation
        await page.waitForLoadState('networkidle');
        await testdoc.screenshot({
            title: 'Dashboard loaded',
            description: "You're now logged in.",
        });
        // add a note
        await testdoc.note('Bookmark this page for quick access.');
        // Generate documentation
        await testdoc.generateMarkdown();
        await testdoc.generateRST();
        // eslint-disable-next-line no-console
        console.log('✅ Documentation generated successfully!');
    });
});
