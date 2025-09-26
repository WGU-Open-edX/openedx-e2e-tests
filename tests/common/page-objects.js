class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.locator('input[name="emailOrUsername"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.loginButton = page.locator('button[name="sign-in"]');
    this.forgotPasswordLink = page.locator('a[name="forgot-password"]');
  }

  async navigate() {
    await this.page.goto('/authn/login');
  }

  async login(emailOrUsername, password) {
    await this.emailInput.fill(emailOrUsername);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async togglePasswordVisibility() {
    await this.page.locator('button[name="passwordIcon"]').click();
  }
}

module.exports = { LoginPage };