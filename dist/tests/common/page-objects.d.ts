import { Page, Locator } from '@playwright/test';
export declare class LoginPage {
    readonly page: Page;
    readonly emailInput: Locator;
    readonly passwordInput: Locator;
    readonly loginButton: Locator;
    readonly forgotPasswordLink: Locator;
    constructor(page: Page);
    navigate(): Promise<void>;
    login(emailOrUsername: string, password: string): Promise<void>;
    /** Login and wait for the auth redirect to complete (use when navigating immediately after login) */
    loginAndWait(emailOrUsername: string, password: string): Promise<void>;
    togglePasswordVisibility(): Promise<void>;
}
//# sourceMappingURL=page-objects.d.ts.map