import { Page, TestInfo } from '@playwright/test';
import { AxeResults } from 'axe-core';
export interface A11yCheckOptions {
    /**
     * Disable specific accessibility rules
     */
    disabledRules?: string[];
    /**
     * Only run specific accessibility rules
     */
    enabledRules?: string[];
    /**
     * Exclude specific elements from accessibility checks
     */
    exclude?: string[];
    /**
     * If true, logs violations to console instead of throwing an error
     */
    warnOnly?: boolean;
    /**
     * Generate an accessibility report
     * - true: generates HTML report with auto-generated path based on test name
     * - string: saves report to specified path (.html or .json based on extension)
     */
    report?: boolean | string;
    /**
     * Base directory for reports when using report: true
     * Defaults to 'artifacts/a11y-reports'
     */
    reportDir?: string;
    /**
     * Report format when using report: true
     * Defaults to 'html'
     */
    reportFormat?: 'html' | 'json';
    /**
     * Optional name suffix for the report to distinguish multiple reports in same test
     * e.g., 'login-page', 'dashboard'
     */
    reportName?: string;
}
/**
 * Runs accessibility checks on the current page using axe-core
 * @param page - Playwright page object
 * @param options - Configuration options for the accessibility check
 * @returns Axe accessibility scan results
 */
export declare function checkA11y(page: Page, options?: A11yCheckOptions): Promise<AxeResults>;
/**
 * Runs accessibility checks and throws an error if violations are found
 * @param page - Playwright page object
 * @param options - Configuration options for the accessibility check
 * @param testInfo - Playwright test info (optional, used for auto-generating report paths)
 */
export declare function assertA11y(page: Page, options?: A11yCheckOptions, testInfo?: TestInfo): Promise<void>;
//# sourceMappingURL=a11y-helpers.d.ts.map