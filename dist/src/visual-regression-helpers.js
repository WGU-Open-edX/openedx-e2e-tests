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
     * Convert mask selectors to coordinate regions
     */
    async getMaskRegions(mask) {
        const regions = [];
        // eslint-disable-next-line no-restricted-syntax
        for (const item of mask) {
            if (typeof item === 'string') {
                // It's a selector, get all matching elements' bounding boxes
                // eslint-disable-next-line no-await-in-loop
                const elements = await this.page.locator(item).all();
                // eslint-disable-next-line no-restricted-syntax
                for (const element of elements) {
                    // eslint-disable-next-line no-await-in-loop
                    const box = await element.boundingBox();
                    if (box) {
                        regions.push({
                            x: Math.round(box.x),
                            y: Math.round(box.y),
                            width: Math.round(box.width),
                            height: Math.round(box.height),
                        });
                    }
                }
            }
            else {
                // It's already a coordinate object
                regions.push(item);
            }
        }
        return regions;
    }
    /**
     * Apply mask to PNG image by setting masked regions to a solid gray color
     */
    applyMaskToPNG(png, regions) {
        const { data, width } = png;
        for (const region of regions) {
            const { x, y, width: regionWidth, height, } = region;
            // Ensure coordinates are within bounds
            const startX = Math.max(0, x);
            const startY = Math.max(0, y);
            const endX = Math.min(png.width, x + regionWidth);
            const endY = Math.min(png.height, y + height);
            // Fill the region with gray (RGB: 128, 128, 128, fully opaque)
            for (let py = startY; py < endY; py++) {
                for (let px = startX; px < endX; px++) {
                    // eslint-disable-next-line no-bitwise
                    const idx = (width * py + px) << 2;
                    data[idx] = 128; // R
                    data[idx + 1] = 128; // G
                    data[idx + 2] = 128; // B
                    data[idx + 3] = 255; // A
                }
            }
        }
    }
    /**
     * Apply hide to PNG image by setting hidden regions to white
     * (for variable-width elements like timestamps)
     */
    applyHideToPNG(png, regions) {
        const { data, width } = png;
        for (const region of regions) {
            const { x, y, width: regionWidth, height, } = region;
            // Ensure coordinates are within bounds
            const startX = Math.max(0, x);
            const startY = Math.max(0, y);
            const endX = Math.min(png.width, x + regionWidth);
            const endY = Math.min(png.height, y + height);
            // Fill the region with white (RGB: 255, 255, 255, fully opaque)
            for (let py = startY; py < endY; py++) {
                for (let px = startX; px < endX; px++) {
                    // eslint-disable-next-line no-bitwise
                    const idx = (width * py + px) << 2;
                    data[idx] = 255; // R
                    data[idx + 1] = 255; // G
                    data[idx + 2] = 255; // B
                    data[idx + 3] = 255; // A
                }
            }
        }
    }
    /**
     * Capture a screenshot and compare against baseline
     * On first run: creates baseline
     * On subsequent runs: compares and generates diff with red highlights
     */
    async captureAndCompare(options) {
        const { name, hide = [], mask = [], fullPage = true, threshold = 0.1, } = options;
        const baselinePath = join(this.baselineDir, `${name}.png`);
        const currentPath = join(this.currentDir, `${name}.png`);
        const diffPath = join(this.diffDir, `${name}-diff.png`);
        // Wait for page to be completely stable
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForLoadState('domcontentloaded');
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
        // Let animations and transitions settle
        await this.page.waitForTimeout(1000);
        // Build hide selector string for CSS
        const hideSelector = hide.join(', ');
        // Disable animations and apply opacity-based hiding
        await this.page.addStyleTag({
            content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
        ${hideSelector ? `${hideSelector} { opacity: 0 !important; }` : ''}
      `,
        });
        // Small wait after disabling animations
        await this.page.waitForTimeout(100);
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
        // Apply mask regions if provided (gray fill for areas to completely ignore)
        if (mask.length > 0) {
            const maskRegions = await this.getMaskRegions(mask);
            this.applyMaskToPNG(normalizedBaseline, maskRegions);
            this.applyMaskToPNG(normalizedCurrent, maskRegions);
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
        const { name, hide = [], mask = [], fullPage = true, } = options;
        const baselinePath = join(this.baselineDir, `${name}.png`);
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.evaluate(() => Promise.all(Array.from(document.images)
            .filter(img => !img.complete)
            .map(img => new Promise(resolve => {
            const element = img;
            element.addEventListener('load', () => resolve(undefined));
            element.addEventListener('error', () => resolve(undefined));
        }))));
        await this.page.evaluate(() => document.fonts.ready);
        await this.page.waitForTimeout(1000);
        const hideSelector = hide.join(', ');
        await this.page.addStyleTag({
            content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
        ${hideSelector ? `${hideSelector} { opacity: 0 !important; }` : ''}
      `,
        });
        await this.page.waitForTimeout(100);
        const tempPath = `${baselinePath}.tmp`;
        await this.page.screenshot({
            path: tempPath,
            fullPage,
            animations: 'disabled',
        });
        // Apply mask if provided
        if (mask.length > 0) {
            const png = PNG.sync.read(readFileSync(tempPath));
            const maskRegions = await this.getMaskRegions(mask);
            this.applyMaskToPNG(png, maskRegions);
            writeFileSync(baselinePath, PNG.sync.write(png));
            // Clean up temp file
            const { unlinkSync } = await import('fs');
            unlinkSync(tempPath);
        }
        else {
            // No mask, just rename the temp file
            const { renameSync } = await import('fs');
            renameSync(tempPath, baselinePath);
        }
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
