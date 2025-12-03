import { test, expect } from '@playwright/test';
import { TestdocTest } from '../../utils/testdoc';
import { LoginPage } from '../common/page-objects';
import { assertA11y } from '../common/a11y-helpers';

test.describe('Testdoc: How to Login', () => {
  test('generate login documentation', async ({ page }, testInfo) => {
    const testdoc = new TestdocTest(page, 'How-to-Login-to-Open-edX', {
      title: 'How to Log In to Your Open edX Account',
      overview: `This guide explains how to log in to your Open edX account. Once you log in, you can access your enrolled courses, track your progress, and manage your account settings.`,

      prerequisites: [
        'You have created an Open edX account',
        'You have your email address or username and password ready',
        'Your web browser has JavaScript enabled'
      ],

      notes: [
        'If you forgot your password, use the "Forgot Password" link on the login page to reset it.',
      ],

      relatedTopics: [
        { title: 'Creating an Open edX Account', url: '#creating-account' },
        { title: 'Resetting Your Password', url: '#reset-password' },
        { title: 'Account Settings and Profile Management', url: '#account-settings' },
        { title: 'Course Enrollment', url: '#course-enrollment' }
      ],
    });
    await testdoc.initialize();

    const loginPage = new LoginPage(page);

    // Step 1: Navigate to login page
    await loginPage.navigate();
    await testdoc.step({
      title: 'Navigate to the Open edX login page',
      description: 'You can access the login page by clicking "Sign In" from the main Open edX website or by going directly to the login URL.'
    });

    // Step 2: Show the login form
    await expect(loginPage.emailInput).toBeVisible();

    // Run accessibility check on login page
    await assertA11y(page, { warnOnly: true, report: true, reportName: 'login-page' }, testInfo);

    await testdoc.step({
      title: 'Locate the login form',
      description: 'The form contains two main fields: an email/username field and a password field, along with a "Sign In" button.',
      screenshot: false
    });

    // Step 3: Fill in email
    await testdoc.fill({
      selector: 'input[name="emailOrUsername"]',
      value: 'testuser',
      title: 'Enter your email or username',
      description: 'Enter either the email address you registered with or your chosen username in the first field.',
      elementOnly: 'form[id="sign-in-form"]'
    });
    await testdoc.note('If you are unsure which one to use, try the email address you used when creating your account first.');

    // Step 4: Fill in password
    await testdoc.fill({
      selector: 'input[name="password"]',
      value: 'password123',
      title: 'Enter your password',
      description: 'Type your password in the password field.',
      elementOnly: 'form[id="sign-in-form"]'
    });
    await testdoc.note('Your password is case-sensitive, so make sure your Caps Lock is in the correct position.');

    // Step 5: Click login button
    await testdoc.click({
      selector: 'button[name="sign-in"]',
      title: 'Click the "Sign In" button',
      description: 'This will submit your login credentials and access your account.',
      elementOnly: true,
    });

    // Step 6: Wait for navigation and show result
    await page.waitForLoadState('networkidle');
    await testdoc.screenshot({
      title: 'Access your dashboard',
      description: 'After successful login, you will be automatically redirected to your dashboard where you can view your enrolled courses, progress, and account information.',
    });

    // Step 7: Demonstrate highlightElement (manual step creation)
    const { stepNumber, numberedStepNumber, screenshot } = await testdoc.highlight(
      'body',
      null,
      { elementOnly: 'main', padding: 15 }
    );

    testdoc.steps.push({
      stepNumber,
      numberedStepNumber,
      title: 'Main dashboard area highlighted',
      description: 'This is the main content area where you can see your courses and progress.',
      screenshot,
      note: null,
      showNumber: true,
    });

    // Step 8: Add a step without screenshot
    await testdoc.step({
      title: 'Explore your account options',
      description: 'From the dashboard, you can navigate to different sections like My Courses, Account Settings, or Profile.',
      screenshot: false
    });
    await testdoc.note('Look for navigation menus or buttons to access different features.');

    // Run accessibility check on dashboard
    await assertA11y(page, { warnOnly: true, report: true, reportName: 'dashboard' }, testInfo);

    // Generate documentation
    await testdoc.generateMarkdown();
    await testdoc.generateRST();

    // eslint-disable-next-line no-console
    console.log('✅ Login documentation generated successfully!');
  });
});
