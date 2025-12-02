import { test, expect } from '@playwright/test';
import { LoginPage } from '../common/page-objects';
import { TestdocTest } from '../../utils/testdoc';
import { assert } from 'console';
import { assertA11y } from '../common/a11y-helpers';

test.describe('Testdoc: How To Create a Course', () => {
    let loginPage: LoginPage;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        await loginPage.navigate();
    });

    test('user can create a valid course', async ({ page }, testInfo) => {
        const testDoc = new TestdocTest(page, 'Create-Course-Test', {
            title: 'Creating a New Course in Open edX',
            overview: `This test automates the process of creating a new course in the Open edX authoring environment. It covers navigating to the course creation page, filling out the necessary details, and submitting the form to create the course.`,
            prerequisites: [
                'User has valid authoring credentials',
                'User has access to the Open edX authoring environment'
            ],
            notes: [
                'Ensure that the authoring environment is accessible before running this test.'
            ],
            relatedTopics: [
                { title: 'Import a Course', url: '#managing-courses' },
                { title: 'Export a Course', url: '#course-settings' }
            ],
        });
        await testDoc.initialize();
        //login
        const user = 'adminuser';
        const pass = 'admin123';
        await loginPage.login(user, pass);
        await page.waitForLoadState('networkidle');

        //Step 1:  Navigate to the authoring/create pag
        const authoringTarget ='http://apps.local.openedx.io:2001/authoring/home';
        await page.goto(authoringTarget);
        await testDoc.step({
            title: "Locate the New Course button",
            description: "The button is located on the authoring home page at top right  and is used to initiate the course creation process.",
            screenshot: true
        })
       
        // Basic URL assertion to confirm navigation reached the authoring area
        await expect(page).toHaveURL(/authoring\/home|authoring/);
        await assertA11y(page, { warnOnly: true, report: true, reportName: 'create-course-page' }, testInfo);

        //Step 2: Click on "New Course" button
        await testDoc.click({
            selector: 'button:has-text("New course")',
            title: 'Click the New course button',
            description: "This will show the create course form.",
            elementOnly: true
        });
        //Step 3: Fill the form
        const { stepNumber, numberedStepNumber, screenshot } = await testDoc.highlight(
                'body',
                null,
                { elementOnly: '.create-or-rerun-course-form', padding: 40 }
            );
        testDoc.steps.push({
            stepNumber,
            numberedStepNumber,
            title: 'Fill the create course form',
            description: 'The form contains four fields with the course information needed to be created, along with a Create button.',
            screenshot: screenshot,
            note: null,
            showNumber: true
        });

        //Step 4: Fill in course name
        await testDoc.fill({
            selector: 'input[name="displayName"]',
            value: 'Automated TestCourse',
            title: "Enter the course name",
            description: "Fill in the 'Course Name' field with the desired name for your new course.",
            elementOnly: 'form'
        });

        //Step 5: Fill in course org
       await testDoc.fill({
            selector: 'input[name="org"]',
            value: 'TestOrg',
            title: "Enter the course organization",
            description: "Fill in the 'Course Organization' field with the appropriate organization code.",
            elementOnly: 'form',
        });
        await testDoc.note("The organization name should not have spaces to be valid.");

        //Step 6: Fill in course number
        await testDoc.fill({
            selector: 'input[name="number"]',
            value: '101',
            title: "Enter the course number",
            description: "Fill in the 'Course Number' field with the desired course number.",
            elementOnly: 'form'
        });

        //Step 6: Fill in course run
        await testDoc.fill({
            selector: 'input[name="run"]',
            value: '2025_T1',
            title: "Enter the course run",
            description: "Fill in the 'Course Run' field with the appropriate run identifier.",
            elementOnly: 'form'
        });

        //Step 7: Click on "Create" button to create the course
        const createBtn = page.locator('button:has-text("Create")');
        await expect(createBtn).toBeVisible();
        await createBtn.click();

        await testDoc.click({
            selector: 'button:has-text("create")',
            title: 'Click the create course button',
            description: "This will show create course form with the information provided.",
            elementOnly: true
        });


        // Generate documentation
        await testDoc.generateMarkdown();
        await testDoc.generateRST();
        console.log("✅ Create course documentation generated successfully!");
    });

});