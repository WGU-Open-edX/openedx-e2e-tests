# AutodocTest API Documentation

The AutodocTest framework allows you to generate professional user documentation automatically while running Playwright tests. This creates step-by-step guides with screenshots that read like official documentation.

## Getting Started

### Basic Usage

```javascript
const { AutodocTest } = require('../utils/autodoc');

const autodoc = new AutodocTest(page, "folder-name", {
  title: "How to Perform This Task",
  overview: "This guide explains...",
  prerequisites: ["Requirement 1", "Requirement 2"],
  notes: ["Important note about the process"],
  relatedTopics: [
    { title: "Related Guide", url: "#link" },
    "Plain text topic"
  ]
});

await autodoc.initialize();
```

## Constructor Options

### AutodocTest(page, testName, options)

- **page**: Playwright page object
- **testName**: Folder name for output (use kebab-case, e.g., "how-to-login")
- **options**: Configuration object

#### Options Object

| Property | Type | Description | Required |
|----------|------|-------------|----------|
| `title` | string | Display title for documentation | No (defaults to testName) |
| `overview` | string | Introduction paragraph explaining the purpose | No |
| `prerequisites` | string[] | List of requirements before starting | No |
| `notes` | string[] | Important notes displayed at the top | No |
| `relatedTopics` | (string \| object)[] | Links to related documentation | No |

#### Related Topics Format

```javascript
relatedTopics: [
  { title: "Link Title", url: "https://example.com" },  // Creates clickable link
  "Plain text topic"  // Just text, no link
]
```

## Methods

### addStep(title, description?, action?, options?)

Adds a step with optional screenshot to the documentation.

```javascript
await autodoc.addStep("Navigate to login page");
await autodoc.addStep(
  "Navigate to login page",
  "Detailed explanation of what this step does",
  null,
  { screenshot: false, note: "Important tip about this step" }
);
```

**Parameters:**
- `title` (string): Step title (required)
- `description` (string): Detailed explanation (optional)
- `action` (function): Code to execute (optional)
- `options` (object): Configuration options

**Options:**
- `screenshot` (boolean): Whether to take screenshot (default: true)
- `note` (string): Additional note for this step

### fillElement(selector, value, title, description?, options?)

Highlights an input field, fills it with a value, and documents the step.

```javascript
await autodoc.fillElement(
  'input[name="email"]',
  'user@example.com',
  'Enter your email address',
  'Type your email in the email field.',
  {
    elementOnly: true,  // Screenshot the input with 20px padding
    padding: 40,  // Or use custom padding
    note: 'Make sure to use a valid email format'
  }
);

// Screenshot a different element while highlighting the input
await autodoc.fillElement(
  'input[name="email"]',
  'user@example.com',
  'Enter email',
  'Type your email address.',
  {
    elementOnly: 'form.login-form',  // Screenshot the entire form
    padding: 25  // With 25px padding around the form
  }
);
```

**Parameters:**
- `selector` (string): CSS selector for the element
- `value` (string): Value to enter
- `title` (string): Step title
- `description` (string): Detailed explanation (optional)
- `options` (object): Configuration options

**Options:**
- `elementOnly` (boolean|string): Screenshot mode - `true` for highlighted element, string selector for different element, or `null`/`false` for full page
- `padding` (number): Pixels of padding around element screenshots (default: 20)
- `note` (string): Additional note for this step

### clickElement(selector, title, description?, options?)

Highlights a clickable element, clicks it, and documents the step.

```javascript
await autodoc.clickElement(
  'button[type="submit"]',
  'Click the Submit button',
  'This will submit your form data.',
  { elementOnly: true }
);
```

**Parameters:**
- `selector` (string): CSS selector for the element
- `title` (string): Step title
- `description` (string): Detailed explanation (optional)
- `options` (object): Configuration options

### highlightElement(selector, action?, options?)

Highlights an element and optionally performs an action. Returns step data for manual documentation.

```javascript
const { stepNumber, screenshot } = await autodoc.highlightElement(
  '.profile-menu',
  null,
  { elementOnly: true }
);

// Manually add to documentation
autodoc.steps.push({
  stepNumber,
  title: 'Profile menu highlighted',
  description: 'This menu contains your account options.',
  screenshot,
  note: 'Click here to access settings'
});
```

## Common Options

### Screenshot Options

- `elementOnly: true` - Screenshot the highlighted element with padding (default: 20px)
- `elementOnly: 'selector'` - Screenshot a different element (with padding) while highlighting the specified element
- `elementOnly: null` or `elementOnly: false` - Full page screenshot (default)
- `padding: 30` - Custom padding around element screenshots in pixels (default: 20)
- `screenshot: false` - Skip taking a screenshot for this step

### Element Highlighting

All interactive methods (`fillElement`, `clickElement`, `highlightElement`) automatically:
1. Wait for the element to be visible
2. Add orange outline highlight
3. Take screenshot
4. Remove highlight
5. Perform the action

## Output Generation

### generateMarkdown()

Creates a professional markdown file with:
- Title and overview
- Prerequisites section
- Important notes
- Numbered steps with screenshots
- Related topics with links

```javascript
await autodoc.generateMarkdown();
// Creates: autodoc-output/{testName}/documentation.md
```

### generateRST()

Creates reStructuredText format for Sphinx documentation:

```javascript
await autodoc.generateRST();
// Creates: autodoc-output/{testName}/documentation.rst
```

## File Structure

```
autodoc-output/
└── how-to-login/
    ├── documentation.md
    ├── documentation.rst
    ├── step-01.png
    ├── step-02.png
    └── step-03.png
```

## Best Practices

### 1. Use Descriptive Titles
```javascript
// Good
await autodoc.addStep("Enter your email address", "Type your email in the username field");

// Avoid
await autodoc.addStep("Fill input");
```

### 4. Use Element-Only Screenshots for UI Components
```javascript
// Screenshot just the button with default 20px padding
await autodoc.clickElement('button', 'Click Submit', null, { elementOnly: true });

// Screenshot the entire form while highlighting just the input
await autodoc.fillElement('input[name="email"]', 'user@example.com', 'Enter email', null, {
  elementOnly: 'form',  // Screenshot the form
  padding: 30  // With 30px padding around the form
});

// For full page context
await autodoc.addStep("Page loaded", "The dashboard page is now visible");
```

## Example: Complete Login Documentation

```javascript
const autodoc = new AutodocTest(page, "user-login", {
  title: "How to Log In to Your Account",
  overview: "This guide shows you how to access your account using your email and password.",
  prerequisites: [
    "You have created an account",
    "You know your email and password"
  ],
  notes: [
    "Use the 'Forgot Password' link if you can't remember your password"
  ],
  relatedTopics: [
    { title: "Create Account", url: "#signup" },
    { title: "Reset Password", url: "#reset" }
  ]
});

await autodoc.initialize();

await autodoc.addStep("Go to login page", "Navigate to the login form");
await autodoc.fillElement('input[name="email"]', 'user@example.com', 'Enter email');
await autodoc.fillElement('input[name="password"]', 'password', 'Enter password');
await autodoc.clickElement('button[type="submit"]', 'Click Sign In');
await autodoc.addStep("Access dashboard", "You're now logged in");

await autodoc.generateMarkdown();
await autodoc.generateRST();
```

This creates professional documentation that reads like official user guides with step-by-step instructions and screenshots.