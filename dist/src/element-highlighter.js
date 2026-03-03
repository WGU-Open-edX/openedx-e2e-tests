"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addHighlightStyles = addHighlightStyles;
exports.highlightElement = highlightElement;
exports.removeHighlight = removeHighlight;
exports.captureHighlightedScreenshot = captureHighlightedScreenshot;
exports.highlightAndScreenshot = highlightAndScreenshot;
/**
 * Adds highlight styles to the page
 */
async function addHighlightStyles(page, style) {
    const outlineWidth = style.outlineWidth ?? 3;
    const outlineOffset = style.outlineOffset ?? 2;
    await page.addStyleTag({
        content: `
      .${style.className} {
        outline: ${outlineWidth}px solid ${style.color} !important;
        outline-offset: ${outlineOffset}px !important;
        box-shadow: 0 0 10px ${style.color}80 !important;
      }
    `,
    });
}
/**
 * Highlights an element by adding a CSS class
 */
async function highlightElement(page, selector, className) {
    await page.locator(selector).evaluate((el, cls) => {
        el.classList.add(cls);
    }, className);
}
/**
 * Removes highlight from an element
 */
async function removeHighlight(page, selector, className) {
    await page.locator(selector).evaluate((el, cls) => {
        el.classList.remove(cls);
    }, className);
}
/**
 * Captures a screenshot with optional element highlighting and clipping
 */
async function captureHighlightedScreenshot(page, selector, options) {
    const padding = options.padding ?? 20;
    const locator = page.locator(selector);
    if (options.elementOnly) {
        const elementBox = await locator.boundingBox();
        if (elementBox) {
            const viewport = page.viewportSize();
            if (viewport) {
                await page.screenshot({
                    path: options.path,
                    scale: 'css',
                    clip: {
                        x: Math.max(0, elementBox.x - padding),
                        y: Math.max(0, elementBox.y - padding),
                        width: Math.min(viewport.width - Math.max(0, elementBox.x - padding), elementBox.width + 2 * padding),
                        height: Math.min(viewport.height - Math.max(0, elementBox.y - padding), elementBox.height + 2 * padding),
                    },
                });
            }
        }
        else {
            await locator.screenshot({ path: options.path, scale: 'css' });
        }
    }
    else {
        await page.screenshot({ path: options.path, fullPage: true, scale: 'css' });
    }
}
/**
 * Highlights an element, captures a screenshot, and removes the highlight
 */
async function highlightAndScreenshot(page, selector, highlightStyle, screenshotOptions, action) {
    // Add styles if not already added
    await addHighlightStyles(page, highlightStyle);
    // Highlight the element
    await highlightElement(page, selector, highlightStyle.className);
    // Wait for highlight to render
    await page.waitForTimeout(500);
    // Take screenshot
    await captureHighlightedScreenshot(page, selector, screenshotOptions);
    // Remove highlight
    await removeHighlight(page, selector, highlightStyle.className);
    // Execute optional action after screenshot
    if (action) {
        await action();
    }
}
//# sourceMappingURL=element-highlighter.js.map