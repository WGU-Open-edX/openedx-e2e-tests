# One Codebase, Many Outputs: E2E Testing as a Platform in Open edX

## Talk Overview

This talk explores how end-to-end testing with Playwright can serve as more than just a quality gate. By treating your test suite as a platform, you can generate documentation, accessibility reports, visual regression baselines with pixel-level diff highlighting, and actionable stories - all from the same codebase. We'll demonstrate a custom autodoc tool built on top of Playwright, introduce a markdown-driven authoring workflow that lets engineers write documentation first and embed executable test code inline, show how pixel-by-pixel visual regression testing catches UI breakages that functional tests miss, discuss strategies for stable, repeatable tests that belong in your deployment pipeline, and look at how AI tooling like Claude Code can complete a test written in any authoring mode - filling in documentation, accessibility checks, visual regression baselines, and Testdoc annotations from the codebase context.

---

## Opening: Why E2E Tests Matter

E2E tests validate what actually matters - the user's experience. Unit tests confirm your functions work. Integration tests confirm your services talk to each other. But only E2E tests answer the question: *can a learner actually log in, see their courses, and complete an assignment?*

In a platform like Open edX - where micro-frontends, backend APIs, authentication layers, and LMS configuration all intersect - E2E tests are a reliable way to catch the kinds of breakages that slip through lower-level testing.

The argument against E2E testing has always been cost: they're slow, they're flaky, they're hard to maintain. This talk is about making that investment pay off multiple times over.

---

## The Core Idea

Keeping documentation and screenshots up to date is one of the most manual, tedious, and frequently neglected tasks in any project. People write docs at launch and never touch them again. Screenshots go stale within a single release cycle. Accessibility audits don't happen often enough.

The insight is this: the parts of Open edX that are worth documenting are almost always the parts worth writing E2E tests for. The user-facing workflows need both test coverage and documentation. So why maintain two separate efforts?

By running documentation generation, accessibility audits, and visual regression checks during E2E tests, you collapse three maintenance burdens into one. Write the test once. Get coverage, docs, and compliance as outputs. When the UI changes, the test breaks, you fix it, and the docs and screenshots update automatically.

One codebase. 4 areas of impact.

---

## Demo Setup: The Project

Before we write any tests, let's look at what we're working with. This is a real project. It runs against a Tutor-based Open edX installation at `http://apps.local.openedx.io:1996`.

```
openedx-e2e-tests/
├── src/                      # Library source code (published to npm)
│   ├── index.ts              # Main exports
│   ├── testdoc.ts            # Test documentation framework
│   ├── a11y-helpers.ts       # Accessibility utilities
│   ├── visual-regression-helpers.ts
│   └── types/                # TypeScript definitions
├── bin/                      # CLI tools (published)
│   └── run-markdown-test.ts  # Markdown test runner
├── tests/                    # Example tests (not published)
│   ├── auth/                 # Authentication examples
│   ├── courses/              # Course management examples
│   ├── testdoc/              # Documentation generation examples
│   └── __visual-baselines__  # Visual regression baselines
├── docs/                     # Documentation guides
├── artifacts/                # Generated artifacts (gitignored)
│   ├── a11y-reports/         # Accessibility reports
│   ├── playwright-report/    # HTML test reports
│   ├── testdoc-output/       # Auto-generated documentation
│   └── visual-regression/    # Visual diffs
├── dist/                     # Compiled library (published)
└── package.json
```

A few things to notice about this structure:

- **`src/`** - The published library code. Anyone can `npm install openedx-e2e-tests` and import these utilities.
- **`bin/`** - CLI tools for running markdown-driven tests.
- **`tests/`** - Example implementations showing how to use the library. Not published to npm.
- **`docs/`** - Comprehensive guides for using each feature.
- **`artifacts/`** - Where *everything* lands: test results, accessibility reports, and auto-generated documentation. All gitignored, all regenerated on every run.
- **`dist/`** - Compiled TypeScript ready for distribution.
