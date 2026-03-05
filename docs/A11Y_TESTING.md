# Accessibility Testing

This library uses [axe-core](https://github.com/dequelabs/axe-core) via [@axe-core/playwright](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright) to automatically detect accessibility violations in web pages.

## Installation

```bash
npm install openedx-e2e-tests
```

## Usage

### Writing Tests with A11y Checks

Import the `assertA11y` helper in your test files:

```typescript
import { test } from '@playwright/test';
import { assertA11y } from 'openedx-e2e-tests';

test('my test', async ({ page }, testInfo) => {
  await page.goto('/my-page');

  // Check accessibility (won't fail test)
  await assertA11y(page, { warnOnly: true, report: true }, testInfo);

  // Multiple checks in same test - use reportName
  await assertA11y(page, {
    warnOnly: true,
    report: true,
    reportName: 'login-page'
  }, testInfo);
});
```

### In This Repository (Examples)

If you're working with the example tests in this repository:

```typescript
import { assertA11y } from '../../src';
```

## Running Example Tests

All example tests in this repository can include accessibility checks. When a11y assertions are included, reports are automatically generated and saved to `artifacts/a11y-reports/`.

```bash
# Run all tests (including a11y checks if present)
npm test

# Run with browser UI visible to see violations in real-time
npm run test:headed

# View accessibility reports after running tests
npm run report:a11y
```

## Configuration Options

The `assertA11y` function accepts the following options:

- **`warnOnly: true`** - Log violations without failing test (recommended for initial implementation)
- **`report: true`** - Generate HTML report with screenshots showing violations
- **`reportName: 'name'`** - Distinguish multiple reports in same test (required when checking multiple pages/states)
- **`disabledRules: ['rule-id']`** - Disable specific axe rules (e.g., `['color-contrast']`)
- **`exclude: ['.selector']`** - Exclude specific elements from accessibility scan

## Viewing Reports

After running tests with a11y checks enabled:

```bash
# Open the accessibility reports index page
npm run report:a11y
```

This opens `artifacts/a11y-reports/index.html` which shows:
- All accessibility violations found
- Screenshots highlighting the problematic elements
- Detailed descriptions of each violation
- Remediation guidance

![Accessibility Report Overview](https://github.com/WGU-Open-edX/openedx-e2e-tests/raw/main/docs/assets/a11y-report-1.png)

![Accessibility Report Details](https://github.com/WGU-Open-edX/openedx-e2e-tests/raw/main/docs/assets/a11y-report-2.png)

## Report Location

Accessibility reports are saved to:
```
artifacts/a11y-reports/
├── index.html           # Main report index
└── [test-name]/         # Individual test reports
    ├── report.html
    └── screenshots/
```

## Cleaning Reports

```bash
# Remove all artifacts including a11y reports
npm run clean
```

## Best Practices

1. **Start with `warnOnly: true`** - Don't fail tests immediately; gather baseline data first
2. **Use `reportName`** - When checking multiple pages in one test, give each check a unique name
3. **Check key user flows** - Focus on critical paths (login, course enrollment, content viewing)
4. **Review reports regularly** - Check `npm run report:a11y` output to track violations
5. **Disable sparingly** - Only use `disabledRules` for false positives or known issues
6. **Exclude strategically** - Use `exclude` for third-party widgets you can't control

## Example: Multiple Checks in One Test

```typescript
test('course enrollment flow', async ({ page }, testInfo) => {
  // Check course catalog page
  await page.goto('/courses');
  await assertA11y(page, {
    warnOnly: true,
    report: true,
    reportName: 'course-catalog'
  }, testInfo);

  // Click into course detail
  await page.click('[data-testid="course-card"]');
  await assertA11y(page, {
    warnOnly: true,
    report: true,
    reportName: 'course-detail'
  }, testInfo);

  // Check enrollment confirmation
  await page.click('button:has-text("Enroll")');
  await assertA11y(page, {
    warnOnly: true,
    report: true,
    reportName: 'enrollment-confirmation'
  }, testInfo);
});
```

## Common Violations and Fixes

- **color-contrast** - Ensure text has sufficient contrast ratio (4.5:1 for normal text)
- **button-name** - All buttons must have accessible names
- **link-name** - All links must have accessible text
- **label** - Form inputs must have associated labels
- **image-alt** - Images must have alt text (or empty alt="" for decorative images)

For detailed remediation guidance, see the violation details in the HTML reports.
