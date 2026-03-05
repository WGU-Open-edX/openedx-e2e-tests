import { Page, TestInfo } from '@playwright/test';
import {
  existsSync, mkdirSync, readFileSync, writeFileSync,
} from 'fs';
import { join } from 'path';
import { PNG } from 'pngjs';

export interface VisualRegressionOptions {
  /**
   * Name of the screenshot (e.g., 'login-page')
   * Will be saved as {name}.png
   */
  name: string;

  /**
   * Selectors to mask (hide dynamic content like timestamps)
   */
  mask?: string[];

  /**
   * Whether to capture full page or just viewport
   */
  fullPage?: boolean;

  /**
   * Threshold for pixel matching (0-1)
   * Default: 0.1 (10% brightness difference per pixel to be considered different)
   */
  threshold?: number;
}

/**
 * Visual regression helper that:
 * 1. Captures baseline screenshots on first run
 * 2. Compares against baseline on subsequent runs
 * 3. Generates diff images with red highlights for changed pixels
 * 4. Stores baselines in tests/__visual-baselines__/ (tracked in git)
 * 5. Stores current and diff images in artifacts/visual-regression/ (gitignored)
 */
export class VisualRegression {
  private baselineDir: string;

  private currentDir: string;

  private diffDir: string;

  constructor(
    private page: Page,
    private testInfo: TestInfo,
  ) {
    const projectName = testInfo.project.name;
    const testName = testInfo.titlePath.join('-').replace(/[^a-z0-9-]/gi, '_');

    // Store baselines in version control
    this.baselineDir = join(
      process.cwd(),
      'tests',
      '__visual-baselines__',
      projectName,
      testName,
    );

    // Store current run and diffs in artifacts (gitignored)
    this.currentDir = join(
      process.cwd(),
      'artifacts',
      'visual-regression',
      projectName,
      testName,
      'current',
    );

    this.diffDir = join(
      process.cwd(),
      'artifacts',
      'visual-regression',
      projectName,
      testName,
      'diff',
    );

    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    [this.baselineDir, this.currentDir, this.diffDir].forEach((dir) => {
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
  async captureAndCompare(options: VisualRegressionOptions): Promise<void> {
    const {
      name,
      mask = [],
      fullPage = true,
      threshold = 0.1,
    } = options;

    const baselinePath = join(this.baselineDir, `${name}.png`);
    const currentPath = join(this.currentDir, `${name}.png`);
    const diffPath = join(this.diffDir, `${name}-diff.png`);

    // Build mask locators
    const maskLocators = mask.map((selector) => this.page.locator(selector));

    // Wait for page to be completely stable
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForLoadState('domcontentloaded');

    // Wait for any images to load
    await this.page.evaluate(() => Promise.all(
      Array.from(document.images)
        .filter((img) => !img.complete)
        .map((img) => new Promise((resolve) => {
          img.onload = img.onerror = resolve;
        })),
    ));

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

    const isFirstRun = !existsSync(baselinePath);

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
    const pixelmatch = (await import('pixelmatch')).default;

    const baseline = PNG.sync.read(readFileSync(baselinePath));
    const current = PNG.sync.read(readFileSync(currentPath));

    // Ensure dimensions match
    if (baseline.width !== current.width || baseline.height !== current.height) {
      throw new Error(
        'Image dimensions don\'t match!\n'
        + `  Baseline: ${baseline.width}x${baseline.height}\n`
        + `  Current:  ${current.width}x${current.height}\n`
        + '  This usually means the viewport size changed or content height is different.',
      );
    }

    // Create diff image
    const { width, height } = baseline;
    const diff = new PNG({ width, height });

    // Run pixel comparison
    const numDiffPixels = pixelmatch(
      baseline.data,
      current.data,
      diff.data,
      width,
      height,
      {
        threshold,
        diffColor: [255, 0, 0], // Red color for differences
        diffColorAlt: [255, 100, 100], // Lighter red for subtle differences
      },
    );

    // Calculate difference percentage
    const totalPixels = width * height;
    const diffPercentage = (numDiffPixels / totalPixels) * 100;

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
      // eslint-disable-next-line no-console
      console.log(`  Baseline: ${baselinePath}`);
      // eslint-disable-next-line no-console
      console.log(`  Current:  ${currentPath}`);
      // eslint-disable-next-line no-console
      console.log(`  Diff:     ${diffPath}`);

      throw new Error(
        `Visual regression test failed for "${name}"\n`
        + `  Changed pixels: ${numDiffPixels.toLocaleString()} (${diffPercentage.toFixed(2)}%)\n`
        + `  Check the diff image at: ${diffPath}`,
      );
    }

    // eslint-disable-next-line no-console
    console.log(`✓ Visual regression passed: ${name} (0 pixels changed)`);
  }

  /**
   * Update the baseline with the current screenshot
   * Use this when visual changes are intentional
   */
  async updateBaseline(options: Omit<VisualRegressionOptions, 'threshold'>): Promise<void> {
    const { name, mask = [], fullPage = true } = options;

    const baselinePath = join(this.baselineDir, `${name}.png`);
    const maskLocators = mask.map((selector) => this.page.locator(selector));

    await this.page.waitForLoadState('networkidle');
    await this.page.waitForLoadState('domcontentloaded');

    await this.page.evaluate(() => Promise.all(
      Array.from(document.images)
        .filter((img) => !img.complete)
        .map((img) => new Promise((resolve) => {
          img.onload = img.onerror = resolve;
        })),
    ));

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

/**
 * Convenience function for quick visual regression checks
 */
export async function assertVisualRegression(
  page: Page,
  testInfo: TestInfo,
  options: VisualRegressionOptions,
): Promise<void> {
  const vr = new VisualRegression(page, testInfo);
  await vr.captureAndCompare(options);
}
