import { test, expect } from '@playwright/test';
import { LoginPage } from '../common/page-objects';
import { TestdocTest } from '../../utils/testdoc';
import { assertA11y } from '../common/a11y-helpers';

test.describe('Add Unit to Course Test', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.navigate();
  });
  test('user can add a Unit to a course', async ({ page }, testInfo) => {
    const testDoc = new TestdocTest(page, 'Add-Unit-Course', {
      title: 'Adding a Unit to a Course in Open edX',
      overview: 'This test automates the process of adding a unit to  a course in the Open edX authoring environment. It covers navigating to the course page, selecting the desired course, and initiating the creation of the the unit process.',
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
    await page.waitForLoadState('networkidle');
    await page.locator('text=New unit').scrollIntoViewIfNeeded();// check this selector

    const sectionCard = await testDoc.highlight(
      '(//div[contains(@class,"section-card")])[1]',
      null,
      { elementOnly: ".course-outline-section'", padding: 15 }
    );
    testDoc.steps.push({
      stepNumber: sectionCard.stepNumber,
      numberedStepNumber: sectionCard.numberedStepNumber,
      title: 'Create a Unit',
      description: 'To create a new unit please locate the Section > Subsection form',
      screenshot: sectionCard.screenshot,
      note: null,
      showNumber: true,
    });

    // select a subsection inside the secion
    await testDoc.click({
      selector: 'text=New unit',
      title: 'Click on the New unit button',
      description: 'Then you will see this button which will redirect to a new page to create a unit',
      elementOnly: true,

    });

    /*  NOTE:
        when a user creates a unit it makes a redirect after the request, but here there's no way to get the
        blockId, so after some digginf I though in refresh the page and then edit the element that has the blockId 
        making the redirect successfully being able to create unit
    */
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="unit-card-header__title-link"]').first().click();

    await page.waitForLoadState('networkidle');

    await testDoc.screenshot({
      title: 'Add New component to Unit',
      description: 'Select the desired component to add it to the unit',
    });

    testDoc.note('In this case we are going to add a Text component.');

    await testDoc.click({
      selector: '.new-component-type li:first-child',
      title: 'Click on the New unit button',
      description: 'Then you will see this button which will redirect to a new page to create a unit',
      elementOnly: true,
    });
    await page.locator('.pgn__form-control-set div:first-child input[type="radio"][value="html"]').check();
    await testDoc.screenshot({
      title: 'Add Text component',
      description: 'One the Text component is selected this modal will show up with different options of texts to select',
      elementOnly: '.pgn__modal',
    });
    testDoc.note('We will select Text option in this case')
    // clicking on Text option
    await testDoc.click({
      selector: '.pgn__action-row button:has-text("Select")',
      title: 'Click on Select button',
      description: 'Then you will see this button which will redirect to a new page to create a unit',
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
