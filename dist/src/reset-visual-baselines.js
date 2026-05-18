#!/usr/bin/env node
import { existsSync, rmSync } from 'fs';
import { join } from 'path';
/**
 * Deletes visual baseline screenshots for a specific test file across all browsers
 *
 * @param testFilePath - Path to the test file (e.g., 'tests/auth/login.spec.ts')
 * @param options - Configuration options
 * @param options.cwd - Current working directory (defaults to process.cwd())
 * @param options.browsers - Array of browser names to reset (defaults to ['chromium', 'firefox', 'webkit'])
 * @param options.verbose - Whether to log detailed output (defaults to true)
 */
export function resetVisualBaselines(testFilePath, options = {}) {
    const { cwd = process.cwd(), browsers = ['chromium', 'firefox', 'webkit'], verbose = true, } = options;
    // Remove 'tests/' prefix and '.ts' extension
    const baselinePath = testFilePath
        .replace(/^tests\//, '')
        .replace(/\.ts$/, '');
    if (verbose) {
        // eslint-disable-next-line no-console
        console.log(`Resetting visual baselines for: ${testFilePath}`);
        // eslint-disable-next-line no-console
        console.log(`Baseline path: ${baselinePath}`);
    }
    const deletedPaths = [];
    browsers.forEach(browser => {
        // Delete baselines
        const baselineDir = join(cwd, 'tests', '__visual-baselines__', browser, baselinePath);
        if (existsSync(baselineDir)) {
            rmSync(baselineDir, { recursive: true, force: true });
            deletedPaths.push(baselineDir);
        }
        // Delete artifacts
        const artifactsDir = join(cwd, 'artifacts', 'visual-regression', browser, baselinePath);
        if (existsSync(artifactsDir)) {
            rmSync(artifactsDir, { recursive: true, force: true });
            deletedPaths.push(artifactsDir);
        }
    });
    if (verbose) {
        if (deletedPaths.length > 0) {
            // eslint-disable-next-line no-console
            console.log(`✓ Deleted ${deletedPaths.length} directories`);
            deletedPaths.forEach(path => {
                // eslint-disable-next-line no-console
                console.log(`  - ${path}`);
            });
        }
        else {
            // eslint-disable-next-line no-console
            console.log('No baselines found to delete');
        }
        // eslint-disable-next-line no-console
        console.log('');
        // eslint-disable-next-line no-console
        console.log('Run your tests to regenerate baselines:');
        // eslint-disable-next-line no-console
        console.log(`  npm test -- ${testFilePath}`);
    }
}
// CLI usage
if (require.main === module) {
    const testFile = process.argv[2];
    if (!testFile) {
        // eslint-disable-next-line no-console
        console.error('Usage: reset-visual-baselines <test-file-path>');
        // eslint-disable-next-line no-console
        console.error('Example: reset-visual-baselines tests/auth/login.spec.ts');
        process.exit(1);
    }
    resetVisualBaselines(testFile);
}
//# sourceMappingURL=reset-visual-baselines.js.map