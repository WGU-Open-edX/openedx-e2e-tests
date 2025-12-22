import { test, expect } from '@playwright/test';
import { LoginPage } from '../common/page-objects';
import { TestdocTest } from '../../utils/testdoc';
import { assertA11y } from '../common/a11y-helpers';

test.describe('Testdoc: How To Create a Course', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigate();
  });

  test('user can create a valid course', async ({ page }, testInfo) => {
    const user = process.env.TEST_USER || 'adminuser';
    const pass = process.env.TEST_PASS || 'admin123';
    const authoringTarget = process.env.AUTHORING_URL || 'http://apps.local.openedx.io:2001/authoring/home';
    const testDoc = new TestdocTest(page, 'Create-Course-Test', {
      title: 'Creating a New Course in Open edX',
      overview: 'This test automates the end-to-end workflow for creating a new course in the Open edX authoring environment. It demonstrates how to access the course creation page, enter all required course details, and submit the form to successfully create a new course instance.',
      prerequisites: [
        'User has valid authoring credentials',
        'User has access to the Open edX authoring environment',
      ],
      notes: [
        'Ensure that the authoring environment is accessible before running this test.',
      ],
      relatedTopics: [
        { title: 'Import a Course', url: '#managing-courses' },
        { title: 'Export a Course', url: '#course-settings' },
      ],
    });
    await testDoc.initialize();
    await loginPage.login(user, pass);
    await page.waitForLoadState('networkidle');
    await page.goto(authoringTarget);
    await testDoc.step({
      title: 'Locate the New Course Button',
      description: 'On the authoring home page, find the "New Course" button at the top right. This button starts the course creation process.',
      screenshot: true,
    });

    // Basic URL assertion to confirm navigation reached the authoring area
    await expect(page).toHaveURL(/authoring\/home|authoring/);
    await assertA11y(page, { warnOnly: true, report: true, reportName: 'create-course-page' }, testInfo);

    // Step 2: Click on 'New Course' button
    await testDoc.click({
      selector: 'button:has-text("New course")',
      title: 'Click the New course button',
      description: 'This will show the create course form.',
      elementOnly: true,
    });
    // Step 3: Fill the form
    const { stepNumber, numberedStepNumber, screenshot } = await testDoc.highlight(
      'body',
      null,
      { elementOnly: '.create-or-rerun-course-form', padding: 40 },
    );
    testDoc.steps.push({
      stepNumber,
      numberedStepNumber,
      title: 'Fill Out the Course Creation Form',
      description: 'The course creation form includes fields for Course Name, Organization, Course Number, and Run. Complete each field with the appropriate information, then click the Create button to finalize course creation.',
      screenshot,
      note: null,
      showNumber: true,
    });

    // Step 4: Fill in course name
    await testDoc.fill({
      selector: 'input[name="displayName"]',
      value: 'Automated TestCourse',
      title: 'Enter the Course Name',
      description: 'Provide a descriptive name for your new course in the "Course Name" field.',
      elementOnly: 'form',
    });

    // Step 5: Fill in course org
    await testDoc.fill({
      selector: 'input[name="org"]',
      value: 'TestOrg',
      title: 'Enter the Course Organization',
      description: 'Specify the organization code for your course. This should be a valid identifier without spaces.',
      elementOnly: 'form',
    });
    await testDoc.note('The organization name should not have spaces to be valid.');

    // Step 6: Fill in course number
    await testDoc.fill({
      selector: 'input[name="number"]',
      value: '101',
      title: 'Enter the Course Number',
      description: 'Assign a unique course number to help identify this course within your organization.',
      elementOnly: 'form',
    });

    // Step 6: Fill in course run
    await testDoc.fill({
      selector: 'input[name="run"]',
      value: '2025_T1',
      title: 'Enter the Course Run',
      description: 'Specify the run identifier for this course instance (e.g., 2025_T1).',
      elementOnly: 'form',
    });

    // Step 7: Click on 'Create' button to create the course
    await page.locator('button:has-text("create")').scrollIntoViewIfNeeded();
    await testDoc.click({
      selector: 'button:has-text("create")',
      title: 'Create the Course',
      description: 'Click the "Create" button to submit the form and create your new course. You will be redirected to the course outline page upon success.',
      elementOnly: true,
    });

    // Step 8: Todo: Add Redirect to course outline page

    // Generate documentation
    await testDoc.generateMarkdown();
    await testDoc.generateRST();

    // eslint-disable-next-line no-console
    console.log('✅ Create course documentation generated successfully!');
  });
});
