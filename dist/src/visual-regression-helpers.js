import { existsSync, mkdirSync, readFileSync, writeFileSync, } from 'fs';
import { join } from 'path';
import { PNG } from 'pngjs';
/**
 * Visual regression helper that:
 * 1. Captures baseline screenshots on first run
 * 2. Compares against baseline on subsequent runs
 * 3. Generates diff images with red highlights for changed pixels
 * 4. Stores baselines in tests/__visual-baselines__/ (tracked in git)
 * 5. Stores current and diff images in artifacts/visual-regression/ (gitignored)
 */
export class VisualRegression {
    constructor(page, testInfo) {
        this.page = page;
        this.testInfo = testInfo;
        const projectName = testInfo.project.name;
        // Extract relative test file path (e.g., "auth/login.spec.ts" or "instructor-dashboard.spec.ts")
        const testFilePath = testInfo.file.replace(process.cwd(), '').replace(/^\/tests\//, '').replace(/\.ts$/, '');
        // Store baselines in version control, matching test file structure
        this.baselineDir = join(process.cwd(), 'tests', '__visual-baselines__', projectName, testFilePath);
        // Store current run and diffs in artifacts (gitignored)
        this.currentDir = join(process.cwd(), 'artifacts', 'visual-regression', projectName, testFilePath, 'current');
        this.diffDir = join(process.cwd(), 'artifacts', 'visual-regression', projectName, testFilePath, 'diff');
        this.ensureDirectories();
    }
    ensureDirectories() {
        [this.baselineDir, this.currentDir, this.diffDir].forEach(dir => {
            if (!existsSync(dir)) {
                mkdirSync(dir, { recursive: true });
            }
        });
    }
    /**
     * Capture a screenshot and compare against baseline
     * On first run: creates baseline
     * On subsequent runs: compares and generates diff with red highlights
     */
    async captureAndCompare(options) {
        const { name, mask = [], maskAreas = [], fullPage = true, threshold = 0.1, } = options;
        const baselinePath = join(this.baselineDir, `${name}.png`);
        const currentPath = join(this.currentDir, `${name}.png`);
        const diffPath = join(this.diffDir, `${name}-diff.png`);
        // Wait for page to be completely stable
        await this.page.waitForLoadState('load');
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForLoadState('networkidle');
        // Wait for any images to load
        await this.page.evaluate(() => Promise.all(Array.from(document.images)
            .filter(img => !img.complete)
            .map(img => new Promise(resolve => {
            const element = img;
            element.addEventListener('load', () => resolve(undefined));
            element.addEventListener('error', () => resolve(undefined));
        }))));
        // Wait for fonts to load
        await this.page.evaluate(() => document.fonts.ready);
        // Wait for any background requests to complete
        await this.page.waitForTimeout(2000);
        // Brute force disable ALL animations, transitions, and transformations
        const maskSelectors = mask.join(', ');
        await this.page.addStyleTag({
            content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          animation-iteration-count: 1 !important;
          animation-play-state: paused !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
          transition-property: none !important;
          transform: none !important;
          caret-color: transparent !important;
        }
        ${maskSelectors ? `${maskSelectors} { opacity: 0 !important; pointer-events: none !important; visibility: hidden !important; }` : ''}
      `,
        });
        // Apply coordinate-based masks by creating pink overlays
        if (maskAreas.length > 0) {
            await this.page.evaluate((areas) => {
                areas.forEach((area, index) => {
                    const div = document.createElement('div');
                    div.id = `vr-mask-${index}`;
                    div.style.cssText = `
            position: fixed;
            left: ${area.x}px;
            top: ${area.y}px;
            width: ${area.width}px;
            height: ${area.height}px;
            background-color: #FF00FF;
            z-index: 999999;
            pointer-events: none;
          `;
                    document.body.appendChild(div);
                });
            }, maskAreas);
        }
        // Wait for styles to fully apply and any running animations to stop
        await this.page.waitForTimeout(500);
        // Force a reflow to ensure styles are applied
        await this.page.evaluate(() => {
            document.body.offsetHeight; // Force reflow
        });
        const isFirstRun = !existsSync(baselinePath);
        if (isFirstRun) {
            // First run: generate baseline
            await this.page.screenshot({
                path: baselinePath,
                fullPage,
                animations: 'disabled',
            });
            // Also save to current for consistency
            await this.page.screenshot({
                path: currentPath,
                fullPage,
                animations: 'disabled',
            });
            this.testInfo.attach(`${name}-baseline-created`, {
                path: baselinePath,
                contentType: 'image/png',
            });
            // eslint-disable-next-line no-console
            console.log(`✓ Baseline created: ${baselinePath}`);
            return;
        }
        // Subsequent runs: capture current screenshot
        await this.page.screenshot({
            path: currentPath,
            fullPage,
            animations: 'disabled',
        });
        // Compare images using pixelmatch (dynamic import for ES module)
        const pixelmatch = (await import('pixelmatch')).default;
        const baseline = PNG.sync.read(readFileSync(baselinePath));
        const current = PNG.sync.read(readFileSync(currentPath));
        // Normalize images to same dimensions for comparison
        const maxWidth = Math.max(baseline.width, current.width);
        const maxHeight = Math.max(baseline.height, current.height);
        let normalizedBaseline = baseline;
        let normalizedCurrent = current;
        // Pad images if dimensions don't match
        if (baseline.width !== maxWidth || baseline.height !== maxHeight) {
            normalizedBaseline = new PNG({ width: maxWidth, height: maxHeight });
            normalizedBaseline.data.fill(255); // White background
            PNG.bitblt(baseline, normalizedBaseline, 0, 0, baseline.width, baseline.height, 0, 0);
        }
        if (current.width !== maxWidth || current.height !== maxHeight) {
            normalizedCurrent = new PNG({ width: maxWidth, height: maxHeight });
            normalizedCurrent.data.fill(255); // White background
            PNG.bitblt(current, normalizedCurrent, 0, 0, current.width, current.height, 0, 0);
        }
        // Create diff image
        const diff = new PNG({ width: maxWidth, height: maxHeight });
        // Run pixel comparison
        const numDiffPixels = pixelmatch(normalizedBaseline.data, normalizedCurrent.data, diff.data, maxWidth, maxHeight, {
            threshold,
            diffColor: [255, 0, 0], // Red color for differences
            diffColorAlt: [255, 100, 100], // Lighter red for subtle differences
        });
        // Calculate difference percentage
        const totalPixels = maxWidth * maxHeight;
        const diffPercentage = (numDiffPixels / totalPixels) * 100;
        const dimensionMismatch = baseline.width !== current.width || baseline.height !== current.height;
        if (numDiffPixels > 0) {
            // Save diff image
            writeFileSync(diffPath, PNG.sync.write(diff));
            // Attach all three images to test report
            this.testInfo.attach(`${name}-baseline`, {
                path: baselinePath,
                contentType: 'image/png',
            });
            this.testInfo.attach(`${name}-current`, {
                path: currentPath,
                contentType: 'image/png',
            });
            this.testInfo.attach(`${name}-diff`, {
                path: diffPath,
                contentType: 'image/png',
            });
            // eslint-disable-next-line no-console
            console.log(`✗ Visual regression FAILED: ${name}`);
            // eslint-disable-next-line no-console
            console.log(`  Changed pixels: ${numDiffPixels.toLocaleString()} (${diffPercentage.toFixed(2)}%)`);
            if (dimensionMismatch) {
                // eslint-disable-next-line no-console
                console.log(`  Baseline: ${baseline.width}x${baseline.height}`);
                // eslint-disable-next-line no-console
                console.log(`  Current:  ${current.width}x${current.height}`);
            }
            // eslint-disable-next-line no-console
            console.log(`  Baseline: ${baselinePath}`);
            // eslint-disable-next-line no-console
            console.log(`  Current:  ${currentPath}`);
            // eslint-disable-next-line no-console
            console.log(`  Diff:     ${diffPath}`);
            throw new Error(`Visual regression test failed for "${name}"\n`
                + `  Changed pixels: ${numDiffPixels.toLocaleString()} (${diffPercentage.toFixed(2)}%)\n`
                + `${dimensionMismatch
                    ? `  Dimension mismatch: ${baseline.width}x${baseline.height} vs ${current.width}x${current.height}\n`
                    : ''}`
                + `  Check the diff image at: ${diffPath}`);
        }
        // eslint-disable-next-line no-console
        console.log(`✓ Visual regression passed: ${name} (0 pixels changed)`);
    }
    /**
     * Update the baseline with the current screenshot
     * Use this when visual changes are intentional
     */
    async updateBaseline(options) {
        const { name, mask = [], maskAreas = [], fullPage = true } = options;
        const baselinePath = join(this.baselineDir, `${name}.png`);
        await this.page.waitForLoadState('load');
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForLoadState('networkidle');
        await this.page.evaluate(() => Promise.all(Array.from(document.images)
            .filter(img => !img.complete)
            .map(img => new Promise(resolve => {
            const element = img;
            element.addEventListener('load', () => resolve(undefined));
            element.addEventListener('error', () => resolve(undefined));
        }))));
        await this.page.evaluate(() => document.fonts.ready);
        await this.page.waitForTimeout(2000);
        const maskSelectors = mask.join(', ');
        await this.page.addStyleTag({
            content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          animation-iteration-count: 1 !important;
          animation-play-state: paused !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
          transition-property: none !important;
          transform: none !important;
          caret-color: transparent !important;
        }
        ${maskSelectors ? `${maskSelectors} { opacity: 0 !important; pointer-events: none !important; visibility: hidden !important; }` : ''}
      `,
        });
        // Apply coordinate-based masks by creating pink overlays
        if (maskAreas.length > 0) {
            await this.page.evaluate((areas) => {
                areas.forEach((area, index) => {
                    const div = document.createElement('div');
                    div.id = `vr-mask-${index}`;
                    div.style.cssText = `
            position: fixed;
            left: ${area.x}px;
            top: ${area.y}px;
            width: ${area.width}px;
            height: ${area.height}px;
            background-color: #FF00FF;
            z-index: 999999;
            pointer-events: none;
          `;
                    document.body.appendChild(div);
                });
            }, maskAreas);
        }
        await this.page.waitForTimeout(500);
        await this.page.evaluate(() => {
            document.body.offsetHeight; // Force reflow
        });
        await this.page.screenshot({
            path: baselinePath,
            fullPage,
            animations: 'disabled',
        });
        // eslint-disable-next-line no-console
        console.log(`✓ Updated baseline: ${baselinePath}`);
    }
}
/**
 * Convenience function for quick visual regression checks
 */
export async function assertVisualRegression(page, testInfo, options) {
    const vr = new VisualRegression(page, testInfo);
    await vr.captureAndCompare(options);
}
//# sourceMappingURL=visual-regression-helpers.js.map