import { test, expect } from '@playwright/test';
import { LoginPage } from '../common/page-objects';
import { TestdocTest } from '../../utils/testdoc';
import { assert } from 'console';
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
        overview: `This test automates the process of importing a course in the Open edX authoring environment. It covers navigating to the course importing page, selecting the desired course, and initiating the export process.`,
        prerequisites: [
            'User has valid authoring credentials',
            'User has access to the Open edX authoring environment',
        ],
        notes: [
            'Ensure that the authoring environment is accessible before running this test.'
        ],
        relatedTopics: [
            { title: 'Create a Course', url: '#managing-courses' },
            { title: 'Export a Course', url: '#course-settings' }
        ],
    });
    await testDoc.initialize();
    //login
    const user = 'jesus.balderramapala@wgu.edu';
    const pass = 'avena';
    await loginPage.login(user, pass);
    await page.waitForLoadState('networkidle');

    //Step 1:  Navigate to the authoring/create pag
    const authoringTarget ='http://apps.local.openedx.io:2001/authoring/home';
    await page.goto(authoringTarget);
    await testDoc.step({
        title: "Select the desired course to import",
        description: "add description here.",
        screenshot: false
    })
    // Basic URL assertion to confirm navigation reached the authoring area
    await expect(page).toHaveURL(/authoring\/home|authoring/);
    await assertA11y(page, { warnOnly: true, report: true, reportName: 'import-course-page' }, testInfo);

    const xpathFirst = '(//div[contains(concat(" ", normalize-space(@class), " "), " courses-tab-container ")]//div[contains(concat(" ", normalize-space(@class), " "), " w-100 ")])[1]';

    const { stepNumber, screenshot, numberedStepNumber } = await testDoc.highlight(
        'body',
        null,
        { elementOnly: xpathFirst, padding: 15 }
    );
    testDoc.steps.push({
    stepNumber,
    numberedStepNumber,
    title: 'Select the desired course to export',
    description: 'The webpage will show a list of courses.',
    screenshot,
    note: null,
    showNumber: true
    });
//even though we are goint to import, we need to first select the course to see the navigation options
    await testDoc.click({
        selector: `${xpathFirst}//a[contains(concat(" ", normalize-space(@class), " "), " card-item-title ")]`,
        title: 'Click to select a course and then be able to export it',
        description: "This will redirect to the course page where we can see the option to export.",
        elementOnly: true,
        //screenshot: add this flag later
        
    });
    //select at the navbar Tools 
    await testDoc.click({
    selector: 'button#Tools-dropdown-menu',
    title: 'Open Tools menu',
    description: 'Open the Tools dropdown in the header',
    elementOnly: true
    });
    // when the dropdown is open, click Import
    await testDoc.click({
    selector: '.dropdown-menu a:has-text("Import")',
    title: 'Select Import option',
    description: 'This will navigate to the course import page.',
    elementOnly: true
    });
    //todo: validate we are on the export page
    //upload the course file
    const filePath = 'artifacts/downloads/course.2b3_4ccr.tar.gz'; 
    //TODO: Fix upload issue (not working manually either with the PW playground browser)
    await testDoc.uploadFileParagon('[data-testid="dropzone"]', filePath);


    })
});
