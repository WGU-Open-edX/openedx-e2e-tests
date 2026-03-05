import { Page } from '@playwright/test';
export interface HighlightStyle {
    /**
     * CSS class name for the highlight
     */
    className: string;
    /**
     * Highlight color (hex or rgba)
     */
    color: string;
    /**
     * Outline width in pixels
     * @default 3
     */
    outlineWidth?: number;
    /**
     * Outline offset in pixels
     * @default 2
     */
    outlineOffset?: number;
}
export interface ScreenshotOptions {
    /**
     * Padding around the element in pixels
     * @default 20
     */
    padding?: number;
    /**
     * Screenshot path
     */
    path: string;
    /**
     * Capture only the element with padding
     * @default false
     */
    elementOnly?: boolean;
}
/**
 * Adds highlight styles to the page
 */
export declare function addHighlightStyles(page: Page, style: HighlightStyle): Promise<void>;
/**
 * Highlights an element by adding a CSS class
 */
export declare function highlightElement(page: Page, selector: string, className: string): Promise<void>;
/**
 * Removes highlight from an element
 */
export declare function removeHighlight(page: Page, selector: string, className: string): Promise<void>;
/**
 * Captures a screenshot with optional element highlighting and clipping
 */
export declare function captureHighlightedScreenshot(page: Page, selector: string, options: ScreenshotOptions): Promise<void>;
/**
 * Highlights an element, captures a screenshot, and removes the highlight
 */
export declare function highlightAndScreenshot(page: Page, selector: string, highlightStyle: HighlightStyle, screenshotOptions: ScreenshotOptions, action?: () => Promise<void>): Promise<void>;
//# sourceMappingURL=element-highlighter.d.ts.map