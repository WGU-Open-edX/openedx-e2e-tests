"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisualRegression = void 0;
exports.assertVisualRegression = assertVisualRegression;
const fs_1 = require("fs");
const path_1 = require("path");
const pngjs_1 = require("pngjs");
/**
 * Visual regression helper that:
 * 1. Captures baseline screenshots on first run
 * 2. Compares against baseline on subsequent runs
 * 3. Generates diff images with red highlights for changed pixels
 * 4. Stores baselines in tests/__visual-baselines__/ (tracked in git)
 * 5. Stores current and diff images in artifacts/visual-regression/ (gitignored)
 */
class VisualRegression {
    constructor(page, testInfo) {
        this.page = page;
        this.testInfo = testInfo;
        const projectName = testInfo.project.name;
        const testName = testInfo.titlePath.join('-').replace(/[^a-z0-9-]/gi, '_');
        // Store baselines in version control
        this.baselineDir = (0, path_1.join)(process.cwd(), 'tests', '__visual-baselines__', projectName, testName);
        // Store current run and diffs in artifacts (gitignored)
        this.currentDir = (0, path_1.join)(process.cwd(), 'artifacts', 'visual-regression', projectName, testName, 'current');
        this.diffDir = (0, path_1.join)(process.cwd(), 'artifacts', 'visual-regression', projectName, testName, 'diff');
        this.ensureDirectories();
    }
    ensureDirectories() {
        [this.baselineDir, this.currentDir, this.diffDir].forEach((dir) => {
            if (!(0, fs_1.existsSync)(dir)) {
                (0, fs_1.mkdirSync)(dir, { recursive: true });
            }
        });
    }
    /**
     * Capture a screenshot and compare against baseline
     * On first run: creates baseline
     * On subsequent runs: compares and generates diff with red highlights
     */
    async captureAndCompare(options) {
        const { name, mask = [], fullPage = true, threshold = 0.1, } = options;
        const baselinePath = (0, path_1.join)(this.baselineDir, `${name}.png`);
        const currentPath = (0, path_1.join)(this.currentDir, `${name}.png`);
        const diffPath = (0, path_1.join)(this.diffDir, `${name}-diff.png`);
        // Build mask locators
        const maskLocators = mask.map((selector) => this.page.locator(selector));
        // Wait for page to be completely stable
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForLoadState('domcontentloaded');
        // Wait for any images to load
        await this.page.evaluate(() => {
            return Promise.all(Array.from(document.images)
                .filter((img) => !img.complete)
                .map((img) => new Promise((resolve) => {
                img.onload = img.onerror = resolve;
            })));
        });
        // Wait for fonts to load
        await this.page.evaluate(() => document.fonts.ready);
        // Let animations and transitions settle
        await this.page.waitForTimeout(1000);
        // Disable animations for consistent screenshots
        await this.page.addStyleTag({
            content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `,
        });
        // Small wait after disabling animations
        await this.page.waitForTimeout(100);
        const isFirstRun = !(0, fs_1.existsSync)(baselinePath);
        if (isFirstRun) {
            // First run: generate baseline
            await this.page.screenshot({
                path: baselinePath,
                fullPage,
                mask: maskLocators,
                animations: 'disabled',
            });
            // Also save to current for consistency
            await this.page.screenshot({
                path: currentPath,
                fullPage,
                mask: maskLocators,
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
            mask: maskLocators,
            animations: 'disabled',
        });
        // Compare images using pixelmatch (dynamic import for ES module)
        const pixelmatch = (await Promise.resolve().then(() => __importStar(require('pixelmatch')))).default;
        const baseline = pngjs_1.PNG.sync.read((0, fs_1.readFileSync)(baselinePath));
        const current = pngjs_1.PNG.sync.read((0, fs_1.readFileSync)(currentPath));
        // Ensure dimensions match
        if (baseline.width !== current.width || baseline.height !== current.height) {
            throw new Error(`Image dimensions don't match!\n` +
                `  Baseline: ${baseline.width}x${baseline.height}\n` +
                `  Current:  ${current.width}x${current.height}\n` +
                `  This usually means the viewport size changed or content height is different.`);
        }
        // Create diff image
        const { width, height } = baseline;
        const diff = new pngjs_1.PNG({ width, height });
        // Run pixel comparison
        const numDiffPixels = pixelmatch(baseline.data, current.data, diff.data, width, height, {
            threshold,
            diffColor: [255, 0, 0], // Red color for differences
            diffColorAlt: [255, 100, 100], // Lighter red for subtle differences
        });
        // Calculate difference percentage
        const totalPixels = width * height;
        const diffPercentage = (numDiffPixels / totalPixels) * 100;
        if (numDiffPixels > 0) {
            // Save diff image
            (0, fs_1.writeFileSync)(diffPath, pngjs_1.PNG.sync.write(diff));
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
            // eslint-disable-next-line no-console
            console.log(`  Baseline: ${baselinePath}`);
            // eslint-disable-next-line no-console
            console.log(`  Current:  ${currentPath}`);
            // eslint-disable-next-line no-console
            console.log(`  Diff:     ${diffPath}`);
            throw new Error(`Visual regression test failed for "${name}"\n` +
                `  Changed pixels: ${numDiffPixels.toLocaleString()} (${diffPercentage.toFixed(2)}%)\n` +
                `  Check the diff image at: ${diffPath}`);
        }
        // eslint-disable-next-line no-console
        console.log(`✓ Visual regression passed: ${name} (0 pixels changed)`);
    }
    /**
     * Update the baseline with the current screenshot
     * Use this when visual changes are intentional
     */
    async updateBaseline(options) {
        const { name, mask = [], fullPage = true } = options;
        const baselinePath = (0, path_1.join)(this.baselineDir, `${name}.png`);
        const maskLocators = mask.map((selector) => this.page.locator(selector));
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.evaluate(() => {
            return Promise.all(Array.from(document.images)
                .filter((img) => !img.complete)
                .map((img) => new Promise((resolve) => {
                img.onload = img.onerror = resolve;
            })));
        });
        await this.page.evaluate(() => document.fonts.ready);
        await this.page.waitForTimeout(1000);
        await this.page.addStyleTag({
            content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `,
        });
        await this.page.waitForTimeout(100);
        await this.page.screenshot({
            path: baselinePath,
            fullPage,
            mask: maskLocators,
            animations: 'disabled',
        });
        // eslint-disable-next-line no-console
        console.log(`✓ Updated baseline: ${baselinePath}`);
    }
}
exports.VisualRegression = VisualRegression;
/**
 * Convenience function for quick visual regression checks
 */
async function assertVisualRegression(page, testInfo, options) {
    const vr = new VisualRegression(page, testInfo);
    await vr.captureAndCompare(options);
}
//# sourceMappingURL=visual-regression-helpers.js.map