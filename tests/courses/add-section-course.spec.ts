import { test, expect } from '@playwright/test';
import { LoginPage } from '../common/page-objects';
import { TestdocTest } from '../../utils/testdoc';
import { assertA11y } from '../common/a11y-helpers';

test.describe('Add Section to Course Test', () => {
  let loginPage: LoginPage;
  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigate();
  });
  test('user can add a Section to a course', async ({ page }, testInfo) => {
    const testDoc = new TestdocTest(page, 'Add-Section-Course', {
      title: 'Adding section to a Course in Open edX',
      overview: 'This test automates the process of adding a section to  a course in the Open edX authoring environment. It covers navigating to the course page, selecting the desired course, and initiating the creation of the section process.',
      prerequisites: [
        'User has valid authoring credentials',
        'User has access to the Open edX authoring environment',
        'User has at least one course created'
      ],
      notes: [
        'Ensure that the authoring environment is accessible before running this test.'
      ],
      relatedTopics: [
        { title: 'Create a Course', url: '#managing-courses' },
        { title: 'Import a Course', url: '#course-settings' }
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
      title: 'Select the desired course to create a section',
      description: 'From the list of available courses, select the one you wish to add a section by clicking on its title.',
      screenshot: true,
    });
    // Basic URL assertion to confirm navigation reached the authoring area
    await expect(page).toHaveURL(/authoring\/home|authoring/);
    await assertA11y(page, { warnOnly: true, report: true, reportName: 'add-section-course-page' }, testInfo);


    await testDoc.click({
      selector: '(//a[text()="Automated TestCourse"])[1]',
      title: 'Click on the course name to select it and be able to add a section',
      description: 'This will create a new Section where we can add subsections later.',
      elementOnly: true,
    });
    // select the new section button
    await testDoc.click({
      selector: '.sub-header button:has-text("New section")',
      title: 'Click on the New section button',
      description: 'This will a new section in the selected course',
      elementOnly: true,
    });
    const { stepNumber, numberedStepNumber, screenshot } = await testDoc.highlight(
      '.course-outline-section',
      null,
      { elementOnly: '.section-card', padding: 15 },
    );
    testDoc.steps.push({
      stepNumber,
      numberedStepNumber,
      title: 'Section Form',
      description: 'Now you will see a section form where you can add subsections.',
      screenshot,
      note: null,
      showNumber: true,
    });

    // create subsection: select the new section button
    await testDoc.click({
      selector: '.section-card .section-card__subsections button:has-text("New subsection")',
      title: 'Click on the New subsection button',
      description: 'This will create a new subsection in the selected section',
      elementOnly: true,
    });
    // see subsection created
    const subsection = await testDoc.highlight(
      '.course-outline-section',
      null,
      { elementOnly: '.section-card .section-card__subsections', padding: 15 },
    );
    testDoc.steps.push({
      stepNumber: subsection.stepNumber,
      numberedStepNumber: subsection.numberedStepNumber,
      title: 'Subsection Form',
      description: 'Now you will see a subsection form inside the section form',
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
