import { Page, TestInfo } from '@playwright/test';
export interface MaskRegion {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface VisualRegressionOptions {
    /**
     * Name of the screenshot (e.g., 'login-page')
     * Will be saved as {name}.png
     */
    name: string;
    /**
     * Selectors to hide (hide dynamic content like timestamps)
     */
    hide?: string[];
    /**
     * Regions to mask during comparison (excludes from pixel diff)
     * Can be CSS selectors (will auto-detect bounding boxes) or coordinate objects
     */
    mask?: (string | MaskRegion)[];
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
export declare class VisualRegression {
    private page;
    private testInfo;
    private baselineDir;
    private currentDir;
    private diffDir;
    constructor(page: Page, testInfo: TestInfo);
    private ensureDirectories;
    /**
     * Convert mask selectors to coordinate regions
     */
    private getMaskRegions;
    /**
     * Apply mask to PNG image by setting masked regions to a solid gray color
     */
    private applyMaskToPNG;
    /**
     * Apply hide to PNG image by setting hidden regions to white
     * (for variable-width elements like timestamps)
     */
    private applyHideToPNG;
    /**
     * Capture a screenshot and compare against baseline
     * On first run: creates baseline
     * On subsequent runs: compares and generates diff with red highlights
     */
    captureAndCompare(options: VisualRegressionOptions): Promise<void>;
    /**
     * Update the baseline with the current screenshot
     * Use this when visual changes are intentional
     */
    updateBaseline(options: Omit<VisualRegressionOptions, 'threshold'>): Promise<void>;
}
/**
 * Convenience function for quick visual regression checks
 */
export declare function assertVisualRegression(page: Page, testInfo: TestInfo, options: VisualRegressionOptions): Promise<void>;
