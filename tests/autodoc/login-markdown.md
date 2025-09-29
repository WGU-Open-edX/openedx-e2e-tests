# How to Login to Open edX

This guide shows you how to log into your Open edX account step by step.

## Navigate to Login Page

Go to the login page from the main website. You can access this by clicking the "Sign In" button.

```js
await loginPage.navigate();
await autodoc.screenshot({
  title: "Login page loaded",
  description: "The Open edX login page is displayed"
});
```

## Locate the Login Form

Find the login form on the page. It contains an email field, password field, and Sign In button.

```js
await expect(loginPage.emailInput).toBeVisible();
await autodoc.screenshot({
  title: "Login form visible",
  description: "The login form with all required fields",
  elementOnly: 'form[id="sign-in-form"]',
  padding: 20
});
```

## Enter Your Email

Click on the email field and enter your email address or username.

```js
await loginPage.emailInput.fill("testuser");
await autodoc.screenshot({
  title: "Email entered",
  description: "Email address filled in the email field",
  elementOnly: 'input[name="emailOrUsername"]',
  padding: 30
});
```

> **Note:** If you're unsure whether to use your email or username, try your email address first.

## Enter Your Password

Click on the password field and type your password carefully.

```js
await loginPage.passwordInput.fill("password123");
await autodoc.screenshot({
  title: "Password entered",
  description: "Password filled in (shown as dots for security)",
  elementOnly: 'input[name="password"]',
  padding: 30
});
```

> **Important:** Your password is case-sensitive. Make sure Caps Lock is off.

## Click Sign In

Click the "Sign In" button to submit your login credentials.

```js
await loginPage.loginButton.click();
await page.waitForLoadState('networkidle');

// Verify login succeeded - check for dashboard elements or absence of login form
await expect(page.locator('input[name="emailOrUsername"]')).not.toBeVisible();
// You can also check for dashboard-specific elements
// await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
```

## Access Your Dashboard

After successful login, you'll be redirected to your personal dashboard.

```js
await autodoc.screenshot({
  title: "Dashboard loaded",
  description: "Successfully logged in and viewing your dashboard"
});
```

You can now access your courses, account settings, and other features from the dashboard.