"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const page_objects_1 = require("../common/page-objects");
const src_1 = require("../../src");
test_1.test.skip();
test_1.test.describe('Testdoc: How To Import a Course', () => {
    let loginPage;
    test_1.test.beforeEach(async ({ page }) => {
        loginPage = new page_objects_1.LoginPage(page);
        await loginPage.navigate();
    });
    (0, test_1.test)('user can import a course', async ({ page }, testInfo) => {
        // Use environment variables or config for credentials and URLs
        const user = process.env.TEST_USER || 'adminuser';
        const pass = process.env.TEST_PASS || 'admin123';
        const authoringTarget = process.env.AUTHORING_URL || 'http://apps.local.openedx.io:2001/authoring/home';
        const filePath = 'artifacts/downloads/testCourseToImport.tar.gz';
        const testDoc = new src_1.TestdocTest(page, 'Import-Course-Test', {
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
        // Login
        await loginPage.login(user, pass);
        await page.waitForLoadState('networkidle');
        // Navigate to authoring home
        await page.goto(authoringTarget);
        await (0, test_1.expect)(page).toHaveURL(/authoring\/home|authoring/);
        await testDoc.step({
            title: 'Select the Course to Import Into',
            description: 'From the list of available courses, click the course title into which you want to import content.',
            screenshot: false,
        });
        await (0, src_1.assertA11y)(page, { warnOnly: true, report: true, reportName: 'import-course-page' }, testInfo);
        // Highlight first course card
        const xpathFirst = '(//div[contains(concat(" ", normalize-space(@class), " "), " courses-tab-container ")]//div[contains(concat(" ", normalize-space(@class), " "), " w-100 ")])[1]';
        const { stepNumber, screenshot, numberedStepNumber } = await testDoc.highlight('body', null, { elementOnly: xpathFirst, padding: 15 });
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
        // Assert navigation to import page
        await (0, test_1.expect)(page).toHaveURL(/import/);
        await (0, src_1.assertA11y)(page, { warnOnly: true, report: true, reportName: 'import-course-upload' }, testInfo);
        // Upload course file
        await page.waitForSelector('[data-testid="dropzone"] input[type="file"]', { timeout: 10000 });
        await testDoc.uploadFile('[data-testid="dropzone"] input[type="file"]', filePath);
        // Generate documentation
        await testDoc.generateMarkdown();
        await testDoc.generateRST();
        // eslint-disable-next-line no-console
        console.log('✅ exported course documentation generated successfully!');
    });
});
//# sourceMappingURL=import-course.spec.js.map