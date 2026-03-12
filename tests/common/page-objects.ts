import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;

  readonly emailInput: Locator;

  readonly passwordInput: Locator;

  readonly loginButton: Locator;

  readonly forgotPasswordLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[name="emailOrUsername"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.loginButton = page.locator('button[name="sign-in"]');
    this.forgotPasswordLink = page.locator('a[name="forgot-password"]');
  }

  async navigate(): Promise<void> {
    await this.page.goto('/authn/login');
  }

  async login(emailOrUsername: string, password: string): Promise<void> {
    await this.emailInput.fill(emailOrUsername);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  /** Login and wait for the auth redirect to complete (use when navigating immediately after login) */
  async loginAndWait(emailOrUsername: string, password: string): Promise<void> {
    await this.login(emailOrUsername, password);
    // Wait for the login redirect to complete so the session cookie is set
    // before any subsequent page.goto() calls
    await this.page.waitForURL((url) => !url.pathname.includes('/authn/'), { timeout: 15000 });
  }

  async togglePasswordVisibility(): Promise<void> {
    await this.page.locator('button[name="passwordIcon"]').click();
  }
}
