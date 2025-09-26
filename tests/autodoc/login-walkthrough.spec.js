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
      ]
    });
    await autodoc.initialize();

    const loginPage = new LoginPage(page);

    // Step 1: Navigate to login page
    await loginPage.navigate();
    await autodoc.addStep(
      "Navigate to the Open edX login page",
      "You can access the login page by clicking 'Sign In' from the main Open edX website or by going directly to the login URL."
    );

    // Step 2: Show the login form
    await expect(loginPage.emailInput).toBeVisible();
    await autodoc.addStep(
      "Locate the login form",
      "The form contains two main fields: an email/username field and a password field, along with a 'Sign In' button."
    );

    // Step 3: Fill in email
    await autodoc.fillElement(
      'input[name="emailOrUsername"]',
      "testuser",
      "Enter your email or username",
      "Enter either the email address you registered with or your chosen username in the first field.",
      { elementOnly: 'form[id="sign-in-form"]', note: "If you're unsure which one to use, try the email address you used when creating your account first." }
    );

    // Step 4: Fill in password
    await autodoc.fillElement(
      'input[name="password"]',
      "password123",
      "Enter your password",
      "Type your password in the password field.",
      { elementOnly: 'form[id="sign-in-form"]', note: "Your password is case-sensitive, so make sure your Caps Lock is in the correct position." }
    );

    // Step 5: Click login button
    await autodoc.clickElement(
      'button[name="sign-in"]',
      'Click the "Sign In" button',
      "This will submit your login credentials and access your account.",
      { elementOnly: true }
    );

    // Step 6: Wait for navigation and show result
    await page.waitForLoadState("networkidle");
    await autodoc.addStep(
      "Access your dashboard",
      "After successful login, you will be automatically redirected to your dashboard where you can view your enrolled courses, progress, and account information."
    );

    // Generate documentation
    await autodoc.generateMarkdown();
    await autodoc.generateRST();

    console.log("✅ Login documentation generated successfully!");
  });
});
