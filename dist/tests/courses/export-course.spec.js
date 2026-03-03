"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const page_objects_1 = require("../common/page-objects");
const src_1 = require("../../src");
test_1.test.skip();
test_1.test.describe('Export Course Tests', () => {
    let loginPage;
    test_1.test.beforeEach(async ({ page }) => {
        loginPage = new page_objects_1.LoginPage(page);
        await loginPage.navigate();
    });
    (0, test_1.test)('user can export a course', async ({ page }, testInfo) => {
        const user = process.env.TEST_USER || 'adminuser';
        const pass = process.env.TEST_PASS || 'adminuser123';
        const authoringTarget = process.env.AUTHORING_URL || 'http://apps.local.openedx.io:2001/authoring/home';
        const testDoc = new src_1.TestdocTest(page, 'Create-Course-Test', {
            title: 'Exporting a Course in Open edX',
            overview: 'This test automates the export workflow for a course in the Open edX authoring environment. It demonstrates how to access the export page, select a course, and initiate the export process to generate a downloadable course archive.',
            prerequisites: [
                'User has valid authoring credentials',
                'User has access to the Open edX authoring environment',
                'User has at least one course available for export',
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
        await loginPage.login(user, pass);
        await page.waitForLoadState('networkidle');
        await page.goto(authoringTarget);
        await testDoc.step({
            title: 'Select the Course to Export',
            description: 'From the list of available courses, click the course title to open its details and begin the export process.',
            screenshot: true,
        });
        // Basic URL assertion to confirm navigation reached the authoring area
        await (0, test_1.expect)(page).toHaveURL(/authoring\/home|authoring/);
        await (0, src_1.assertA11y)(page, { warnOnly: true, report: true, reportName: 'export-course-page' }, testInfo);
        await testDoc.click({
            selector: '(//a[text()="Automated TestCourse"])[1]',
            title: 'Open the Selected Course',
            description: 'Navigates to the selected course page, where you can access export options.',
            elementOnly: true,
        });
        await testDoc.click({
            selector: 'button#Tools-dropdown-menu',
            title: 'Open the Tools Menu',
            description: 'Click the Tools option in the navigation bar to reveal additional course management actions.',
            elementOnly: true,
        });
        // when the dropdown is open, click Export Course
        await testDoc.click({
            selector: '.dropdown-menu a:has-text("Export Course")',
            title: 'Select Export Course Option',
            description: 'Choose "Export Course" from the dropdown menu to navigate to the export page.',
            elementOnly: true,
        });
        // Todo: validate we are on the export page
        // click on the export button
        // Scroll to the button to ensure it's visible
        await page.locator('button:has-text("Export course content")').scrollIntoViewIfNeeded();
        await testDoc.click({
            selector: 'button:has-text("Export course content")',
            title: 'Export the Course',
            description: 'On the export course page, click the "Export Course" button to begin generating the course archive. Once the export is complete, a download link will be provided.',
            elementOnly: false,
        });
        // once the export is done, we can see a button to download the course
        // Wait for the download link to appear (export finished)
        await page.waitForSelector('a:has-text("Download exported course")', {
            state: 'visible',
        });
        // Download the exported course
        await testDoc.downloadFromHref('a:has-text("Download exported course")');
        await testDoc.highlight('.course-stepper', null, { elementOnly: true, padding: 15 });
        const { stepNumber, screenshot, numberedStepNumber } = await testDoc.highlight('body', null, { elementOnly: ".course-stepper'", padding: 15 });
        testDoc.steps.push({
            stepNumber,
            numberedStepNumber,
            title: 'Download the Exported Course',
            description: 'Click the "Download exported course" button to download the course package to your local machine.',
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
//# sourceMappingURL=export-course.spec.js.map