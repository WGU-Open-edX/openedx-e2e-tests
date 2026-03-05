"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const page_objects_1 = require("../common/page-objects");
const src_1 = require("../../src");
test_1.test.skip();
test_1.test.describe('Complete Course CheckList', () => {
    let loginPage;
    test_1.test.beforeEach(async ({ page }) => {
        loginPage = new page_objects_1.LoginPage(page);
        await loginPage.navigate();
    });
    (0, test_1.test)('user can complete the checklist of a course', async ({ page }, testInfo) => {
        const user = process.env.TEST_USER || 'adminuser';
        const pass = process.env.TEST_PASS || 'adminuser123';
        const authoringTarget = process.env.AUTHORING_URL || 'http://apps.local.openedx.io:2001/authoring/home';
        const openEdxUrl = 'http://apps.local.openedx.io:2001';
        const testDoc = new src_1.TestdocTest(page, 'Complete-Checklist-Course', {
            title: 'Complete the checklists of a course',
            overview: 'Once a course is created, it must be properly configured by completing all required checklists. This test guides you through the process of accessing a course and fulfilling its configuration checklists to ensure it is ready for use.',
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
            title: 'Select the course to complete the checklist',
            description: 'From the list of available courses, click the course title to open its details and begin the checklist completion process.',
            screenshot: true,
        });
        // Basic URL assertion to confirm navigation reached the authoring area
        await (0, test_1.expect)(page).toHaveURL(/authoring\/home|authoring/);
        await (0, src_1.assertA11y)(page, { warnOnly: true, report: true, reportName: 'checklist-course-page' }, testInfo);
        await testDoc.hideElement('.alert-content');
        await testDoc.click({
            selector: '(//a[text()="Automated TestCourse"])[1]',
            title: 'Open the selected course',
            description: 'Navigates to the selected course page, where you can access and complete the checklist items.',
            elementOnly: true,
        });
        // select the checklist button
        await testDoc.click({
            selector: '//h5[normalize-space()="Checklists"]/following::a[1]',
            title: 'Open the Checklists section',
            description: 'Click to access the Checklists section for the selected course, where configuration tasks are listed.',
            elementOnly: true,
        });
        // Launch Checklist
        const launchChecklist = await testDoc.highlight('body', null, { elementOnly: true, padding: 15 });
        testDoc.steps.push({
            stepNumber: launchChecklist.stepNumber,
            numberedStepNumber: launchChecklist.numberedStepNumber,
            title: 'Checklist Overview',
            description: 'You should now see the Launch Checklist and Best Practices Checklist, which outline the essential steps and recommendations for course setup.',
            screenshot: launchChecklist.screenshot,
            note: null,
            showNumber: true,
        });
        // checklist-item-welcomeMessage
        const welcomeMessage = await testDoc.highlight('#checklist-item-welcomeMessage', null, { elementOnly: true, padding: 15 });
        testDoc.steps.push({
            stepNumber: welcomeMessage.stepNumber,
            numberedStepNumber: welcomeMessage.numberedStepNumber,
            title: 'Add a Welcome Message',
            description: 'Begin by adding a welcome message. Click the update button inside the Welcome Message card to proceed.',
            screenshot: welcomeMessage.screenshot,
            note: null,
            showNumber: true,
        });
        await testDoc.click({
            selector: '#checklist-item-welcomeMessage a',
            title: 'Update Welcome Message',
            description: 'Redirects to the course info page, where you can enter and save your welcome message for students.',
            elementOnly: true,
        });
        await testDoc.click({
            selector: '.sub-header button:has-text("New update")',
            title: 'Add the Welcome Message',
            description: 'Click the "New Update" button at the top right to add your welcome message for the course.',
            elementOnly: null,
        });
        // --- TinyMCE debug and robust wait ---
        // Wait for the iframe to be attached
        await page.waitForSelector('iframe[id^="tiny-react_"]', { state: 'attached', timeout: 10000 });
        // List all frames for debug
        for (const f of page.frames()) {
            console.log('Frame:', f.url());
        }
        // Get the frame
        const frame = await page.frameLocator('iframe[id^="tiny-react_"]');
        // Check if body#tinymce exists
        const exists = await frame.locator('body#tinymce').count();
        console.log('body#tinymce exists:', exists);
        // Wait for the body to be visible (longer timeout)
        await frame.locator('body#tinymce').waitFor({ state: 'visible', timeout: 10000 });
        // Focus and fill
        await frame.locator('body#tinymce').click();
        await frame.locator('body#tinymce').fill('Welcome to this course');
        // --- end TinyMCE robust logic ---
        await testDoc.click({
            selector: '.update-form button:has-text("Post")',
            title: 'Post the Welcome Message',
            description: 'Type your welcome message and click the Post button to save it to the course information page.',
            elementOnly: null,
        });
        await page.waitForLoadState('networkidle');
        const path = new URL(page.url()).pathname;
        const checklistPath = `${path.replace(/\/[^/]+$/, '')}/checklists`;
        // checklist page
        await page.goto(`${openEdxUrl}${checklistPath}`);
        // checklist updated
        testDoc.steps.push({
            stepNumber: launchChecklist.stepNumber,
            numberedStepNumber: launchChecklist.numberedStepNumber,
            title: 'Checklist Progress',
            description: 'After posting the welcome message, return to the checklist page to verify that the task is marked as complete.',
            screenshot: launchChecklist.screenshot,
            note: null,
            showNumber: true,
        });
        // Course grading policy
        await testDoc.click({
            selector: '#checklist-item-gradingPolicy a[data-testid="update-link"] > button:has-text("Update")',
            title: 'Add Course Grading Policy',
            description: 'Click the update button to configure the grading policy for the course, specifying grade segments and criteria.',
            elementOnly: null,
        });
        const courseSchedule = await testDoc.highlight('.grading', null, { elementOnly: true, padding: 15 });
        testDoc.steps.push({
            stepNumber: courseSchedule.stepNumber,
            numberedStepNumber: courseSchedule.numberedStepNumber,
            title: 'Course Grading',
            description: 'On this page, configure the grading scheme for the course. By default, two grades (Fail and Pass) are present. You can add more grade segments as needed.',
            screenshot: courseSchedule.screenshot,
            note: null,
            showNumber: true,
        });
        // await testDoc.click({
        //   selector: 'button[aria-label="Add new grading segment"]',
        //   title: 'Add more grades',
        //   description: 'By clicking in the + icon in the left of the bar, you can add more grades',
        //   elementOnly: true,
        // });
        /* eslint-disable no-await-in-loop */
        testDoc.note('Each time we click the + button a new grade will be added, the order is F,C and D');
        const gradesToHighlight = ['F', 'C', 'D'];
        for (const grade of gradesToHighlight) {
            await testDoc.click({
                selector: 'button[aria-label="Add new grading segment"]',
                title: `Add ${grade} Grade`,
                description: 'Click the + icon to add a new grade segment to the grading bar.',
                elementOnly: true,
            });
            const grades = await testDoc.highlight('.grading-scale-segments-and-ticks', null, { elementOnly: true, padding: 15 });
            testDoc.steps.push({
                stepNumber: grades.stepNumber,
                numberedStepNumber: grades.numberedStepNumber,
                title: `${grade} Grade Added`,
                description: `After clicking the + button, the ${grade} grade segment appears in the grading bar.`,
                screenshot: grades.screenshot,
                note: null,
                showNumber: true,
            });
        }
        // Assignment types
        await page.locator('.assignment-items').scrollIntoViewIfNeeded();
        testDoc.steps.push({
            stepNumber: 23,
            numberedStepNumber: 24,
            title: 'Assignment Types',
            description: 'A list of default assignment types is displayed. You can edit, remove, or add new assignment types as needed for your course.',
            screenshot: null,
            note: null,
            showNumber: true,
        });
        const assignments = ['Homework', 'Lab', 'Midterm Exam', 'Final Exam'];
        for (const [index, assignment] of assignments.entries()) {
            await page.locator(`.assignment-items > div:nth-child(${index + 1})`).scrollIntoViewIfNeeded();
            const assigmentItems = await testDoc.highlight(`.assignment-items > div:nth-child(${index + 1})`, null, { elementOnly: '.assignment-items', padding: 15 });
            testDoc.steps.push({
                stepNumber: assigmentItems.stepNumber,
                numberedStepNumber: assigmentItems.numberedStepNumber,
                title: `Assignment: ${assignment}`,
                description: `This form allows you to configure the ${assignment} assignment type. Default values are provided, but you can modify them as needed.`,
                screenshot: assigmentItems.screenshot,
                note: null,
                showNumber: true,
            });
            // todo: TO REMOVE THE CARD WARNINGS IN EACH FORM, WE NEED TO UPDATE A SUBSECTION ASSIGNING THIS TYPE
        }
        // save Data
        await testDoc.ShowElement('.alert-content', 'flex');
        await testDoc.click({
            selector: '.alert-content button.btn-primary:has-text("Save changes")',
            title: 'Save Changes',
            description: 'Click the blue "Save changes" button at any time to update and persist your course configuration.',
            elementOnly: true,
        });
        // going back to checklist page
        await page.goto(`${openEdxUrl}${checklistPath}`);
        // checklist updated
        testDoc.steps.push({
            stepNumber: launchChecklist.stepNumber,
            numberedStepNumber: launchChecklist.numberedStepNumber,
            title: 'Checklist Progress',
            description: 'After posting the welcome message, return to the checklist page to verify that the task is marked as complete.',
            screenshot: launchChecklist.screenshot,
            note: null,
            showNumber: true,
        });
        // Course grading policy
        await testDoc.click({
            selector: '#checklist-item-courseDates a:has(button:has-text("Update"))',
            title: 'Add Course Grading Policy',
            description: 'Click the update button to configure the grading policy for the course, specifying grade segments and criteria.',
            elementOnly: null,
        });
        // FILL THE FORM
        const courseScheduleForm = await testDoc.highlight('.schedule-section', null, { elementOnly: '.setting-items', padding: 15 });
        testDoc.steps.push({
            stepNumber: courseScheduleForm.stepNumber,
            numberedStepNumber: courseScheduleForm.numberedStepNumber,
            title: 'Course Schedule',
            description: 'Fill out the course schedule form by entering the start date, end date, enrollment start, and enrollment end dates as required.',
            screenshot: courseScheduleForm.screenshot,
            note: null,
            showNumber: true,
        });
        // we will fill the form based on today's date
        const today = new Date();
        const startDate = (0, src_1.shiftDate)(today, 1); // tomorrow
        const endDate = (0, src_1.shiftDate)(today, 7); // one week later
        const enrollmentStartDate = (0, src_1.shiftDate)(today, -7); // enrollment a week before the course starts
        const enrollmentEndDate = (0, src_1.shiftDate)(today, -1); // enrollment end a day before the course starts
        await page.locator('input[name="startDate-date"]').scrollIntoViewIfNeeded();
        await testDoc.fill({
            selector: 'input[name="startDate-date"]',
            value: (0, src_1.formatDate)(startDate),
            title: 'Enter the course start date',
            description: 'Click on the input to see a calendar and select the date',
            elementOnly: 'form',
            padding: 100,
        });
        await page.locator('input[name="endDate-date"]').scrollIntoViewIfNeeded();
        await testDoc.fill({
            selector: 'input[name="endDate-date"]',
            value: (0, src_1.formatDate)(endDate),
            title: 'Enter the course end date',
            description: 'Click on the input to see a calendar and select the date',
            elementOnly: 'form',
            padding: 100,
        });
        await testDoc.fill({
            selector: 'input[name="enrollmentStart-date"]',
            value: (0, src_1.formatDate)(enrollmentStartDate),
            title: 'Enter the course enrollment start date',
            description: 'Click on the input to see a calendar and select the date',
            elementOnly: 'form',
            padding: 40,
        });
        await testDoc.fill({
            selector: 'input[name="enrollmentEnd-date"]',
            value: (0, src_1.formatDate)(enrollmentEndDate),
            title: 'Enter the course enrollment end date',
            description: 'Click on the input to see a calendar and select the date',
            elementOnly: 'form',
            padding: 40,
        });
        await page.locator('.details-section').scrollIntoViewIfNeeded();
        // Now we Select the Course details
        const courseDetails = await testDoc.highlight('.details-section', null, { elementOnly: 'body', padding: 15 });
        testDoc.steps.push({
            stepNumber: courseDetails.stepNumber,
            numberedStepNumber: courseDetails.numberedStepNumber,
            title: 'Course Language',
            description: 'Select the language in which the course will be delivered from the available options.',
            screenshot: courseDetails.screenshot,
            note: null,
            showNumber: true,
        });
        await page.locator('.introducing-section').scrollIntoViewIfNeeded();
        // Course Description
        const courseDescription = await testDoc.highlight('.introducing-section', null, { elementOnly: 'body', padding: 15 });
        testDoc.steps.push({
            stepNumber: courseDescription.stepNumber,
            numberedStepNumber: courseDescription.numberedStepNumber,
            title: 'Course Introduction',
            description: 'Add a short description and a complete overview of the course to help learners understand its objectives and content.',
            screenshot: courseDescription.screenshot,
            note: null,
            showNumber: true,
        });
        testDoc.note('the course short descripcition can be empty and in the course overview you will find a useful template');
        await page.locator('.introducing-section .pgn__form-group.w-100').scrollIntoViewIfNeeded();
        // Course Card Image
        const courseImage = await testDoc.highlight('.introducing-section .pgn__form-group.w-100', null, { elementOnly: 'body', padding: 15 });
        testDoc.steps.push({
            stepNumber: courseImage.stepNumber,
            numberedStepNumber: courseImage.numberedStepNumber,
            title: 'Course Card Image',
            description: 'Upload an image to represent the course on the course card. This helps visually distinguish the course in listings.',
            screenshot: courseImage.screenshot,
            note: null,
            showNumber: true,
        });
        // Course video introduction
        await page.locator('.introducing-section .pgn__form-group.form-group-custom:last-of-type').scrollIntoViewIfNeeded();
        // Course Card Image
        const courseVideo = await testDoc.highlight('.introducing-section .pgn__form-group.form-group-custom:last-of-type', null, { elementOnly: 'body', padding: 15 });
        testDoc.steps.push({
            stepNumber: courseVideo.stepNumber,
            numberedStepNumber: courseVideo.numberedStepNumber,
            title: 'Course Introduction Video',
            description: 'Add a video introduction to give learners an overview of the course and its key features.',
            screenshot: courseVideo.screenshot,
            note: null,
            showNumber: true,
        });
        // Course Requirements
        await page.locator('.requirements-section').scrollIntoViewIfNeeded();
        const courseRequeriments = await testDoc.highlight('.requirements-section', null, { elementOnly: 'body', padding: 15 });
        testDoc.steps.push({
            stepNumber: courseRequeriments.stepNumber,
            numberedStepNumber: courseRequeriments.numberedStepNumber,
            title: 'Course Requirements',
            description: 'Specify the expected weekly effort, any prerequisites, and whether students must pass an exam before starting the course.',
            screenshot: courseRequeriments.screenshot,
            note: null,
            showNumber: true,
        });
        await page.locator('.license-section').scrollIntoViewIfNeeded();
        const courseSection = await testDoc.highlight('.license-section', null, { elementOnly: 'body', padding: 15 });
        // TODO: add the case for creative commons
        testDoc.steps.push({
            stepNumber: courseSection.stepNumber,
            numberedStepNumber: courseSection.numberedStepNumber,
            title: 'Course Content License',
            description: 'Select the appropriate license type for your course content from the available options.',
            screenshot: courseSection.screenshot,
            note: null,
            showNumber: true,
        });
        // showing the save button
        // TODO: check why the button is not saving
        // await testDoc.ShowElement('.alert-content', 'flex');
        // await testDoc.click({
        //   selector: '.alert-content button.btn-primary:has-text("Save changes")',
        //   title: 'Save Changes',
        //   description: 'Click the blue "Save changes" button at any time to update and persist your course '
        //     + 'configuration.',
        //   elementOnly: true,
        // });
        // Generate documentation
        await testDoc.generateMarkdown();
        await testDoc.generateRST();
        console.log('✅ exported course documentation generated successfully!');
    });
});
//# sourceMappingURL=checklist-course.spec.js.map