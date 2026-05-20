#!/usr/bin/env node
/**
 * Deletes visual baseline screenshots for a specific test file across all browsers
 *
 * @param testFilePath - Path to the test file (e.g., 'tests/auth/login.spec.ts')
 * @param options - Configuration options
 * @param options.cwd - Current working directory (defaults to process.cwd())
 * @param options.browsers - Array of browser names to reset (defaults to ['chromium', 'firefox', 'webkit'])
 * @param options.verbose - Whether to log detailed output (defaults to true)
 */
export declare function resetVisualBaselines(testFilePath: string, options?: {
    cwd?: string;
    browsers?: string[];
    verbose?: boolean;
}): void;
