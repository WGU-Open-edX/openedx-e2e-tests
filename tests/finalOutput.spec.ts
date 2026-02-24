import { test, expect } from '@playwright/test';
import { TestdocTest } from '../utils/testdoc';

test.describe('Testdoc: Instructor Data Downloads Test', () => {
  test('generate documentation', async ({ page }, testInfo) => {
    const testdoc = new TestdocTest(page, 'test', {
      title: 'Instructor Data Downloads Test',
      overview: 'This guide demonstrates how to generate and download various reports from the instructor dashboard.',
      prerequisites: [
        'You have instructor access to an Open edX course',
        'You are logged in to the platform',
        'The course has enrolled students',
      ],
      notes: [
        'Reports may take a few moments to generate depending on course size.',
        'Some selectors may need manual adjustment for your specific application.',
      ],
    });
    await testdoc.initialize();

    await page.goto('http://studio.local.openedx.io:8001/');
    await testdoc.step({
      title: 'Navigate to studio.local.openedx.io:8001',
      description: 'Open the page at http://studio.local.openedx.io:8001/',
    });

    await testdoc.fill({
      selector: 'input[placeholder*="Username or email"], input[aria-label="Username or email"]',
      value: 'jesus.balderrama.wgu@gmail.com',
      title: 'Enter text in "Username or email" field',
      description: 'Fill the textbox field with the value',
    });

    await testdoc.fill({
      selector: 'input[placeholder*="Password"], input[aria-label="Password"]',
      value: 'password',
      title: 'Enter text in "Password" field',
      description: 'Fill the textbox field with the value',
    });

    await testdoc.click({
      selector: 'button:has-text("Sign in")',
      title: 'Click "Sign in"',
      description: 'Click the button labeled "Sign in"',
    });

    await expect(page.getByRole('heading', { name: 'Studio home' })).toBeVisible();

    await testdoc.click({
      selector: 'button:has-text("New course")',
      title: 'Click "New course"',
      description: 'Click the button labeled "New course"',
    });

    await testdoc.fill({
      selector: 'input[placeholder*="Course name"], input[aria-label="Course name"]',
      value: 'New Course5',
      title: 'Enter text in "Course name" field',
      description: 'Fill the textbox field with the value',
    });

    await page.getByTestId('formControl').click();
    await page.getByTestId('formControl').fill('Test');

    await testdoc.fill({
      selector: 'input[placeholder*="Course number"], input[aria-label="Course number"]',
      value: '5',
      title: 'Enter text in "Course number" field',
      description: 'Fill the textbox field with the value',
    });

    await testdoc.fill({
      selector: 'input[placeholder*="Course run"], input[aria-label="Course run"]',
      value: '2026_T1',
      title: 'Enter text in "Course run" field',
      description: 'Fill the textbox field with the value',
    });

    await testdoc.click({
      selector: 'button:has-text("Create")',
      title: 'Click "Create"',
      description: 'Click the button labeled "Create"',
    });

    await expect(page.getByTestId('course-lock-up-block')).toContainText('New Course5');

    // Generate documentation
    await testdoc.generateMarkdown();
    await testdoc.generateRST();
  });
});
