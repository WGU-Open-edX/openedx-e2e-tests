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
      overview: 'This test automates the process of adding a unit to  a course in the Open edX authoring environment. It covers navigating to the course page, selecting the desired course, and initiating the creation of the the unit process.',
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
      title: 'Select the desired course to set the start date',
      description: 'From the list of available courses, select the one you wish to set the start date by clicking on its title.',
      screenshot: true,
    });
    // Basic URL assertion to confirm navigation reached the authoring area
    await expect(page).toHaveURL(/authoring\/home|authoring/);
    await assertA11y(page, { warnOnly: true, report: true, reportName: 'add-section-course-page' }, testInfo);
    await testDoc.hideElement('.alert-content');
    await testDoc.click({
      selector: '(//a[text()="Automated TestCourse"])[1]',
      title: 'Click on the course name to select it and be able to set the date',
      description: 'This will select the course',
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
      title: 'Set the date',
      description: 'To set the date click on the Set Date',
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
      description: 'It is important to fill this form with the different dates',
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
      title: 'Course language',
      description: 'we select here the language of the course',
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
      title: 'Introducing your course',
      description: 'In this part of the form we can add the course description. First a short one and then a complete overview of the course.',
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
      title: 'Course card image',
      description: 'In this part of the form we can add the course description. First a short one and then a complete overview of the course.',
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
      title: 'Course Introduction video',
      description: 'In this part of the form we can add the course description. First a short one and then a complete overview of the course.',
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
      title: 'Course Requeriments',
      description: 'In this part of the form we can add the amount of effort inhours per week that is needes, also if there is a prerequisite for this course and if the students need to pass an exam before beginning the course',
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
      title: 'Course content license',
      description: 'The last part allows to select the type of license, just click on the option that you prefer.',
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
      title: 'Saving changes',
      description: 'Now you will save the changes that you have made',
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
