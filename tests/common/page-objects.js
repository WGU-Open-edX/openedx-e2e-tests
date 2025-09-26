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

class CoursePage {
  constructor(page) {
    this.page = page;
    this.enrollButton = page.locator('a.register');
    this.courseTitle = page.locator('h1');
    this.courseNumber = page.locator('.course-number');
    this.aboutSection = page.locator('section.about');
    this.socialSharing = page.locator('.social-sharing');
  }

  async navigateToCourse(courseId) {
    await this.page.goto(`/courses/${courseId}/about`);
  }

  async enroll() {
    await this.enrollButton.click();
  }

  async waitForPageLoad() {
    await this.courseTitle.waitFor();
    await this.enrollButton.waitFor();
  }
}

module.exports = { LoginPage, CoursePage };