import { test, expect } from '@playwright/test';
import { LoginPage } from '../common/page-objects';
import { TestdocTest } from '../../utils/testdoc';
import { assertA11y } from '../common/a11y-helpers';
import { formatDate, shiftDate } from '../../utils/dates';

// SCHEDULE & DETAILS COURSE

test.describe('Set Start Date to a course', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigate();
  });
  test('User can set the course start date ', async ({ page }, testInfo) => {
    const testDoc = new TestdocTest(page, 'Set-Date-Course', {
      title: 'Adding a Unit to a Course in Open edX',
      overview: 'This test demonstrates how to set the start date for a course in the Open edX authoring environment. It covers navigating to the course management page, selecting a course, and updating its start date to control when learners can access the content.',
      prerequisites: [
        'User has valid authoring credentials',
        'User has access to the Open edX authoring environment',
        'User has at least one course created',
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
      title: 'Select the Course to Set Start Date',
      description: 'From the list of available courses, click the course title to open its details and begin setting the start date.',
      screenshot: true,
    });
    // Basic URL assertion to confirm navigation reached the authoring area
    await expect(page).toHaveURL(/authoring\/home|authoring/);
    await assertA11y(page, { warnOnly: true, report: true, reportName: 'add-section-course-page' }, testInfo);
    await testDoc.hideElement('.alert-content');
    await testDoc.click({
      selector: '(//a[text()="Automated TestCourse"])[1]',
      title: 'Open the Selected Course',
      description: 'Navigates to the selected course page, where you can access scheduling options.',
      elementOnly: true,
    });
    await page.waitForLoadState('networkidle');
    await page.locator('text=New unit').scrollIntoViewIfNeeded();// check this selector

    const sectionCard = await testDoc.highlight(
      '.outline-status-bar',
      null,
      { elementOnly: ".course-outline-section'", padding: 15 },
    );
    testDoc.steps.push({
      stepNumber: sectionCard.stepNumber,
      numberedStepNumber: sectionCard.numberedStepNumber,
      title: 'Set the Course Start Date',
      description: 'Click the "Set Date" button to open the date picker and select the desired start date for the course.',
      screenshot: sectionCard.screenshot,
      note: null,
      showNumber: true,
    });

    // select a subsection inside the secion
    await testDoc.click({
      selector: 'text=Set Date',
      title: 'Click on the Set Date button',
      description: 'add description',
      elementOnly: true,

    });
    await page.waitForLoadState('networkidle');
    // FILL THE FORM

    const courseSchedule = await testDoc.highlight(
      '.schedule-section',
      null,
      { elementOnly: '.setting-items', padding: 15 },
    );
    testDoc.steps.push({
      stepNumber: courseSchedule.stepNumber,
      numberedStepNumber: courseSchedule.numberedStepNumber,
      title: 'Course Schedule',
      description: 'Fill out the course schedule form by entering the start date, end date, enrollment start, and enrollment end dates as required.',
      screenshot: courseSchedule.screenshot,
      note: null,
      showNumber: true,
    });
    // we will fill the form based on today's date
    const today: Date = new Date();
    const startDate: Date = shiftDate(today, 1); // tomorrow
    const endDate: Date = shiftDate(today, 7); // one week later
    const enrollmentStartDate: Date = shiftDate(today, -7); // enrollment a week before the course starts
    const enrollmentEndDate: Date = shiftDate(today, -1); // enrollment end a day before the course starts
    await page.locator('input[name="startDate-date"]').scrollIntoViewIfNeeded();
    await testDoc.fill({
      selector: 'input[name="startDate-date"]',
      value: formatDate(startDate),
      title: 'Enter the course start date',
      description: 'Click on the input to see a calendar and select the date',
      elementOnly: 'form',
      padding: 100,
    });
    await page.locator('input[name="endDate-date"]').scrollIntoViewIfNeeded();
    await testDoc.fill({
      selector: 'input[name="endDate-date"]',
      value: formatDate(endDate),
      title: 'Enter the course end date',
      description: 'Click on the input to see a calendar and select the date',
      elementOnly: 'form',
      padding: 100,
    });
 
    await testDoc.fill({
      selector: 'input[name="enrollmentStart-date"]',
      value: formatDate(enrollmentStartDate),
      title: 'Enter the course enrollment start date',
      description: 'Click on the input to see a calendar and select the date',
      elementOnly: 'form',
      padding: 40,
    });

    await testDoc.fill({
      selector: 'input[name="enrollmentEnd-date"]',
      value: formatDate(enrollmentEndDate),
      title: 'Enter the course enrollment end date',
      description: 'Click on the input to see a calendar and select the date',
      elementOnly: 'form',
      padding: 40,
    });

    await page.locator('.details-section').scrollIntoViewIfNeeded();
    // Now we Select the Course details
    const courseDetails = await testDoc.highlight(
      '.details-section',
      null,
      { elementOnly: 'body', padding: 15 },
    );
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
    const courseDescription = await testDoc.highlight(
      '.introducing-section',
      null,
      { elementOnly: 'body', padding: 15 },
    );
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
    await page.locator('.introducing-section .pgn__form-group:nth-child(4)').scrollIntoViewIfNeeded();
    // Course Card Image
    const courseImage = await testDoc.highlight(
      '.introducing-section .pgn__form-group:nth-child(4)',
      null,
      { elementOnly: 'body', padding: 15 },
    );
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
    await page.locator('.introducing-section .pgn__form-group:nth-child(5)').scrollIntoViewIfNeeded();
    // Course Card Image
    const courseVideo = await testDoc.highlight(
      '.introducing-section .pgn__form-group:nth-child(5)',
      null,
      { elementOnly: 'body', padding: 15 },
    );
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
    const courseRequeriments = await testDoc.highlight(
      '.requirements-section',
      null,
      { elementOnly: 'body', padding: 15 },
    );
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
    const courseSection = await testDoc.highlight(
      '.license-section',
      null,
      { elementOnly: 'body', padding: 15 },
    );
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
    await testDoc.ShowElement('.alert-content', 'flex');
    testDoc.note('You can save anytime by clicking on the button "Save changes" inside the yellow alert');
    const { stepNumber, numberedStepNumber, screenshot } = await testDoc.highlight(
      '.alert-content',
      null,
      { elementOnly: '.body', padding: 15 },
    );
    testDoc.steps.push({
      stepNumber,
      numberedStepNumber,
      title: 'Save Changes',
      description: 'Click the "Save changes" button to persist all updates made to the course configuration.',
      screenshot,
      note: null,
      showNumber: true,
    });
    await testDoc.generateMarkdown();
    await testDoc.generateRST();

    // eslint-disable-next-line no-console
    console.log('✅ exported course documentation generated successfully!');
  });
});
