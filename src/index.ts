// Main exports
export { TestdocTest } from './testdoc';
export { MarkdownTestParser } from './markdown-test-parser';

// A11y helpers
export {
  checkA11y,
  assertA11y,
  type A11yCheckOptions,
} from './a11y-helpers';

// Visual regression helpers
export {
  VisualRegression,
  assertVisualRegression,
  type VisualRegressionOptions,
} from './visual-regression-helpers';

// Element highlighter utilities
export {
  addHighlightStyles,
  highlightElement,
  removeHighlight,
  captureHighlightedScreenshot,
  highlightAndScreenshot,
  type HighlightStyle,
  type ScreenshotOptions,
} from './element-highlighter';

// Date utilities
export {
  formatDate,
  shiftDate,
} from './dates';

// Type exports
export type {
  StepConfig,
  ScreenshotConfig,
  HighlightOptions,
  ClickConfig,
  FillConfig,
  RelatedTopic,
  TestdocOptions,
  Step,
} from './types/testdoc.types';

export type {
  CodeBlock,
  ParsedStep,
} from './types/markdown-test-parser.types';
