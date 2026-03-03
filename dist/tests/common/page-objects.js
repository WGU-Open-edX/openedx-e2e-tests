"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginPage = void 0;
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
    /** Login and wait for the auth redirect to complete (use when navigating immediately after login) */
    async loginAndWait(emailOrUsername, password) {
        await this.login(emailOrUsername, password);
        // Wait for the login redirect to complete so the session cookie is set
        // before any subsequent page.goto() calls
        await this.page.waitForURL((url) => !url.pathname.includes('/authn/'), { timeout: 15000 });
    }
    async togglePasswordVisibility() {
        await this.page.locator('button[name="passwordIcon"]').click();
    }
}
exports.LoginPage = LoginPage;
//# sourceMappingURL=page-objects.js.map