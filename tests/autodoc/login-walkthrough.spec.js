const { test, expect } = require("@playwright/test");
const { AutodocTest } = require("../../utils/autodoc");
const { LoginPage } = require("../common/page-objects");

test.describe("Autodoc: How to Login", () => {
  test("generate login documentation", async ({ page }) => {
    const autodoc = new AutodocTest(page, "How-to-Login-to-Open-edX", {
      title: "How to Log In to Your Open edX Account",
      overview: `This guide explains how to log in to your Open edX account. Once you log in, you can access your enrolled courses, track your progress, and manage your account settings.`,

      prerequisites: [
        "You have created an Open edX account",
        "You have your email address or username and password ready",
        "Your web browser has JavaScript enabled"
      ],

      notes: [
        "If you forgot your password, use the 'Forgot Password' link on the login page to reset it.",
      ],

      relatedTopics: [
        { title: "Creating an Open edX Account", url: "#creating-account" },
        { title: "Resetting Your Password", url: "#reset-password" },
        { title: "Account Settings and Profile Management", url: "#account-settings" },
        { title: "Course Enrollment", url: "#course-enrollment" }
      ],
      showNumbers: false
    });
    await autodoc.initialize();

    const loginPage = new LoginPage(page);

    // Step 1: Navigate to login page
    await loginPage.navigate();
    await autodoc.step({
      title: "Navigate to the Open edX login page",
      description: "You can access the login page by clicking 'Sign In' from the main Open edX website or by going directly to the login URL."
    });

    // Step 2: Show the login form
    await expect(loginPage.emailInput).toBeVisible();
    await autodoc.step({
      title: "Locate the login form",
      description: "The form contains two main fields: an email/username field and a password field, along with a 'Sign In' button."
    });

    // Step 3: Fill in email
    await autodoc.fill({
      selector: 'input[name="emailOrUsername"]',
      value: "testuser",
      title: "Enter your email or username",
      description: "Enter either the email address you registered with or your chosen username in the first field.",
      elementOnly: 'form[id="sign-in-form"]'
    });
    await autodoc.note("If you're unsure which one to use, try the email address you used when creating your account first.");

    // Step 4: Fill in password
    await autodoc.fill({
      selector: 'input[name="password"]',
      value: "password123",
      title: "Enter your password",
      description: "Type your password in the password field.",
      elementOnly: 'form[id="sign-in-form"]'
    });
    await autodoc.note("Your password is case-sensitive, so make sure your Caps Lock is in the correct position.");

    // Step 5: Click login button
    await autodoc.click({
      selector: 'button[name="sign-in"]',
      title: 'Click the "Sign In" button',
      description: "This will submit your login credentials and access your account.",
      elementOnly: true
    });

    // Step 6: Wait for navigation and show result
    await page.waitForLoadState("networkidle");
    await autodoc.screenshot({
      title: "Access your dashboard",
      description: "After successful login, you will be automatically redirected to your dashboard where you can view your enrolled courses, progress, and account information."
    });

    // Step 7: Demonstrate highlightElement (manual step creation)
    const { stepNumber, numberedStepNumber, screenshot } = await autodoc.highlight(
      'body',
      null,
      { elementOnly: 'main', padding: 15 }
    );

    autodoc.steps.push({
      stepNumber,
      numberedStepNumber,
      title: 'Main dashboard area highlighted',
      description: 'This is the main content area where you can see your courses and progress.',
      screenshot,
      note: null,
      showNumber: true
    });

    // Step 8: Add a step without screenshot
    await autodoc.step({
      title: "Explore your account options",
      description: "From the dashboard, you can navigate to different sections like My Courses, Account Settings, or Profile.",
      screenshot: false
    });
    await autodoc.note("Look for navigation menus or buttons to access different features.");

    // Generate documentation
    await autodoc.generateMarkdown();
    await autodoc.generateRST();

    console.log("✅ Login documentation generated successfully!");
  });
});
