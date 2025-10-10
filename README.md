# Open edX E2E Tests

End-to-end tests for Open edX microservices and MFEs using Playwright.

## Prerequisites

- Tutor-based Open edX installation running locally
- Open edX instance accessible at `http://apps.local.openedx.io:1996`

## Setup

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npm run install:browsers
```

3. **Setup test data** (Required before first test run):
```bash
npm run setup
```

This will create:
- Test user: `testuser` / `password123` (`test@example.com`)
- Admin user: `adminuser` / `admin123` (`admin@example.com`)
- Demo course and additional test course

4. Optional - Set custom environment variables:
```bash
export BASE_URL=http://apps.local.openedx.io:1996  # Default in config
```

## Running Tests

### Basic Test Commands

```bash
# Run all tests (headless)
npm test

# Run tests with browser UI visible
npm run test:headed

# Run tests with Playwright UI mode (interactive)
npm run test:ui

# Debug tests with Playwright Inspector
npm run test:debug

# Setup test data and run all tests
npm run test:full

# Clean artifacts and run tests
npm run test:clean

# Record video of test execution
npm run test:record
```

### Running Specific Tests

```bash
# Run a single test file
npx playwright test tests/auth/login.spec.ts

# Run a specific test by name
npx playwright test -g "user can login"

# Run tests in a directory
npx playwright test tests/auth/

# Run on specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
```

## Viewing Reports

```bash
# View Playwright test report
npm run report

# View accessibility reports
npm run report:a11y

# Clean all artifacts (reports, videos, screenshots)
npm run clean
```

## Accessibility Testing

Tests automatically generate accessibility reports using axe-core. Reports are saved to `artifacts/a11y-reports/`.

**Adding a11y checks to tests:**

```typescript
import { assertA11y } from '../common/a11y-helpers';

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

**Options:**
- `warnOnly: true` - Log violations without failing test
- `report: true` - Generate HTML report with screenshots
- `reportName: 'name'` - Distinguish multiple reports in same test
- `disabledRules: ['rule-id']` - Disable specific rules
- `exclude: ['.selector']` - Exclude elements from scan

## Auto-Documentation

Generate documentation from test execution with screenshots:

```bash
# Run autodoc tests
npm run autodoc

# Convert autodoc to markdown
npm run autodoc:markdown
```

Documentation is saved to `artifacts/autodoc-output/`.

## Project Structure

```bash
openedx-e2e-tests/
├── tests/
│   ├── auth/                 # Authentication tests
│   ├── autodoc/              # Auto-documentation tests
│   ├── common/
│   │   ├── page-objects.ts   # Page object models
│   │   └── a11y-helpers.ts   # Accessibility testing utilities
│   ├── example.spec.ts
│   └── debug.spec.ts
├── utils/
│   └── autodoc.ts            # Auto-documentation framework
├── scripts/
│   └── setup-test-data.sh    # Test data setup script
├── artifacts/                # Generated artifacts (gitignored)
│   ├── test-results/         # Test execution artifacts
│   ├── playwright-report/    # HTML test reports
│   ├── a11y-reports/         # Accessibility reports
│   └── autodoc-output/       # Auto-generated documentation
├── playwright.config.ts      # Playwright configuration
└── package.json
```

## Configuration

The tests are configured to run against multiple browsers and devices. Update `playwright.config.ts` to modify:

- Base URL (default: `http://apps.local.openedx.io:1996`)
- Browser configurations (chromium, firefox, webkit, mobile)
- Test timeouts
- Retry logic
- Output directories

## Test Credentials

After running `npm run setup`, use these credentials in your tests:

**Regular User:**
- Username: `testuser`
- Email: `test@example.com`
- Password: `password123`

**Admin User:**
- Username: `adminuser`
- Email: `admin@example.com`
- Password: `admin123`

## Available Test Courses

- Demo Course: `course-v1:edX+DemoX+Demo_Course`
- Test Course: `course-v1:TestOrg+TestCourse+2023`

## Troubleshooting

- Ensure your Open edX instance is running: `tutor local status`
- If tests fail, check if test data exists: `npm run setup`
- Check network connectivity to `http://apps.local.openedx.io:1996`