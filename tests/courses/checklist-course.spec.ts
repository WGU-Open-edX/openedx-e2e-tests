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
    // login
    const user = 'jesus.balderrama';
    const pass = 'avena';
    await loginPage.login(user, pass);
    await page.waitForLoadState('networkidle');

    // Step 1:  Navigate to the authoring/create pag
    const authoringTarget = 'http://apps.local.openedx.io:2001';
    // current path
    await page.goto(`${authoringTarget}/authoring/home/`);
    await testDoc.step({
      title: 'Select the course to complete the checklist',
      description: 'From the list of available courses, click the course title to open its details and begin the checklist completion process.',
      screenshot: true,
    });
    // Basic URL assertion to confirm navigation reached the authoring area
    await expect(page).toHaveURL(/authoring\/home|authoring/);
    await assertA11y(page, { warnOnly: true, report: true, reportName: 'checklist-course-page' }, testInfo);
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
    const launchChecklist = await testDoc.highlight(
      'body',
      null,
      { elementOnly: true, padding: 15 },
    );

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
    const welcomeMessage = await testDoc.highlight(
      '#checklist-item-welcomeMessage',
      null,
      { elementOnly: true, padding: 15 },
    );

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

    // fill the textarea
    // Wait for the iframe to be ready
    const frame = await page.frameLocator('iframe[id^="tiny-react_"]');

    // Type into the TinyMCE body
    await frame.locator('body#tinymce').fill('Welcome to this course');
    // todo: check CORS error, is not saving it but the flow is completed
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
    await page.goto(`${authoringTarget}${checklistPath}`);
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
      selector: '#checklist-item-gradingPolicy a:has(button:has-text("Update"))',
      title: 'Add Course Grading Policy',
      description: 'Click the update button to configure the grading policy for the course, specifying grade segments and criteria.',
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

      const grades = await testDoc.highlight(
        '.grading-scale-segments-and-ticks',
        null,
        { elementOnly: true, padding: 15 },
      );
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
      const assigmentItems = await testDoc.highlight(
        `.assignment-items > div:nth-child(${index + 1})`,
        null,
        { elementOnly: '.assignment-items', padding: 15 },
      );

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
      selector: '.alert-toast > .alert-content',
      title: 'Save Changes',
      description: 'Click the blue "Save changes" button at any time to update and persist your course configuration.',
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
