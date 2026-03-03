"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const page_objects_1 = require("../common/page-objects");
const src_1 = require("../../src");
test_1.test.skip();
test_1.test.describe('Add Section to Course Test', () => {
    let loginPage;
    test_1.test.beforeEach(async ({ page }) => {
        loginPage = new page_objects_1.LoginPage(page);
        await loginPage.navigate();
    });
    (0, test_1.test)('user can add a Section to a course', async ({ page }, testInfo) => {
        const user = process.env.TEST_USER || 'adminuser';
        const pass = process.env.TEST_PASS || 'adminuser123';
        const authoringTarget = process.env.AUTHORING_URL || 'http://apps.local.openedx.io:2001/authoring/home';
        const testDoc = new src_1.TestdocTest(page, 'Add-Section-Course', {
            title: 'Adding section to a Course in Open edX',
            overview: 'This test walks through the process of adding a new section to an existing course in the Open edX authoring environment. It covers accessing the course, opening the section creation form, and saving the new section.',
            prerequisites: [
                'User has valid authoring credentials',
                'User has access to the Open edX authoring environment',
                'User has at least one course created',
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
            title: 'Select the Course to Add a Section',
            description: 'From the list of available courses, click the course title to open its details and begin adding a new section.',
            screenshot: true,
        });
        // Basic URL assertion to confirm navigation reached the authoring area
        await (0, test_1.expect)(page).toHaveURL(/authoring\/home|authoring/);
        await (0, src_1.assertA11y)(page, { warnOnly: true, report: true, reportName: 'add-section-course-page' }, testInfo);
        await testDoc.click({
            selector: 'xpath=(//a[text()="Automated TestCourse"])[1]',
            title: 'Open the Selected Course',
            description: 'Navigates to the selected course page, where you can add sections and subsections as needed.',
            elementOnly: true,
        });
        // select the new section button
        await testDoc.click({
            selector: '.sub-header button:has-text("New section")',
            title: 'Add a New Section',
            description: 'Click the "New section" button to open the section creation form, where you can specify the section title and details.',
            elementOnly: true,
        });
        const { stepNumber, numberedStepNumber, screenshot } = await testDoc.highlight('.course-outline-section', null, { elementOnly: '.section-card', padding: 15 });
        testDoc.steps.push({
            stepNumber,
            numberedStepNumber,
            title: 'Section Form',
            description: 'The section form allows you to add one or more subsections to the new section. Complete the required fields and save your changes.',
            screenshot,
            note: null,
            showNumber: true,
        });
        await page.waitForLoadState('networkidle');
        await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
        });
        // create subsection: select the new section button
        await testDoc.click({
            selector: '(//div[contains(@class, "section-card")])[1]//button[contains(text(), "New subsection")]',
            title: 'Add a New Subsection',
            description: 'Click the "New subsection" button to add a new subsection within the selected section.',
            elementOnly: true,
        });
        // see subsection created
        const subsection = await testDoc.highlight('.course-outline-section', null, { elementOnly: '.section-card .section-card__subsections', padding: 15 });
        testDoc.steps.push({
            stepNumber: subsection.stepNumber,
            numberedStepNumber: subsection.numberedStepNumber,
            title: 'Subsection Form',
            description: 'The subsection form appears inside the section form, allowing you to specify details for the new subsection.',
            screenshot: subsection.screenshot,
            note: null,
            showNumber: true,
        });
        // Generate documentation
        await testDoc.generateMarkdown();
        await testDoc.generateRST();
        console.log('✅ exported course documentation generated successfully!');
    });
});
//# sourceMappingURL=add-section-course.spec.js.map