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
export async function addHighlightStyles(
  page: Page,
  style: HighlightStyle,
): Promise<void> {
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
export async function highlightElement(
  page: Page,
  selector: string,
  className: string,
): Promise<void> {
  await page.locator(selector).evaluate((el: Element, cls: string) => {
    el.classList.add(cls);
  }, className);
}

/**
 * Removes highlight from an element
 */
export async function removeHighlight(
  page: Page,
  selector: string,
  className: string,
): Promise<void> {
  await page.locator(selector).evaluate((el: Element, cls: string) => {
    el.classList.remove(cls);
  }, className);
}

/**
 * Captures a screenshot with optional element highlighting and clipping
 */
export async function captureHighlightedScreenshot(
  page: Page,
  selector: string,
  options: ScreenshotOptions,
): Promise<void> {
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
            width: Math.min(
              viewport.width - Math.max(0, elementBox.x - padding),
              elementBox.width + 2 * padding,
            ),
            height: Math.min(
              viewport.height - Math.max(0, elementBox.y - padding),
              elementBox.height + 2 * padding,
            ),
          },
        });
      }
    } else {
      await locator.screenshot({ path: options.path, scale: 'css' });
    }
  } else {
    await page.screenshot({ path: options.path, fullPage: true, scale: 'css' });
  }
}

/**
 * Highlights an element, captures a screenshot, and removes the highlight
 */
export async function highlightAndScreenshot(
  page: Page,
  selector: string,
  highlightStyle: HighlightStyle,
  screenshotOptions: ScreenshotOptions,
  action?: () => Promise<void>,
): Promise<void> {
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
