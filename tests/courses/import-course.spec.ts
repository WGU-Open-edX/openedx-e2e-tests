import { test, expect } from '@playwright/test';
import { LoginPage } from '../common/page-objects';
import { TestdocTest } from '../../utils/testdoc';
import { assertA11y } from '../common/a11y-helpers';

test.describe('Testdoc: How To Import a Course', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigate();
  });
  test('user can import a course', async ({ page }, testInfo) => {
    const testDoc = new TestdocTest(page, 'Import-Course-Test', {
      title: 'Importing a Course in Open edX',
      overview: 'This test automates the process of importing a course package into the Open edX authoring environment. It walks through accessing the import interface, selecting a course, and uploading a course archive for import.',
      prerequisites: [
        'User has valid authoring credentials',
        'User has access to the Open edX authoring environment',
      ],
      notes: [
        'Ensure that the authoring environment is accessible before running this test.',
      ],
      relatedTopics: [
        { title: 'Create a Course', url: '#managing-courses' },
        { title: 'Export a Course', url: '#course-settings' },
      ],
    });
    await testDoc.initialize();
    // login
    const user = 'jesus.balderrama';
    const pass = 'avena';
    await loginPage.login(user, pass);
    await page.waitForLoadState('networkidle');

    // Step 1:  Navigate to the authoring/create pag
    const authoringTarget = 'http://apps.local.openedx.io:2001/authoring/home';
    await page.goto(authoringTarget);
    await testDoc.step({
      title: 'Select the Course to Import Into',
      description: 'From the list of available courses, click the course title into which you want to import content.',
      screenshot: false,
    });
    // Basic URL assertion to confirm navigation reached the authoring area
    await expect(page).toHaveURL(/authoring\/home|authoring/);
    await assertA11y(page, { warnOnly: true, report: true, reportName: 'import-course-page' }, testInfo);

    const xpathFirst = '(//div[contains(concat(" ", normalize-space(@class), " "), " courses-tab-container ")]//div[contains(concat(" ", normalize-space(@class), " "), " w-100 ")])[1]';

    const { stepNumber, screenshot, numberedStepNumber } = await testDoc.highlight(
      'body',
      null,
      { elementOnly: xpathFirst, padding: 15 },
    );
    testDoc.steps.push({
      stepNumber,
      numberedStepNumber,
      title: 'Course List Overview',
      description: 'The page displays a list of available courses. Select the appropriate course to proceed with the import process.',
      screenshot,
      note: null,
      showNumber: true,
    });
    // even though we are goint to import, we need to first select the course to see the navigation options
    await testDoc.click({
      selector: `${xpathFirst}//a[contains(concat(" ", normalize-space(@class), " "), " card-item-title ")]`,
      title: 'Open the Selected Course',
      description: 'Navigates to the selected course page, where you can access import and export options.',
      elementOnly: true,

    });
    // select at the navbar Tools
    await testDoc.click({
      selector: 'button#Tools-dropdown-menu',
      title: 'Open the Tools Menu',
      description: 'Click the Tools dropdown in the header to reveal additional course management options.',
      elementOnly: true,
    });

    // when the dropdown is open, click Import
    await testDoc.click({
      selector: '.dropdown-menu a:has-text("Import")',
      title: 'Select Import Option',
      description: 'Choose the Import option from the dropdown to navigate to the course import page.',
      elementOnly: true,
    });
    // todo: validate we are on the export page
    // upload the course file
    const filePath = 'artifacts/downloads/testCourseToImport.tar.gz';
    // TODO: Fix upload issue (not working manually either with the PW playground browser)
    await testDoc.uploadFileParagon('[data-testid="dropzone"]', filePath);
  });
});
