# Open edX E2E Tests Library

[![npm version](https://badge.fury.io/js/openedx-e2e-tests.svg)](https://www.npmjs.com/package/openedx-e2e-tests)

A comprehensive Playwright testing library for Open edX with automated documentation generation, accessibility testing, and visual regression capabilities.

## Features

A comprehensive testing toolkit that goes beyond functional testing to help you create documentation, ensure accessibility compliance, and catch visual regressions before they reach production.

### Comprehensive Test Reports

Rich Playwright HTML reports with screenshots, traces, and detailed test results to help you debug failures quickly.

<p align="center">
  <img src="https://github.com/WGU-Open-edX/openedx-e2e-tests/raw/main/docs/assets/playwright-report.png" alt="Playwright Test Report" width="70%" />
</p>

### Accessibility Testing

Built-in accessibility checks using axe-core with detailed HTML reports. Catch WCAG violations early and get clear remediation guidance with visual highlighting of problematic elements.

[Accessibility Testing Documentation →](docs/A11Y_TESTING.md)

<p align="center">
  <img src="https://github.com/WGU-Open-edX/openedx-e2e-tests/raw/main/docs/assets/a11y-report-1.png" alt="Accessibility Report Overview" width="45%" />
  <img src="https://github.com/WGU-Open-edX/openedx-e2e-tests/raw/main/docs/assets/a11y-report-2.png" alt="Accessibility Report Details" width="45%" />
</p>

### Test Documentation Generation

Auto-generate professional user documentation with screenshots directly from your Playwright tests. Write your tests once and get beautiful markdown or reStructuredText documentation automatically.

[TestDoc Documentation →](docs/testdoc.md)

<p align="center">
  <img src="https://github.com/WGU-Open-edX/openedx-e2e-tests/raw/main/docs/assets/testdoc-markdown.png" alt="Markdown Output" width="30%" />
  <img src="https://github.com/WGU-Open-edX/openedx-e2e-tests/raw/main/docs/assets/testdoc-preview.png" alt="Preview" width="30%" />
  <img src="https://github.com/WGU-Open-edX/openedx-e2e-tests/raw/main/docs/assets/testdoc-rst.png" alt="reStructuredText Output" width="30%" />
</p>

### Visual Regression Testing

Pixel-perfect screenshot comparison with diff highlighting. Automatically detect visual changes between test runs and get clear visual diffs showing exactly what changed.

[Visual Regression Testing Documentation →](docs/VISUAL_REGRESSION.md)

<p align="center">
  <img src="https://github.com/WGU-Open-edX/openedx-e2e-tests/raw/main/docs/assets/visual-regression-1.png" alt="Visual Regression Baseline vs Current" width="30%" />
  <img src="https://github.com/WGU-Open-edX/openedx-e2e-tests/raw/main/docs/assets/visual-regression-2.png" alt="Visual Regression Diff" width="30%" />
  <img src="https://github.com/WGU-Open-edX/openedx-e2e-tests/raw/main/docs/assets/visual-regression-3.png" alt="Visual Regression Results" width="30%" />
</p>


## Installation

```bash
npm install openedx-e2e-tests
```

## Quick Start

```typescript
import { test } from '@playwright/test';
import { TestdocTest, assertA11y } from 'openedx-e2e-tests';

test('generate documentation', async ({ page }, testInfo) => {
  const testdoc = new TestdocTest(page, 'my-feature', {
    title: 'How to Use My Feature',
    overview: 'This guide shows you how to...'
  });

  await testdoc.initialize();
  await page.goto('https://example.com');

  // Auto-capture screenshots and build documentation
  await testdoc.step('Navigate to login', 'Click the login button');
  await testdoc.click('#login-btn', 'Click login button');
  await testdoc.fill('#username', 'user@example.com', 'Enter username');

  // Run accessibility checks with reporting
  await assertA11y(page, { report: true }, testInfo);

  // Generate markdown documentation
  await testdoc.generateMarkdown();
});
```

## API Reference

### TestdocTest

Generate user documentation from your tests with automatic screenshots.

```typescript
import { TestdocTest } from 'openedx-e2e-tests';

const testdoc = new TestdocTest(page, 'test-name', {
  title: 'Feature Title',
  overview: 'Feature description',
  prerequisites: ['Requirement 1', 'Requirement 2'],
  notes: ['Important note'],
  relatedTopics: [
    'Related Topic',
    { title: 'Link Title', url: 'https://example.com' }
  ]
});

await testdoc.initialize();

// Capture steps with screenshots
await testdoc.step('Step title', 'Optional description');

// Interactive actions with highlighting
await testdoc.click('#selector', 'Click button', 'Optional description');
await testdoc.fill('#input', 'value', 'Enter text', 'Optional description');

// Manual screenshots
await testdoc.screenshot('Screenshot title', 'Optional description', {
  elementOnly: '#specific-element',  // Screenshot only this element
  padding: 20
});

// Add notes to the last step
await testdoc.note('This is an important detail');

// Generate output
await testdoc.generateMarkdown();  // Outputs documentation.md
await testdoc.generateRST();       // Outputs documentation.rst
```

### Accessibility Testing

Run comprehensive accessibility checks with axe-core.

```typescript
import { assertA11y, checkA11y } from 'openedx-e2e-tests';

// Assert no violations (throws error if violations found)
await assertA11y(page, {
  report: true,                    // Generate HTML report
  reportDir: 'artifacts/a11y',     // Custom report directory
  reportName: 'homepage',          // Custom report name
  disabledRules: ['color-contrast'], // Skip specific rules
  enabledRules: ['button-name'],   // Only run specific rules
  exclude: ['.third-party-widget'], // Exclude elements
  warnOnly: false                  // true = log warnings instead of throwing
}, testInfo);

// Or just check without throwing
const results = await checkA11y(page, {
  disabledRules: ['color-contrast']
});

if (results.violations.length > 0) {
  console.log('Found violations:', results.violations);
}
```

### Visual Regression Testing

Pixel-perfect screenshot comparison with automatic baseline management.

```typescript
import { VisualRegression, assertVisualRegression } from 'openedx-e2e-tests';

// Using the class
const vr = new VisualRegression(page, testInfo);

await vr.captureAndCompare({
  name: 'homepage',
  fullPage: true,
  mask: ['.dynamic-timestamp', '.ads'],  // Mask dynamic content
  threshold: 0.1                         // 10% difference tolerance
});

// Update baseline when changes are intentional
await vr.updateBaseline({
  name: 'homepage',
  fullPage: true
});

// Or use the convenience function
await assertVisualRegression(page, testInfo, {
  name: 'login-page',
  fullPage: true
});
```

### Utilities

```typescript
import {
  formatDate,
  shiftDate,
  highlightElement,
  addHighlightStyles,
  highlightAndScreenshot
} from 'openedx-e2e-tests';

// Date utilities
const formatted = formatDate(new Date());        // "03/03/2026"
const tomorrow = shiftDate(new Date(), 1);       // Tomorrow's date
const lastWeek = shiftDate(new Date(), -7);      // 7 days ago

// Element highlighting
await addHighlightStyles(page, {
  className: 'my-highlight',
  color: '#ff0000',
  outlineWidth: 3,
  outlineOffset: 2
});

await highlightElement(page, '#button', 'my-highlight');

// Highlight and screenshot in one step
await highlightAndScreenshot(
  page,
  '#element-to-highlight',
  { className: 'highlight', color: '#ff6b35' },
  { path: 'screenshot.png', padding: 20, elementOnly: true }
);
```

### Markdown Test Parser

Run tests written in markdown files.

```typescript
import { MarkdownTestParser } from 'openedx-e2e-tests';

const parser = new MarkdownTestParser('path/to/test.md');
const codeBlocks = await parser.parseMarkdown();

// Execute code blocks...
const results = ['Result 1', 'Result 2'];

const finalMarkdown = await parser.createFinalMarkdown(results);
```

## CLI Tool

Run markdown-driven tests directly from the command line:

```bash
# Run a single markdown test file
npx run-markdown-test tests/my-test.md

# Run with options
npx run-markdown-test tests/my-test.md --headed --project=firefox

# Run all markdown files in a directory
npx run-markdown-test tests/testdoc/ --headed

# Available options:
#   --headed              Run tests in headed mode (visible browser)
#   --project=<name>      Run on specific browser (chromium, firefox, webkit)
```

## TypeScript Types

All exports include full TypeScript definitions:

```typescript
import type {
  // TestdocTest types
  StepConfig,
  ScreenshotConfig,
  HighlightOptions,
  ClickConfig,
  FillConfig,
  RelatedTopic,
  TestdocOptions,
  Step,

  // Accessibility types
  A11yCheckOptions,

  // Visual regression types
  VisualRegressionOptions,

  // Element highlighter types
  HighlightStyle,
  ScreenshotOptions,

  // Parser types
  CodeBlock,
  ParsedStep
} from 'openedx-e2e-tests';
```

## Documentation

For detailed guides and examples:

- [Accessibility Testing Guide](docs/A11Y_TESTING.md)
- [Test Documentation Guide](docs/TESTDOC.md)
- [Visual Regression Guide](docs/VISUAL_REGRESSION.md)

---

## Running Example Tests

This repository includes example tests for Open edX. To run them:

### Prerequisites

- Tutor-based Open edX installation running locally
- Open edX instance accessible at `http://apps.local.openedx.io:1996`

### Setup

1. **Clone and install:**
   ```bash
   git clone <repo-url>
   cd openedx-e2e-tests
   npm install
   npm run install:browsers
   ```

2. **Setup test data:**
   ```bash
   npm run setup
   ```

   This creates:
   - Test user: `testuser` / `password123` (`test@example.com`)
   - Admin user: `adminuser` / `admin123` (`admin@example.com`)
   - Demo course and test course

3. **Run tests:**
   ```bash
   npm test                    # Run all tests
   npm run test:headed         # With visible browser
   npm run test:ui             # Interactive UI mode
   npm run test:debug          # With debugger
   ```

### Example Test Structure

```bash
tests/
├── auth/                          # Authentication examples
│   └── login.spec.ts
├── courses/                       # Course management examples
│   ├── create-course.spec.ts
│   ├── import-course.spec.ts
│   └── export-course.spec.ts
├── testdoc/                       # Documentation generation examples
│   └── login-walkthrough.spec.ts
└── common/
    └── page-objects.ts            # Page object models
```

### Running Specific Example Tests

```bash
# Run single test file
npx playwright test tests/auth/login.spec.ts

# Run by test name
npx playwright test -g "user can login"

# Run directory
npx playwright test tests/auth/

# Specific browser
npx playwright test --project=firefox
```

### View Reports

```bash
npm run report              # View Playwright HTML report
npm run report:a11y         # View accessibility reports
npm run clean               # Clean all artifacts
```

![Playwright Test Report](https://github.com/WGU-Open-edX/openedx-e2e-tests/raw/main/docs/assets/playwright-report.png)

## Contributing

### Building the Library

```bash
npm install
npm run build              # Compiles to dist/
```

### Project Structure

```
openedx-e2e-tests/
├── src/                   # Library source code (published)
│   ├── index.ts           # Main exports
│   ├── testdoc.ts
│   ├── a11y-helpers.ts
│   ├── visual-regression-helpers.ts
│   ├── element-highlighter.ts
│   ├── markdown-test-parser.ts
│   ├── dates.ts
│   └── types/
├── bin/                   # CLI tool (published)
│   └── run-markdown-test.ts
├── dist/                  # Compiled output (published)
│   ├── src/
│   └── bin/
├── tests/                 # Example tests (not published)
│   ├── auth/
│   ├── courses/
│   └── testdoc/
├── docs/                  # Documentation
└── artifacts/             # Generated test artifacts (gitignored)
    ├── testdoc-output/
    ├── a11y-reports/
    └── visual-regression/
```

## License

MIT