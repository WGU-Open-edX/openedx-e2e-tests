import { test, expect } from '@playwright/test';
import { LoginPage } from '../common/page-objects';
import { TestdocTest } from '../../utils/testdoc';
import { assertA11y } from '../common/a11y-helpers';

test.describe('Export Course Tests', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigate();
  });
  test('user can export a course', async ({ page }, testInfo) => {
    const testDoc = new TestdocTest(page, 'Create-Course-Test', {
      title: 'Exporting a Course in Open edX',
      overview: 'This test automates the process of exporting a course in the Open edX authoring environment. It covers navigating to the course export page, selecting the desired course, and initiating the export process',
      prerequisites: [
        'User has valid authoring credentials',
        'User has access to the Open edX authoring environment',
        'User has at least one course available for export'
      ],
      notes: [
        'Ensure that the authoring environment is accessible before running this test.',
      ],
      relatedTopics: [
        { title: 'Create a Course', url: '#managing-courses' },
        { title: 'Import a Course', url: '#course-settings' },
      ],
    });
    await testDoc.initialize();
    // login
    const user = 'adminuser';
    const pass = 'admin123';
    await loginPage.login(user, pass);
    await page.waitForLoadState('networkidle');

    // Step 1:  Navigate to the authoring/create pag
    const authoringTarget = 'http://apps.local.openedx.io:2001/authoring/home';
    await page.goto(authoringTarget);
    await testDoc.step({
      title: 'Select the desired course to export',
      description: 'From the list of available courses, select the one you wish to export by clicking on its title.',
      screenshot: true,
    });
    // Basic URL assertion to confirm navigation reached the authoring area
    await expect(page).toHaveURL(/authoring\/home|authoring/);
    await assertA11y(page, { warnOnly: true, report: true, reportName: 'export-course-page' }, testInfo);

    await testDoc.click({
      selector: 'text=Automated TestCourse',
      title: 'Click on the course name to select it and be able to export',
      description: 'This will redirect to the course page where we can see the option to export.',
      elementOnly: true,
    });

    await testDoc.click({
      selector: 'button#Tools-dropdown-menu',
      title: 'Open Tools menu',
      description: 'Click on Tools option menu in the navbar to see more options',
      elementOnly: true,
    });
    // when the dropdown is open, click Export Course
    await testDoc.click({
      selector: '.dropdown-menu a:has-text("Export Course")',
      title: 'Select Export Course option',
      description: 'Then select Export Course from the dropdown menu to navigate to the export page.',
      elementOnly: true,
    });
    // Todo: validate we are on the export page

    // click on the export button
    // Scroll to the button to ensure it's visible
    await page.locator('button:has-text("Export course content")').scrollIntoViewIfNeeded();
    await testDoc.click({
      selector: 'button:has-text("Export course content")',
      title: 'Click Export Course button',
      description: 'Finally you will see the export course page with the Export Course button to start the process.',
      elementOnly: false,
    });


    // once the export is done, we can see a button to download the course
    // Wait for the download link to appear (export finished)
    await page.waitForSelector('a:has-text("Download exported course")', {
      state: 'visible',
      timeout: 120_000,
    });

    // Download the exported course
    await testDoc.downloadFromHref('a:has-text("Download exported course")');
    await testDoc.highlight(
      '.course-stepper',
      null,
      { elementOnly: true, padding: 15 }
    );
    const { stepNumber, screenshot, numberedStepNumber } = await testDoc.highlight(
      'body',
      null,
      { elementOnly: ".course-stepper'", padding: 15 }
    );
    testDoc.steps.push({
      stepNumber,
      numberedStepNumber,
      title: 'Download the exported course',
      description: 'Click on Download exported course button, to dowload the course package to your local machine',
      screenshot,
      note: null,
      showNumber: true,
    });
    // Generate documentation
    await testDoc.generateMarkdown();
    await testDoc.generateRST();
    // eslint-disable-next-line no-console
    console.log('✅ exported course documentation generated successfully!');
  });
});
