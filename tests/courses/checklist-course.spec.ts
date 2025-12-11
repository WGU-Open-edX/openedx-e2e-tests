import { test, expect } from '@playwright/test';
import { LoginPage } from '../common/page-objects';
import { TestdocTest } from '../../utils/testdoc';
import { assertA11y } from '../common/a11y-helpers';

test.describe('Complete Course CheckList', () => {
  let loginPage: LoginPage;
  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigate();
  });
  test('user can complete the checklist of a course', async ({ page }, testInfo) => {
    const testDoc = new TestdocTest(page, 'Complete-Checklist-Course', {
      title: 'Complete the checklists of a course',
      overview: 'After the course is created we need to configure it to use it properly, to do that we need to add the pending checklists',
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
    // login
    const user = 'jesus.balderrama';
    const pass = 'avena';
    await loginPage.login(user, pass);
    await page.waitForLoadState('networkidle');

    // Step 1:  Navigate to the authoring/create pag
    const authoringTarget = 'http://apps.local.openedx.io:2001';
    // current path
    const path = new URL(page.url()).pathname;
    const checklistPath = `${path.replace(/\/[^/]+$/, '')}/checklists`;
    await page.goto(`${authoringTarget}/authoring/home/`);
    await testDoc.step({
      title: 'Select the desired course to complete the checklist',
      description: 'From the list of available courses, select the one you wish by clicking on its title.',
      screenshot: true,
    });
    // Basic URL assertion to confirm navigation reached the authoring area
    await expect(page).toHaveURL(/authoring\/home|authoring/);
    await assertA11y(page, { warnOnly: true, report: true, reportName: 'checklist-course-page' }, testInfo);
    await testDoc.hideElement('.alert-content');
    await testDoc.click({
      selector: '(//a[text()="Automated TestCourse"])[1]',
      title: 'Click on the course name to select it and be able to complete the checklist',
      description: 'This will redirect to the selected course page',
      elementOnly: true,
    });
    // select the checklist button
    await testDoc.click({
      selector: '//h5[normalize-space()="Checklists"]/following::a[1]',
      title: 'Click on the New section button',
      description: 'This will a new section in the selected course',
      elementOnly: true,
    });

    // Launch Checklist
    const launchChecklist = await testDoc.highlight(
      'body',
      null,
      { elementOnly: true, padding: 15 },
    );

    testDoc.steps.push({
      stepNumber: launchChecklist.stepNumber,
      numberedStepNumber: launchChecklist.numberedStepNumber,
      title: 'Checklist to complete',
      description: 'Now you will see a this view this the launch checklist and the best practices checklist',
      screenshot: launchChecklist.screenshot,
      note: null,
      showNumber: true,
    });
    // checklist-item-welcomeMessage
    const welcomeMessage = await testDoc.highlight(
      '#checklist-item-welcomeMessage',
      null,
      { elementOnly: true, padding: 15 },
    );

    testDoc.steps.push({
      stepNumber: welcomeMessage.stepNumber,
      numberedStepNumber: welcomeMessage.numberedStepNumber,
      title: 'Add a welcome message',
      description: 'First we are going to add the welcome message, please click on the update button inside this card',
      screenshot: welcomeMessage.screenshot,
      note: null,
      showNumber: true,
    });

    await testDoc.click({
      selector: '#checklist-item-welcomeMessage a',
      title: 'Click on update',
      description: 'This will a redirect us to the course info page where we can add our desired information',
      elementOnly: true,
    });

    await testDoc.click({
      selector: '.sub-header button:has-text("New update")',
      title: 'Add the welcome message',
      description: 'You can add the welcome message by clicking on the button new update at the right top',
      elementOnly: null,
    });

    // fill the textarea
    // Wait for the iframe to be ready
    const frame = await page.frameLocator('iframe[id^="tiny-react_"]');

    // Type into the TinyMCE body
    await frame.locator('body#tinymce').fill('Welcome to this course');
    // todo: check CORS error, is not saving it but the flow is completed
    await testDoc.click({
      selector: '.update-form button:has-text("Post")',
      title: 'Adding the welcome message',
      description: 'Type your welcome message and then click on the Post button to save the message.',
      elementOnly: null,
    });
    await page.waitForLoadState('networkidle');
    // checklist page
    await page.goto(`${authoringTarget}${checklistPath}`);
    // checklist updated
    testDoc.steps.push({
      stepNumber: launchChecklist.stepNumber,
      numberedStepNumber: launchChecklist.numberedStepNumber,
      title: 'Checklist to complete',
      description: 'Now you will see that the welcome message task is completed',
      screenshot: launchChecklist.screenshot,
      note: null,
      showNumber: true,
    });

    // Course grading policy
    await testDoc.click({
      selector: '#checklist-item-gradingPolicy a:has(button:has-text("Update"))',
      title: 'Add course grade policy',
      description: 'click on the update button to add the course grading policy',
      elementOnly: null,
    });

    const courseSchedule = await testDoc.highlight(
      '.grading',
      null,
      { elementOnly: true, padding: 15 },
    );
    testDoc.steps.push({
      stepNumber: courseSchedule.stepNumber,
      numberedStepNumber: courseSchedule.numberedStepNumber,
      title: 'Course Grading',
      description: 'In this page we can add the grading to the course, first we will sea a bar with two colors, by default the course has two grades (Fail or Pass)',
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
        title: `Add ${grade} grade`,
        description: 'By clicking in the + icon in the left of the bar, you can add more grades',
        elementOnly: true,
      });

      const grades = await testDoc.highlight(
        '.grading-scale-segments-and-ticks',
        null,
        { elementOnly: true, padding: 15 },
      );
      testDoc.steps.push({
        stepNumber: grades.stepNumber,
        numberedStepNumber: grades.numberedStepNumber,
        title: `${grade} Grade`,
        description: `after clicking the + button you will see the ${grade} grade added`,
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
      description: 'Now you will see a a list of default assignment types created by default, you can edit or remove these ones, even add new ones',
      screenshot: null,
      note: null,
      showNumber: true,
    });
    const assignments = ['Homework', 'Lab', 'Midterm Exam', 'Final Exam'];
    for (const [index, assignment] of assignments.entries()) {
      await page.locator(`.assignment-items > div:nth-child(${index + 1})`).scrollIntoViewIfNeeded();
      const assigmentItems = await testDoc.highlight(
        `.assignment-items > div:nth-child(${index + 1})`,
        null,
        { elementOnly: '.assignment-items', padding: 15 },
      );

      testDoc.steps.push({
        stepNumber: assigmentItems.stepNumber,
        numberedStepNumber: assigmentItems.numberedStepNumber,
        title: `Assignment ${assignment}`,
        description: `This is the ${assignment} form, it has values by default but you can change it if you prefer`,
        screenshot: assigmentItems.screenshot,
        note: null,
        showNumber: true,
      });
      // todo: TO REMOVE THE CARD WARNINGS IN EACH FORM, WE NEED TO UPDATE A SUBSECTION ASSIGNING THIS TYPE
    }
    // save Data
    await testDoc.ShowElement('.alert-content', 'flex');
    await testDoc.click({
      selector: '.alert-toast > .alert-content',
      title: 'Saving changes',
      description: 'Anytime you want to save any data you can click in the blue button "Save changes" to update the information',
      elementOnly: true,
    });

    // going back to checklist page
    await page.goto(`${authoringTarget}${checklistPath}`);

    // Generate documentation
    await testDoc.generateMarkdown();
    await testDoc.generateRST();
    console.log('✅ exported course documentation generated successfully!');
  });
});
