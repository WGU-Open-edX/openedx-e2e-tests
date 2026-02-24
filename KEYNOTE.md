# One Codebase, Many Outputs: E2E Testing as a Platform in Open edX

## Talk Overview

This talk explores how end-to-end testing with Playwright can serve as more than just a quality gate. By treating your test suite as a platform, you can generate documentation, accessibility reports, visual regression baselines with pixel-level diff highlighting, and actionable stories — all from the same codebase. We'll walk through a live example on the Open edX account settings page, demonstrate a custom autodoc tool built on top of Playwright, introduce a markdown-driven authoring workflow that lets engineers write documentation first and embed executable test code inline, show how pixel-by-pixel visual regression testing catches UI breakages that functional tests miss, discuss strategies for stable, repeatable tests that belong in your deployment pipeline, and look at how AI tooling like Claude Code can complete a test written in any authoring mode — filling in documentation, accessibility checks, visual regression baselines, and Testdoc annotations from the codebase context.

---

## Opening: Why E2E Tests Matter

E2E tests validate what actually matters — the user's experience. Unit tests confirm your functions work. Integration tests confirm your services talk to each other. But only E2E tests answer the question: *can a learner actually log in, see their courses, and complete an assignment?*

In a platform like Open edX — where micro-frontends, backend APIs, authentication layers, and LMS configuration all intersect — E2E tests are the only reliable way to catch the kinds of breakages that slip through lower-level testing. A renamed API field, a misconfigured feature flag, a CSS change that hides a button — these are invisible to unit tests and devastating to users.

The argument against E2E testing has always been cost: they're slow, they're flaky, they're hard to maintain. This talk is about making that investment pay off multiple times over.

---

## The Core Idea: Short Shelf-Life Code, Long Shelf-Life Problems

Frontend code has a short shelf life. Components get refactored. Design systems evolve. Frameworks get replaced. The instructor dashboard you shipped six months ago may already look different from the screenshots in your documentation.

But the *need* for accurate documentation, accessibility compliance, and visual consistency doesn't expire. These are long shelf-life problems attached to short shelf-life code.

Keeping documentation and screenshots up to date is one of the most manual, tedious, and frequently neglected tasks in any project. People write docs at launch and never touch them again. Screenshots go stale within a single release cycle. Accessibility audits happen quarterly if you're lucky.

The insight is this: the parts of Open edX that are worth documenting are almost always the parts worth writing E2E tests for. The user-facing workflows — enrollment, grading, course navigation, the learner dashboard — these need both test coverage *and* documentation. So why maintain two separate efforts?

By running documentation generation, accessibility audits, and visual regression checks *during* E2E tests, you collapse three maintenance burdens into one. Write the test once. Get coverage, docs, and compliance as outputs. When the UI changes, the test breaks, you fix it, and the docs and screenshots update automatically.

One codebase. Multiple uses.

---

## Demo Setup: The Project

Before we write any tests, let's look at what we're working with. This is a real project — not a contrived example. It runs against a Tutor-based Open edX installation at `http://apps.local.openedx.io:1996`.

```
openedx-e2e-tests/
├── tests/
│   ├── auth/                 # Authentication tests
│   ├── testdoc/              # Markdown-driven test docs
│   ├── common/
│   │   ├── page-objects.ts   # Page object models
│   │   └── a11y-helpers.ts   # Accessibility testing utilities
│   ├── example.spec.ts
│   └── debug.spec.ts
├── utils/
│   └── testdoc.ts            # Test documentation framework
├── scripts/
│   └── setup-test-data.sh    # Test data setup script
├── artifacts/                # Generated artifacts (gitignored)
│   ├── test-results/         # Test execution artifacts
│   ├── playwright-report/    # HTML test reports
│   ├── a11y-reports/         # Accessibility reports
│   └── testdoc-output/       # Auto-generated documentation
├── playwright.config.ts
└── package.json
```

A few things to notice about this structure. The `tests/` directory is organized by feature area — `auth/`, `testdoc/`, and a `common/` folder for shared utilities like page objects and the accessibility helpers. The `utils/` directory holds Testdoc itself. And the `artifacts/` directory is where *everything* lands — test results, Playwright reports, accessibility reports, and the auto-generated documentation. All gitignored, all regenerated on every run.

Getting up and running is four commands:

```bash
npm install
npm run install:browsers
npm run setup              # creates test users, courses, enrollments
npm test                   # runs all tests headless
```

The `npm run setup` step runs `scripts/setup-test-data.sh`, which shells into the running Tutor LMS container and creates deterministic test users via Django's ORM: a regular user (`testuser` / `password123`) and an admin user (`adminuser` / `admin123`). Courses rely on the existing demo course (`tutor dev do importdemocourse`) or manual import. This is the foundation everything else builds on, and we'll come back to why idempotency and honest gaps in automation matter when we talk about test stability.

For the live demo, we'll use Playwright's UI mode, which gives us an interactive runner with time-travel debugging:

```bash
npm run test:ui
```

And when we want to see specific outputs:

```bash
npm run report              # Playwright HTML test report
npm run report:a11y         # Accessibility violation dashboard
npm run testdoc             # Run testdoc tests
npm run testdoc:markdown    # Generate markdown documentation
```

---

## Demo: Writing an E2E Test on the Learner Dashboard

Let's start with a standard Playwright test against the Open edX learner dashboard. Nothing fancy — just verifying that a learner can log in, see their enrolled courses, and interact with the dashboard.

```typescript
// tests/auth/login.spec.ts
import { test, expect } from '@playwright/test';

test('Learner dashboard displays enrolled courses', async ({ page }) => {
  await page.goto('/dashboard');

  // Verify redirect to login
  await expect(page).toHaveURL(/\/login/);

  // Authenticate with our setup-script credentials
  await page.fill('input[name="emailOrUsername"]', 'testuser');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[name="sign-in"]');

  // Verify dashboard loaded
  await expect(page).toHaveURL(/\/dashboard/);

  // Verify enrolled courses are visible
  const courseCards = page.locator('.course-card');
  await expect(courseCards).toHaveCountGreaterThan(0);
});
```

This is a perfectly good test. It validates the critical path. But it's doing the minimum. Let's make it work harder.

---

## Introducing Testdoc: Autodoc from E2E Tests

Testdoc is a utility class that wraps Playwright's page object and augments every interaction with documentation artifacts. When you call `testdoc.step()`, it takes a screenshot. When you call `testdoc.click()`, it highlights the element, screenshots it, then performs the click. When you call `testdoc.fill()`, same thing — highlight, screenshot, act.

At the end of the test, `generateMarkdown()` or `generateRST()` assembles everything into a structured document with numbered steps, annotated screenshots, prerequisites, and related topics.

Here's what the same learner dashboard test looks like with Testdoc:

```typescript
// tests/testdoc/learner-dashboard.spec.ts
import { test } from '@playwright/test';
import { TestdocTest } from '../../utils/testdoc';

test('Learner Dashboard Walkthrough', async ({ page }) => {
  const doc = new TestdocTest(page, 'learner-dashboard', {
    title: 'Navigating the Learner Dashboard',
    overview: 'This guide walks through the learner dashboard in Open edX, '
            + 'covering login, course listing, and basic navigation.',
    prerequisites: [
      'An active learner account on the platform',
      'At least one course enrollment',
    ],
    relatedTopics: [
      { title: 'Open edX Learner Guide', url: 'https://docs.openedx.org' },
    ],
  });

  await doc.initialize();

  await doc.step('Navigate to the Dashboard', 'Open the learner dashboard URL.', async () => {
    await page.goto('/dashboard');
  });

  await doc.fill('input[name="emailOrUsername"]', 'testuser', 'Enter Username',
    'Enter your registered username in the login form.');

  await doc.fill('input[name="password"]', 'password123', 'Enter Password',
    'Enter your account password.');

  await doc.click('button[name="sign-in"]', 'Submit Login',
    'Click the sign-in button to authenticate.');

  await doc.screenshot('Dashboard Loaded',
    'After logging in, the learner dashboard displays all enrolled courses.');

  await doc.note('The dashboard may take a moment to load if you have many enrollments.');

  await doc.click('.course-card:first-child a', 'Select a Course',
    'Click on any course card to navigate to the course outline.');

  // Output lands in artifacts/testdoc-output/learner-dashboard/
  await doc.generateMarkdown();
  await doc.generateRST();
});
```

Same test coverage. Same assertions you'd add on top. But now when this test runs, it produces a complete walkthrough document with annotated screenshots — ready to ship to your docs site.

---

## Building Your Tools: The Philosophy

There's a broader principle at work here. Playwright is a browser automation framework, but it's also a *platform*. It gives you programmatic control over a real browser. What you do with that control is up to you.

Testdoc is a thin layer on top of Playwright. It doesn't replace any Playwright functionality. It *augments* it. The `click()` method still clicks. The `fill()` method still fills. We just intercept those moments to capture artifacts.

This is the mindset: **don't just use your tools — build on top of them.**

### The Element Highlighter: A Concrete Example

One of the building blocks inside Testdoc is the element highlighter. It's a small module, but it illustrates the philosophy perfectly. The problem: when you take a screenshot for documentation, the reader needs to know *where to look*. A full-page screenshot of a login form doesn't tell you which field is being discussed. A highlighted element does.

The solution is a set of composable functions that inject CSS highlights into the live page and capture a screenshot:

```typescript
import { Page } from '@playwright/test';

interface HighlightStyle {
  className: string;
  color: string;
  outlineWidth?: number;  // default: 3
  outlineOffset?: number; // default: 2
}

// Inject a highlight style into the page's CSS
async function addHighlightStyles(page: Page, style: HighlightStyle): Promise<void> {
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

// Add the highlight class to a target element
async function highlightElement(
  page: Page, selector: string, className: string
): Promise<void> {
  await page.locator(selector).evaluate((el, cls) => {
    el.classList.add(cls);
  }, className);
}

// Remove the highlight class when done
async function removeHighlight(
  page: Page, selector: string, className: string
): Promise<void> {
  await page.locator(selector).evaluate((el, cls) => {
    el.classList.remove(cls);
  }, className);
}
```

Nothing here is complex. We're using `page.addStyleTag()` to inject CSS and `element.classList.add()` to toggle it. These are browser APIs everyone already knows. The power comes from composing them into a workflow:

```typescript
async function highlightAndScreenshot(
  page: Page,
  selector: string,
  style: HighlightStyle,
  screenshotOptions: ScreenshotOptions,
  action?: () => Promise<void>,
): Promise<void> {
  await addHighlightStyles(page, style);
  await highlightElement(page, selector, style.className);
  await page.waitForTimeout(500); // let the highlight render

  await captureHighlightedScreenshot(page, selector, screenshotOptions);

  await removeHighlight(page, selector, style.className);

  if (action) {
    await action();
  }
}
```

The pattern is: highlight, capture, clean up, then optionally act. The screenshot shows the element *before* the interaction happens, so the reader sees what's about to be clicked or filled. The action executes *after* the screenshot, so the next step's screenshot shows the result.

This function is what Testdoc's `click()` and `fill()` methods call internally. When you write `testdoc.click('button[type="submit"]', 'Submit Login')`, here's what actually happens:

1. An orange outline and box-shadow are injected around the submit button
2. Playwright waits 500ms for the CSS to render
3. A screenshot is captured — either full-page or clipped to the element with padding
4. The highlight class is removed from the element
5. The button is clicked

That's five operations for one line of code. The engineer writing the test doesn't think about any of it. They write `click()` and get a documented, highlighted, screenshotted interaction.

### Clipping Screenshots to Elements

The element highlighter also supports cropping screenshots to just the relevant region. This is useful when a full-page screenshot would be overwhelming — you just want the login form, not the entire page with header, footer, and sidebar.

```typescript
async function captureHighlightedScreenshot(
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
    }
  } else {
    await page.screenshot({ path: options.path, fullPage: true });
  }
}
```

This uses Playwright's `clip` option to crop the screenshot to the element's bounding box plus configurable padding. The `Math.max` and `Math.min` calls handle edge cases where the element is near the viewport boundary. It's a small detail, but it means the documentation screenshots are focused and readable without any manual cropping.

### Hiding and Showing Elements

Sometimes a page element gets in the way of a clean screenshot — a modal overlay, a cookie banner, a debug toolbar. Testdoc provides `hideElement()` and `ShowElement()` to toggle visibility:

```typescript
// Hide an element for cleaner screenshots
await testdoc.hideElement('.cookie-consent-banner');

await testdoc.screenshot('Clean Dashboard View',
  'The dashboard without the consent banner obscuring the content.');

// Restore it afterward
await testdoc.ShowElement('.cookie-consent-banner', 'block');
```

Internally this injects a `<style>` tag with `display: none !important` — simple, effective, and it doesn't modify the DOM structure, just the rendering. This is a pattern we use constantly in Open edX where promotional banners and notification bars would otherwise clutter every screenshot.

---

## Markdown-Driven Test Authoring: Documentation First

So far we've shown two approaches: vanilla Playwright tests, and Playwright tests augmented with Testdoc method calls. Both are code-first — the TypeScript is the primary artifact, and the documentation is a byproduct.

But what if we inverted that? What if the *documentation* was the primary artifact, and the test code was embedded inside it?

That's the markdown-driven approach. You write a complete documentation page in markdown — prose, headings, tips, troubleshooting sections, the whole thing. Then you embed executable test code in fenced code blocks tagged with `testdoc`. When the test runner processes the file, it extracts and executes those code blocks in order while treating the surrounding markdown as the documentation output. These files live in `tests/testdoc/` alongside the TypeScript specs, and you run them with `npm run testdoc`.

### What This Looks Like

Here's a snippet from a markdown-driven login test:

````markdown
## Enter Your Credentials

Now you'll provide your account information to authenticate with the system.

### Step 1: Enter Your Email or Username

Click on the email field and carefully enter your login identifier. This can
be either the email address you used when registering or your chosen username.

```testdoc
await testdoc.fill({
  selector: 'input[name="emailOrUsername"]',
  value: 'testuser',
  title: 'Enter your email or username',
  description: 'Type your login identifier in the email/username field',
  elementOnly: 'form[id="sign-in-form"]',
  padding: 30
});
```

**Pro Tip**: If you're unsure whether to use your email or username,
try your email address first as it's the most commonly used identifier.
````

That's it. The markdown is real documentation — written for a human reader, with context, tips, and explanation. The `testdoc` code block is a real test step — it fills the input, highlights it, and captures a screenshot. When the runner processes this file, the prose becomes the output documentation and the code blocks become the executable test.

### Why This Matters

The traditional workflow for documentation is: engineer builds feature, writes test, ships it. Then someone (maybe the same engineer, maybe a tech writer, probably nobody) writes documentation separately. The docs reference the UI as it existed at the time of writing. Within weeks or months, the UI drifts and the docs are stale.

The markdown-driven approach collapses this. The documentation *is* the test. If the UI changes and the `testdoc.fill()` call targets a selector that no longer exists, the test fails. The engineer fixes the selector, updates the prose if needed, and the documentation is current again. There's no separate doc to forget about.

It also changes *who* can author tests. A technical writer who understands the product but doesn't want to scaffold a full Playwright test suite can write a markdown file, drop in `testdoc` blocks at the interaction points, and produce both documentation and test coverage. The barrier to entry drops significantly.

### Inline Assertions and Accessibility

The `testdoc` code blocks aren't limited to Testdoc methods. You have the full Playwright `page` object and `expect` API available. You can also run accessibility audits inline:

````markdown
## Understanding the Login Form

The login form contains all the fields you need to authenticate. Take
a moment to familiarize yourself with its layout and components.

```testdoc
await expect(loginPage.emailInput).toBeVisible();

// Run an accessibility audit at this point in the flow
await assertA11y(page, {
  warnOnly: true,
  report: true,
  reportName: 'login-page'
}, testInfo);

await testdoc.screenshot({
  title: "Login form overview",
  description: "Complete view of the login form with all input fields and buttons",
  elementOnly: 'form[id="sign-in-form"]',
  padding: 25
});
```
````

In a single code block you're asserting visibility, running an Axe accessibility audit that generates a report, and capturing a cropped screenshot of just the form with 25px of padding. The surrounding markdown explains what the form contains and why it matters. The reader of the documentation never sees the code. The engineer maintaining it has everything in one place.

### The Full Shape of a Markdown-Driven Test

A complete markdown-driven test file reads like a user guide. It has an introduction, prerequisites, step-by-step instructions, troubleshooting, and reference material. Sprinkled throughout are `testdoc` blocks that make the instructions executable:

````markdown
# How to Login to Open edX

This guide demonstrates the complete login process for Open edX.

## Getting Started

Before you begin, make sure you have your account credentials ready.

## Navigate to the Login Page

```testdoc
await loginPage.navigate();
await testdoc.screenshot({
  title: "Login page loaded",
  description: "The Open edX login page with all form elements"
});
```

The login page provides a clean interface designed for easy access.

## Enter Your Credentials

```testdoc
await testdoc.fill({
  selector: 'input[name="emailOrUsername"]',
  value: 'testuser',
  title: 'Enter your username',
  description: 'Type your login identifier',
  elementOnly: 'form[id="sign-in-form"]',
  padding: 30
});
```

```testdoc
await testdoc.fill({
  selector: 'input[name="password"]',
  value: 'password123',
  title: 'Enter your password',
  description: 'Type your secure password',
  elementOnly: 'form[id="sign-in-form"]',
  padding: 30
});
```

## Submit Your Login

```testdoc
await testdoc.click({
  selector: 'button[name="sign-in"]',
  title: 'Click the Sign In button',
  description: 'Submit your credentials',
  elementOnly: 'form[id="sign-in-form"]',
  padding: 20
});
```

```testdoc
await page.waitForLoadState('networkidle');
await expect(page.locator('input[name="emailOrUsername"]')).not.toBeVisible();
```

## Welcome to Your Dashboard

```testdoc
await testdoc.screenshot({
  title: "Dashboard successfully loaded",
  description: "Your personalized dashboard showing enrolled courses"
});

// Accessibility audit — report lands in artifacts/a11y-reports/
await assertA11y(page, {
  warnOnly: true,
  report: true,
  reportName: 'dashboard'
}, testInfo);
```

## Troubleshooting Common Issues

### Forgot Your Password?
1. Click the "Forgot Password" link on the login page
2. Enter your email address
3. Check your email for reset instructions
````

The troubleshooting section has no code blocks — it's pure documentation. That's fine. Not every section needs to be executable. The runner ignores sections without `testdoc` blocks and passes the prose straight through to the output.

### Object Config vs Positional Args

You'll notice in the markdown examples we're using the object config style for Testdoc methods. Both styles are supported, but the object style is more readable in a documentation context:

```typescript
// Positional args — compact, good for TypeScript tests
await testdoc.fill('#email', 'test@example.com', 'Enter Email', 'Type your email.');

// Object config — self-documenting, better in markdown-driven tests
await testdoc.fill({
  selector: '#email',
  value: 'test@example.com',
  title: 'Enter Email',
  description: 'Type your email address in the login field.',
  elementOnly: 'form[id="sign-in-form"]',
  padding: 30,
});
```

The object config makes it clear what `elementOnly` does (crop the screenshot to the form), what `padding` controls (breathing room around the crop), and which selector is being targeted. When someone reads the markdown source six months from now, they don't need to look up parameter order.

---

## Accessibility: Actionable Stories from Axe Reports

Running Axe during E2E tests is straightforward. The `@axe-core/playwright` package gives you a one-liner to audit any page state. We've wrapped it in our own `assertA11y` helper in `tests/common/a11y-helpers.ts` that adds screenshot capture, HTML report generation, and configurable severity handling. But the raw Axe output — a JSON blob of violations — isn't particularly useful to a product team. It's useful to the developer who's going to fix it, but it doesn't prioritize, it doesn't create tickets, and it doesn't show stakeholders what's actually wrong.

Here's how the helper looks in practice:

```typescript
import { assertA11y } from '../common/a11y-helpers';

test('dashboard accessibility', async ({ page }, testInfo) => {
  await page.goto('/dashboard');

  // Won't fail the test, but generates a full report with screenshots
  await assertA11y(page, {
    warnOnly: true,        // log violations without failing
    report: true,          // generate HTML report
    reportName: 'dashboard' // distinguish from other checks in same test
  }, testInfo);
});
```

The options give you fine-grained control: `warnOnly` lets you audit without blocking the pipeline while you're still remediating, `disabledRules` lets you suppress known false positives, and `exclude` lets you skip third-party widgets you can't control. Reports land in `artifacts/a11y-reports/` and you can view them with `npm run report:a11y`.

We take the Axe output and transform it:

1. **Screenshot each violation** — highlight the offending element, capture context
2. **Categorize by severity and WCAG criterion** — map violations to compliance requirements
3. **Generate story-ready descriptions** — each violation becomes a discrete, assignable unit of work with a screenshot, a description of the impact, and the suggested fix

Here's where the element highlighter comes back. When Axe reports a violation on a selector, we feed that selector directly into `highlightAndScreenshot()`:

```typescript
import { highlightAndScreenshot } from './element-highlighter';

for (const violation of axeResults.violations) {
  for (const node of violation.nodes) {
    const selector = node.target[0] as string;

    await highlightAndScreenshot(
      page,
      selector,
      { className: 'a11y-violation', color: '#ff0000', outlineWidth: 4 },
      {
        path: `artifacts/a11y/${violation.id}-${node.target[0]}.png`,
        elementOnly: true,
        padding: 30,
      },
    );
  }
}
```

The violation is now visible — a red highlight with a 4px outline around the offending element, cropped to just that region of the page. Attach that image to a Jira story alongside the Axe description and WCAG criterion, and you have an actionable ticket that anyone on the team can understand without opening DevTools.

This turns your E2E test suite into an accessibility story generator. Every test run produces a prioritized backlog of accessibility improvements, complete with visual evidence. No separate audit process. No quarterly review that produces a 200-page PDF nobody reads. Just a continuous stream of small, actionable fixes that ship alongside feature work.

Again — one codebase, third purpose.

---

## Visual Regression Testing: Pixel-Level Confidence

Visual regression testing catches what functional tests can't: *does it still look right?* In Open edX, where micro-frontends mean that a change in one MFE can have visual side effects that don't trigger any test failures, visual regression is critical. The component still renders, the API still returns data, but the layout broke because someone updated a shared CSS variable.

We've built a custom visual regression utility using `pixelmatch` that generates baseline screenshots, compares pixel-by-pixel on subsequent runs, and produces diff images with red highlights showing exactly which pixels changed.

### How It Works

```typescript
import { VisualRegression } from '../common/visual-regression-helpers';

test('account settings visual regression', async ({ page }, testInfo) => {
  const vr = new VisualRegression(page, testInfo);

  await page.goto('/account/');
  await page.waitForLoadState('networkidle');

  // Capture and compare against baseline
  await vr.captureAndCompare({
    name: 'account-page',
    fullPage: true,
    threshold: 0.15, // Allow 15% brightness difference per pixel
    mask: ['.timestamp', '.last-login-time'], // Hide dynamic content
  });
});
```

**First run:** Creates baseline in `tests/__visual-baselines__/{browser}/{test}/account-page.png` (tracked in git)

**Subsequent runs:** Compares against baseline and generates:
- `artifacts/visual-regression/{browser}/{test}/current/account-page.png` - Current screenshot
- `artifacts/visual-regression/{browser}/{test}/diff/account-page-diff.png` - **Red-highlighted pixel differences**

The diff image shows unchanged pixels in gray and changed pixels in bright red, making it immediately obvious what broke visually.

### Creating and Updating Baselines

**Generate initial baseline:**
```bash
npm run test tests/auth/login.spec.ts -- --project=chromium
git add tests/__visual-baselines__/
git commit -m "Add visual regression baseline for account page"
```

**Update baseline after intentional UI change:**
```bash
# Option 1: Delete and regenerate
rm -rf tests/__visual-baselines__/chromium/your-test-name/
npm run test tests/auth/login.spec.ts -- --project=chromium

# Option 2: Use updateBaseline() method in your test
await vr.updateBaseline({
  name: 'account-page',
  fullPage: true,
});
```

Our `playwright.config.ts` runs against chromium, firefox, and webkit. Visual regression baselines are per-browser — a font rendering change in Firefox won't fail the Chromium baseline. Run against a single browser during development and let CI cover the matrix:

```bash
npx playwright test --project=chromium   # just Chrome
npx playwright test --project=firefox    # just Firefox
npm test                                 # all projects
```

### What Makes a Fragile Test

Visual regression tests are only useful if they're stable. A flaky visual test is worse than no visual test — it trains your team to ignore failures. Common causes of flakiness in Playwright:

**Non-deterministic content.** If the page shows timestamps, randomized content, user-generated data, or anything that changes between runs, your screenshots will never match. You need to either mask dynamic regions or control the data.

**Animation and transitions.** CSS animations mean screenshots captured at slightly different moments look different. Disable animations in test mode or wait for them to complete.

**Font rendering differences.** Fonts render differently across operating systems and even browser versions. Run visual tests in a consistent containerized environment.

**Network timing.** If your test screenshots before all assets have loaded — images, fonts, lazy-loaded components — you get inconsistent baselines. Use `waitForLoadState('networkidle')` and add reasonable waits for async content.

**Viewport inconsistency.** Always set explicit viewport dimensions. Never rely on defaults.

### Debugging Flaky Tests

When a visual test starts flaking, you need to see what's actually happening in the browser. The project provides several modes for this:

```bash
npm run test:headed    # watch the browser as tests execute
npm run test:ui        # interactive UI mode with time-travel debugging
npm run test:debug     # step through with Playwright Inspector
npm run test:record    # capture video of the entire test run
```

`test:ui` is particularly useful — it records every network request, DOM snapshot, and console log, letting you scrub back and forth through the test execution to find exactly where things diverge. `test:record` saves video to `artifacts/test-results/`, which is invaluable for diagnosing timing issues that only reproduce in CI.

### The Rule of Thumb

If your test can't produce the same screenshot twice in a row on the same data, it's not ready for visual regression. Fix the stability first.

---

## Test Data: Setup, Cleanup, and Determinism

Stable E2E tests require deterministic environments. That means controlled test data.

In our project, this is handled by `scripts/setup-test-data.sh`, invoked via `npm run setup`. The script shells into the running Tutor dev LMS container and executes Django management commands to create users:

```bash
$TUTOR_CMD dev exec lms python manage.py lms shell -c "
from django.contrib.auth import get_user_model
from common.djangoapps.student.models import UserProfile

User = get_user_model()

try:
    user = User.objects.get(username='testuser')
    # User exists — update password to ensure it's correct
    user.set_password('password123')
    user.save()
except User.DoesNotExist:
    user = User.objects.create_user(
        username='testuser', email='test@example.com', password='password123'
    )
    user.is_active = True
    user.save()
    profile, _ = UserProfile.objects.get_or_create(user=user)
    profile.name = 'Test User'
    profile.save()
"
```

A few things to notice about this approach. The script is idempotent — if the user already exists, it updates the password and moves on. No duplicates, no errors on re-run. It checks that `tutor dev` is actually running before attempting anything, failing fast with a clear message if containers are down. And it creates both a regular user and an admin user with staff/superuser privileges, because different test scenarios need different permission levels.

| Asset | Details |
|---|---|
| Regular user | `testuser` / `password123` (`test@example.com`) |
| Admin user | `adminuser` / `admin123` (`admin@example.com`) |
| Demo Course | `course-v1:edX+DemoX+Demo_Course` (via `tutor dev do importdemocourse`) |
| Test Course | `course-v1:TestOrg+TestCourse+2023` (manual import) |

One honest detail: course setup is not yet automated in the script. Users are created programmatically, but courses rely on the existing demo course or a manual import. That's a gap worth acknowledging — and a good example of how this kind of infrastructure evolves incrementally. You don't need everything automated on day one. Start with the pieces that break most often (user creation, password drift) and expand from there.

Every test in the suite assumes these fixtures exist. No test creates its own user. No test depends on another test's side effects. Our `npm run test:full` command runs setup first, then the full suite, guaranteeing the fixtures exist.

**Why idempotency matters** — in a shared development environment, multiple engineers might run setup on the same Tutor instance. If the script threw errors on duplicate users or created a second `testuser`, you'd get collisions and mysterious test failures. The try/except pattern with `User.objects.get` followed by `create_user` handles this cleanly. Run it once, run it ten times — same result.

**Cleanup considerations** — the setup script doesn't have a teardown counterpart yet, and for this project that's fine. The test users and demo course are lightweight and don't interfere with other development work on the same Tutor instance. But if tests start creating transient data — enrollments, grade overrides, forum posts — those need explicit cleanup. The principle holds: if a test creates state beyond the shared fixtures, it owns the cleanup.

**Page objects keep tests readable** — `tests/common/page-objects.ts` encapsulates the selectors and login flow so tests read like intent, not implementation:

```typescript
// tests/common/page-objects.ts
export class LoginPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto('/login');
  }

  async login(username = 'testuser', password = 'password123') {
    await this.page.fill('input[name="emailOrUsername"]', username);
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button[name="sign-in"]');
    await this.page.waitForLoadState('networkidle');
  }
}
```

The goal is that any developer can clone the repo, run `npm run test:full`, and get the same results every time. No "works on my machine." No "you need to seed the database first." No "that test only passes if you run it after the other one."

---

## Running Tests in the Pipeline

The real value of this approach emerges when your E2E tests run automatically on every PR. That's when documentation generation, accessibility audits, and visual regression checks become part of your code review process rather than separate maintenance tasks.

### Pipeline Configuration

Our test suite is designed to run in any CI environment that can run Docker containers. The base URL is configurable via environment variable, defaulting to `http://apps.local.openedx.io:1996` for local development:

```bash
# .github/workflows/e2e-tests.yml
- name: Run E2E Tests
  env:
    BASE_URL: ${{ secrets.STAGING_URL }}
  run: |
    npm run setup
    npm test
    npm run testdoc
```

The setup step creates deterministic test fixtures. The test step runs both vanilla Playwright tests and Testdoc-augmented tests. The testdoc step generates markdown and RST documentation from the markdown-driven test files.

### Artifacts as Review Context

After the test run completes, the entire `artifacts/` directory becomes review context:

```yaml
- name: Upload Test Artifacts
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: test-artifacts
    path: artifacts/
    retention-days: 30
```

The uploaded artifacts include:

- **Test results** — Playwright HTML report showing pass/fail status, execution traces, and failure screenshots
- **Documentation** — Auto-generated user guides in `testdoc-output/`, complete with annotated screenshots
- **Accessibility reports** — Violation summaries in `a11y-reports/`, with highlighted screenshots of each issue
- **Visual regression diffs** — Before/after/diff images for any visual changes detected

Reviewers download the artifact archive and run `npm run report` or `npm run report:a11y` locally to browse the outputs. No need to pull the branch and run tests themselves — the artifacts show exactly what changed, visually and functionally.

### Updating Visual Regression Baselines

Visual regression baselines live in the repository under `tests/__visual-baselines__/`. When a PR intentionally changes UI, the visual regression tests fail and produce diff images with red highlights showing exactly which pixels changed. The engineer reviews the diffs in the artifact archive, confirms they're correct, and updates the baseline:

```bash
# Delete old baseline
rm -rf tests/__visual-baselines__/chromium/your-test-name/

# Re-run test to generate new baseline
npm run test tests/auth/login.spec.ts -- --project=chromium

# Commit new baseline
git add tests/__visual-baselines__/
git commit -m "Update visual regression baseline for button redesign"
```

The updated baselines get committed to the PR. Subsequent test runs pass. When the PR merges, the new baselines become the source of truth for future changes.

### Documentation Publishing

When a PR merges to main, a separate workflow publishes the generated documentation to your docs site:

```yaml
- name: Publish Documentation
  run: |
    npm run testdoc:markdown
    cp -r artifacts/testdoc-output/* docs/user-guides/
    # Push to docs repo or static site generator
```

Because the documentation is generated *from* the tests, it's always current with the live system. If a selector changes, the test fails. The engineer fixes the test, and the documentation updates automatically. Stale screenshots and outdated instructions become impossible — the documentation is a byproduct of validation, not a separate effort.

---

## Bringing It Together: The Pipeline

Here's what a complete E2E testing workflow looks like for Open edX:

1. **PR is opened** — GitHub Actions triggers the E2E test workflow
2. **Test data is seeded** — `npm run setup` runs `scripts/setup-test-data.sh`, creating deterministic test users and fixtures
3. **E2E tests run** — `npm test` executes both vanilla Playwright tests and markdown-driven testdoc files
4. **During the run:**
   - Testdoc captures annotated screenshots to `artifacts/testdoc-output/`
   - `assertA11y` audits each page state, producing reports in `artifacts/a11y-reports/`
   - Visual regression compares current screenshots pixel-by-pixel against baselines, generating red-highlighted diff images for any changes
5. **Artifacts are uploaded** — the entire `artifacts/` directory is attached to the workflow run
6. **Reviewer downloads artifacts** — they browse test reports, accessibility violations with highlighted screenshots, and visual diffs showing exactly what changed
7. **PR merges** — documentation publishes to the docs site, baseline screenshots update if needed
8. **Continuous validation** — the same tests run nightly against staging, catching regressions before production

One test suite. One codebase. Four outputs: test coverage, documentation, accessibility compliance, and visual regression protection.

---

## Looking Forward: AI-Assisted Test Completion

Everything we've shown so far still requires a human to assemble the complete picture. If you write vanilla Playwright, you get test coverage but no documentation. If you write Testdoc, you get screenshots but terse descriptions. If you write markdown, you get great prose but might not know the right selectors. The a11y checks and visual regression baselines need to be added manually to whichever mode you're working in.

The next step is letting AI complete whatever you start. You write in whichever mode is natural for the task — vanilla Playwright, Testdoc, or markdown — and AI uses the codebase to fill in everything else, ensuring the result has functional test coverage, Testdoc annotations with highlighted screenshots, accessibility reports, visual regression baselines, and human-readable documentation prose.

### Claude Code and CLAUDE.md

The tool that makes this practical is Claude Code — Anthropic's CLI for agentic coding. Claude Code operates directly in your terminal, reads and writes files in your project, and runs commands. The key feature for our workflow is the `CLAUDE.md` file.

`CLAUDE.md` is a configuration file that lives in your project root. Claude Code reads it automatically at the start of every session. It's not a README — it's not documenting the project for future developers. It's an instruction set that tells Claude how to *work on* the project. What conventions to follow, what tools are available, what patterns to use, what to avoid.

For our E2E project, the `CLAUDE.md` would teach Claude about the entire Testdoc system:

```markdown
# CLAUDE.md

## Project
Open edX E2E test suite using Playwright. Tests run against a Tutor-based
Open edX instance at http://apps.local.openedx.io:1996.

## Test Data
- Regular user: testuser / password123 (test@example.com)
- Admin user: adminuser / admin123 (admin@example.com)
- Demo course: course-v1:edX+DemoX+Demo_Course
- Setup: npm run setup (runs scripts/setup-test-data.sh)

## Testdoc Framework
The project uses a custom documentation framework in utils/testdoc.ts.
Testdoc wraps Playwright's page object to capture screenshots and generate
documentation during test execution.

Key methods: step(), screenshot(), click(), fill(), highlight(), note()
Each method accepts both positional args and an object config.
Prefer object config in markdown-driven tests for readability.

Output formats: generateMarkdown(), generateRST()
Artifacts land in: artifacts/testdoc-output/{test-name}/

## Markdown-Driven Tests
Tests in tests/testdoc/ can be written as .md files with embedded
```testdoc code blocks. The runner extracts and executes code blocks
in order. Surrounding prose becomes the documentation output.

When generating markdown-driven tests:
- Write documentation prose FIRST, then add testdoc blocks
- Use object config style for all testdoc method calls
- Include assertA11y() checks at major page states
- Add prerequisites, overview, and troubleshooting sections
- Use elementOnly with padding for focused screenshots
- Write for a reader who has never seen Open edX before

## Accessibility
Use assertA11y from tests/common/a11y-helpers.ts.
Options: warnOnly, report, reportName, disabledRules, exclude.
Reports go to artifacts/a11y-reports/.

## Page Objects
Login and navigation helpers in tests/common/page-objects.ts.
Always use page objects for authentication flows.

## Commands
- npm test: run all tests headless
- npm run testdoc: run testdoc tests
- npm run report:a11y: view accessibility reports
```

This file is concise and focused — it tells Claude what the Testdoc API looks like, what conventions to follow in markdown-driven tests, where page objects live, and what the test data looks like. Claude Code reads this once and carries it through the entire session.

### The Workflow: AI Completes Whatever You Start

The point isn't that you have to write vanilla Playwright and then convert it. You can start from *any* of the three authoring modes, and AI fills in whatever's missing.

**Starting from vanilla Playwright.** You write a standard test — selectors, assertions, no Testdoc calls. Claude Code reads it, understands the user flow being tested, and generates a complete markdown-driven version. It adds the Testdoc `click()`, `fill()`, and `screenshot()` calls with element highlighting and cropping. It inserts `assertA11y()` checks at major page states. And it writes the prose — headings, step descriptions, prerequisites, troubleshooting. You go from a bare functional test to a full documentation page.

**Starting from Testdoc.** You write the test using the Testdoc API — `step()`, `click()`, `fill()`, `screenshot()`. The interactions and screenshots are already defined. But the titles are terse, the descriptions are minimal, and there's no surrounding context for a reader who doesn't know Open edX. Claude Code reads the Testdoc calls, infers what each step accomplishes from the selectors and actions, and generates the markdown wrapper — the prose that explains *why* each step matters, the tips, the context. It also audits the test for missing `assertA11y()` calls and adds them where coverage gaps exist.

**Starting from markdown.** You write the documentation first — the full user guide with headings, explanations, and troubleshooting. But the `testdoc` code blocks are empty or incomplete. Maybe you know the workflow but not the exact selectors. Claude Code reads the prose, reads the page objects in `tests/common/page-objects.ts`, reads the existing test suite for selector patterns, and fills in the executable `testdoc` blocks. It matches the right selectors to the steps you described, adds `elementOnly` cropping and padding based on which form or component you're documenting, and wires in `assertA11y()` checks.

In every case, the AI uses the codebase as context — the `CLAUDE.md` for project conventions, the page objects for selectors, `utils/testdoc.ts` for the API surface, existing tests for patterns, and `tests/common/a11y-helpers.ts` for accessibility integration. The output is always a complete test that produces all three artifacts: functional test coverage, auto-generated documentation with annotated screenshots, and accessibility reports.

The engineer's job shifts from writing everything to *starting* the work in whatever mode is most natural for the task, then reviewing and refining what the AI produces. A QA engineer who thinks in terms of user flows starts with markdown. A frontend developer who thinks in selectors starts with vanilla Playwright. A technical writer who wants precise screenshots starts with Testdoc. The AI meets them where they are and fills in the rest.

### Custom Slash Commands

Claude Code supports custom slash commands — stored prompts you can invoke by name. You can create a `/testdoc` command that encapsulates the completion workflow regardless of starting mode:

```markdown
<!-- .claude/commands/testdoc.md -->
Read the file at $ARGUMENTS and determine its current state:

- If it's a vanilla Playwright .spec.ts file: generate a complete
  markdown-driven testdoc version with prose, testdoc blocks, and
  assertA11y checks.
- If it's a Testdoc .spec.ts file: generate a markdown-driven version,
  writing documentation prose around the existing testdoc calls and
  adding assertA11y checks at any page state that lacks one.
- If it's a .md file with testdoc blocks: fill in any empty or
  incomplete code blocks using page objects and selector patterns
  from the existing test suite. Add assertA11y checks where missing.
- If it's a .md file with prose only: add testdoc code blocks at
  each documented interaction point, matching selectors from
  tests/common/page-objects.ts and existing tests.

In all cases:
- Use object config for all testdoc method calls
- Include assertA11y checks after each major page navigation
- Add Prerequisites and Troubleshooting sections if missing
- Use elementOnly with padding for form interactions
- Write documentation prose for a reader who has never used Open edX
- Reference page objects from tests/common/page-objects.ts

Save the output to tests/testdoc/ with a descriptive filename.
```

Now the engineer types `/testdoc tests/auth/login.spec.ts` or `/testdoc tests/testdoc/enrollment-guide.md` and gets a complete file regardless of what they started with. The slash command is version-controlled in `.claude/commands/`, so the whole team shares the same workflow.

### Skills for Specialized Generation

Beyond slash commands, Claude Code supports skills — reusable capabilities bundled as directories with a `SKILL.md` and supporting scripts. A testdoc skill could include the conversion logic, validation that the generated file actually runs, and templates for different types of documentation (tutorials, reference guides, admin walkthroughs):

```
.claude/skills/
  testdoc-generator/
    SKILL.md          # instructions for generating testdoc files
    templates/
      tutorial.md     # template for tutorial-style docs
      admin-guide.md  # template for admin workflows
      quick-start.md  # template for getting-started guides
```

The skill encapsulates not just the prompt but the whole generation pattern — which template to use based on the test's subject matter, how to validate the output, where to save it.

### What This Changes

Right now, getting a complete test — one that covers functionality, generates documentation, and audits accessibility — requires the engineer to do all three things manually. They write the assertions, then add the Testdoc calls, then write the prose, then remember to add `assertA11y()`. Each layer is more work on top of the last, and the documentation prose is always the thing that gets cut when deadlines hit.

With AI completion from any starting point, every test becomes a complete test. The engineer contributes what they're good at — the flow logic, the domain knowledge, the selectors — and the AI fills in the rest. A vanilla Playwright test that took 20 minutes to write gets the Testdoc layer, the accessibility layer, and the documentation layer added in seconds.

The human stays in the loop for review and domain expertise — the AI doesn't know that the "Forgot Password" flow has a known 30-second email delay, or that admin users should use a different login URL in production. But the structural work — headings, step descriptions, screenshot annotations, accessibility check placement — that's mechanical and repeatable. That's what the AI handles.

This closes the last gap in the "one codebase, multiple outputs" vision. Start from any entry point. Let the AI complete it. Get all four outputs — test coverage, documentation, accessibility reports, and visual regression baselines — regardless of which authoring mode you started from.

---

## Closing: Invest in Your Testing Platform

The cost of writing E2E tests is real. They take longer to write than unit tests. They require infrastructure. They need maintenance. The argument for investing in them despite that cost is not "testing is important" — everyone already knows that.

The argument is that E2E tests are the *only* place where you have a real browser rendering real pages with real user interactions. That's an incredibly powerful context. If you're already paying the cost of setting up that context, extract every ounce of value from it.

Write your tests. Generate your docs. Audit your accessibility. Catch your visual regressions. Build the tools that make your tests work harder. And when the tools are mature enough, point an AI at your test suite — in whatever state it's in — and let it fill in everything you didn't have time for.

The markdown-driven approach means your documentation is never out of date, because if it were, the test would fail. AI completion means every test becomes a complete test, regardless of which authoring mode you started from. Together, they close both ends of the problem — creation and maintenance — in a way that no documentation workflow has been able to before.

The code has a short shelf life, but the platform you build on top of it compounds.

---

*One codebase. Multiple outputs. That's the pitch.*
