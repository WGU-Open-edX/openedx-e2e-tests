"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const page_objects_1 = require("../common/page-objects");
const src_1 = require("../../src");
test_1.test.skip();
test_1.test.describe('Add Unit to Course Test', () => {
    let loginPage;
    test_1.test.beforeEach(async ({ page }) => {
        loginPage = new page_objects_1.LoginPage(page);
        await loginPage.navigate();
    });
    (0, test_1.test)('user can add a Unit to a course', async ({ page }, testInfo) => {
        const user = process.env.TEST_USER || 'adminuser';
        const pass = process.env.TEST_PASS || 'admin123';
        const authoringTarget = process.env.AUTHORING_URL || 'http://apps.local.openedx.io:2001/authoring/home';
        const testDoc = new src_1.TestdocTest(page, 'Add-Unit-Course', {
            title: 'Adding a Unit to a Course in Open edX',
            overview: 'This test details the steps required to add a new unit to an existing course in the Open edX authoring environment. It includes navigating to the course, selecting the appropriate section, and using the interface to create a new unit.',
            prerequisites: [
                'User has valid authoring credentials',
                'User has access to the Open edX authoring environment',
                'User has at least one course created',
            ],
            notes: [
                'You need to have a section and subsection created in a course',
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
            title: 'Select the Course to Add a Unit',
            description: 'From the list of available courses, click the course title to open its details and begin adding a new unit.',
            screenshot: true,
        });
        // Basic URL assertion to confirm navigation reached the authoring area
        await (0, test_1.expect)(page).toHaveURL(/authoring\/home|authoring/);
        await (0, src_1.assertA11y)(page, { warnOnly: true, report: true, reportName: 'add-section-course-page' }, testInfo);
        await testDoc.click({
            selector: '(//a[text()="Automated TestCourse"])[1]',
            title: 'Open the Selected Course',
            description: 'Navigates to the selected course page, where you can add sections and units as needed.',
            elementOnly: true,
        });
        await page.waitForLoadState('networkidle');
        await page.locator('.course-outline-section').scrollIntoViewIfNeeded(); // check this selector
        const sectionCard = await testDoc.highlight('(//div[contains(@class,"section-card")])[1]', null, { elementOnly: ".course-outline-section'", padding: 15 });
        testDoc.steps.push({
            stepNumber: sectionCard.stepNumber,
            numberedStepNumber: sectionCard.numberedStepNumber,
            title: 'Create a New Unit',
            description: 'Locate the Section > Subsection form to begin the process of creating a new unit within the course.',
            screenshot: sectionCard.screenshot,
            note: null,
            showNumber: true,
        });
        // select the "New unit" button inside the first section-card
        await testDoc.click({
            selector: 'xpath=(//div[contains(@class,"section-card")][1]//div[contains(@class,"section-card__subsections")][1]//div[contains(@class,"subsection-card")][1]//button[contains(text(),"New unit")])[1]',
            title: 'Add a New Unit',
            description: 'Click the "New Unit" button to open the unit creation page, where you can enter the unit details and save your changes.',
            elementOnly: true,
        });
        /*  NOTE:
            when a user creates a unit it makes a redirect after the request, but here there's no way to get the
            blockId, so after some digging I thought in refresh the page and then edit the element that has the blockId
            making the redirect successfully being able to create unit.
    
            UPDATE: We don't need this anymore.
        */
        // await page.reload();
        // await page.waitForLoadState('networkidle');
        // await page.locator('[data-testid="unit-card-header__title-link"]').first().click();
        await page.waitForLoadState('networkidle');
        await testDoc.screenshot({
            title: 'Add New component to Unit',
            description: 'Select the desired component to add it to the unit',
        });
        testDoc.note('In this case we are going to add a Text component.');
        await testDoc.click({
            selector: '.new-component-type li:first-child',
            title: 'Select Text Component',
            description: 'Click the first item in the component list to add a Text component to the new unit.',
            elementOnly: true,
        });
        await page.locator('.pgn__form-control-set div:first-child input[type="radio"][value="html"]').check();
        await testDoc.screenshot({
            title: 'Add Text component',
            description: 'One the Text component is selected this modal will show up with different options of texts to select',
            elementOnly: '.pgn__modal',
        });
        testDoc.note('We will select Text option in this case');
        // clicking on Text option
        await testDoc.click({
            selector: '.pgn__action-row button:has-text("Select")',
            title: 'Confirm Component Selection',
            description: 'Click the "Select" button to confirm your choice and proceed to the unit editing page.',
            elementOnly: true,
        });
        await page.waitForLoadState('networkidle');
        // TODO: check this later: Getting 403 error after submitting.
        // Generate documentation
        await testDoc.generateMarkdown();
        await testDoc.generateRST();
        // eslint-disable-next-line no-console
        console.log('✅ exported course documentation generated successfully!');
    });
});
//# sourceMappingURL=add-unit.spec.js.map