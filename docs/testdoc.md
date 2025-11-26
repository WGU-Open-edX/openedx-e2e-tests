# TestdocTest Documentation

The TestdocTest framework allows you to generate professional user documentation automatically while running Playwright tests. This creates step-by-step guides with screenshots that read like official documentation.

## Getting Started

### Basic Usage

```javascript
const { TestdocTest } = require('../utils/testdoc');

const testdoc = new TestdocTest(page, "folder-name", {
  title: "How to Perform This Task",
  overview: "This guide explains...",
  prerequisites: ["Requirement 1", "Requirement 2"],
  notes: ["Important note about the process"],
  relatedTopics: [
    { title: "Related Guide", url: "#link" },
    "Plain text topic"
  ]
});

await testdoc.initialize();
```

## Constructor Options

### TestdocTest(page, testName, options)

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
| `showNumbers` | boolean | Default numbering behavior for all steps | No (defaults to true) |

#### Related Topics Format

```javascript
relatedTopics: [
  { title: "Link Title", url: "https://example.com" },  // Creates clickable link
  "Plain text topic"  // Just text, no link
]
```

## Methods

### step(config)

Adds a step with optional screenshot to the documentation.

```javascript
// Simple step
await testdoc.step({
  title: "Navigate to login page"
});

// Detailed step with description
await testdoc.step({
  title: "Navigate to login page",
  description: "Detailed explanation of what this step does",
  screenshot: false
});

```

**Parameters (Object):**
- `title` (string): Step title (required)
- `description` (string): Detailed explanation (optional)
- `action` (function): Code to execute (optional)
- `screenshot` (boolean): Whether to take screenshot (default: true)
- `showNumber` (boolean): Whether to display step number in output (default: from constructor)
- `skipNumber` (boolean): Whether to skip numbering entirely (default: false)

### fill(config)

Highlights an input field, fills it with a value, and documents the step.

```javascript
// Recommended: Object parameters
await testdoc.fill({
  selector: 'input[name="email"]',
  value: 'user@example.com',
  title: 'Enter your email address',
  description: 'Type your email in the email field.',
  elementOnly: true,
  padding: 40
});

// Screenshot a different element while highlighting the input
await testdoc.fill({
  selector: 'input[name="email"]',
  value: 'user@example.com',
  title: 'Enter email',
  description: 'Type your email address.',
  elementOnly: 'form.login-form',
  padding: 25
});

```

**Parameters (Object):**
- `selector` (string): CSS selector for the element (required)
- `value` (string): Value to enter (required)
- `title` (string): Step title (required)
- `description` (string): Detailed explanation (optional)
- `elementOnly` (boolean|string): Screenshot mode - `true` for highlighted element, string selector for different element, or `null`/`false` for full page
- `padding` (number): Pixels of padding around element screenshots (default: 20)
- `showNumber` (boolean): Whether to display step number in output (default: from constructor)
- `skipNumber` (boolean): Whether to skip numbering entirely (default: false)

### click(config)

Highlights a clickable element, clicks it, and documents the step.

```javascript
// Recommended: Object parameters
await testdoc.click({
  selector: 'button[type="submit"]',
  title: 'Click the Submit button',
  description: 'This will submit your form data.',
  elementOnly: true
});

```

**Parameters (Object):**
- `selector` (string): CSS selector for the element (required)
- `title` (string): Step title (required)
- `description` (string): Detailed explanation (optional)
- `elementOnly` (boolean|string): Screenshot mode - `true` for highlighted element, string selector for different element, or `null`/`false` for full page
- `padding` (number): Pixels of padding around element screenshots (default: 20)
- `showNumber` (boolean): Whether to display step number in output (default: from constructor)
- `skipNumber` (boolean): Whether to skip numbering entirely (default: false)

### screenshot(config)

Takes a screenshot without highlighting any elements.

```javascript
// Recommended: Object parameters
await testdoc.screenshot({
  title: "Dashboard loaded",
  description: "The main dashboard is now visible"
});

// Element screenshot with custom selector
await testdoc.screenshot({
  title: "Login form visible",
  description: "The login form is displayed on the page",
  elementOnly: 'form#login-form',
  padding: 30
});

```

**Parameters (Object):**
- `title` (string): Step title (required)
- `description` (string): Detailed explanation (optional)
- `elementOnly` (string): CSS selector for element to screenshot (required if not full page)
- `padding` (number): Pixels of padding around element screenshots (default: 20)
- `showNumber` (boolean): Whether to display step number in output (default: from constructor)
- `skipNumber` (boolean): Whether to skip numbering entirely (default: false)

### note(note)

Adds a note to the most recently created step.

```javascript
await testdoc.fill({ /* ... */ });
await testdoc.note("This is an important tip about the previous step");
```

**Parameters:**
- `note` (string): The note text to add to the last step

### highlight(selector, action?, options?)

Highlights an element and optionally performs an action. Returns step data for manual documentation.

```javascript
const { stepNumber, numberedStepNumber, screenshot } = await testdoc.highlight(
  '.profile-menu',
  null,
  {
    elementOnly: true,
    showNumber: true,
    skipNumber: false
  }
);

// Manually add to documentation
testdoc.steps.push({
  stepNumber,
  numberedStepNumber,
  title: 'Profile menu highlighted',
  description: 'This menu contains your account options.',
  screenshot,
  note: 'Click here to access settings',
  showNumber: true
});
```

**Parameters:**
- `selector` (string): CSS selector for element to highlight (required)
- `action` (function): Optional function to execute after highlighting (optional)
- `options` (object): Configuration options (optional)
  - `elementOnly` (boolean|string): Screenshot mode (default: null)
  - `padding` (number): Padding around element screenshots (default: 20)
  - `title` (string): Custom title for the step (default: "highlight-{selector}")
  - `showNumber` (boolean): Whether to display step number (default: from constructor)
  - `skipNumber` (boolean): Whether to skip numbering entirely (default: false)

**Returns:**
- `stepNumber` (number): Internal step counter
- `numberedStepNumber` (number|null): Display step number (null if skipNumber: true)
- `screenshot` (string): Screenshot filename

## Step Numbering

The TestdocTest framework provides flexible step numbering options to control how steps are numbered and displayed in the generated documentation.

### Constructor Option: `showNumbers`

Control the default numbering behavior for all steps:

```javascript
const testdoc = new TestdocTest(page, "test-name", {
  title: "My Test",
  showNumbers: true   // Default: numbers are shown
  // showNumbers: false // Numbers are assigned but not displayed
});
```

### Per-Step Options: `showNumber` and `skipNumber`

Control numbering behavior for individual steps:

```javascript
// Normal numbered step (follows constructor default)
await testdoc.step({
  title: "Step with number"
  // Will be "1. Step with number" if showNumbers: true
});

// Hide number for this step (still gets assigned number 2)
await testdoc.step({
  title: "Step without visible number",
  showNumber: false
  // Will be "Step without visible number" (no number shown)
});

// Skip numbering entirely (doesn't get a number)
await testdoc.step({
  title: "Unnumbered informational step",
  skipNumber: true
  // Will be "Unnumbered informational step" (no number assigned)
});

// Next numbered step continues sequence
await testdoc.step({
  title: "Next numbered step"
  // Will be "3. Next numbered step" (continues from step 1)
});
```

### Numbering Behavior

- **`showNumber: false`**: Step gets a number but doesn't display it in markdown headings
- **`skipNumber: true`**: Step doesn't get a number at all, skipping that position in the sequence
- **When both are specified**: `skipNumber` takes precedence

### Meaningful Filenames

Screenshots are automatically named with descriptive slugs based on step titles:

```
step-01-navigate-to-login-page.png
step-02-enter-your-email-address.png
step-03-click-the-submit-button.png
```

Filenames are generated by:
1. Converting title to lowercase
2. Removing special characters
3. Replacing spaces with hyphens
4. Limiting length to 50 characters
5. Prefixing with step number (padded to 2 digits)

## Common Options

### Screenshot Options

- `elementOnly: true` - Screenshot the highlighted element with padding (default: 20px)
- `elementOnly: 'selector'` - Screenshot a different element (with padding) while highlighting the specified element
- `elementOnly: null` or `elementOnly: false` - Full page screenshot (default)
- `padding: 30` - Custom padding around element screenshots in pixels (default: 20)
- `screenshot: false` - Skip taking a screenshot for this step

### Element Highlighting

All interactive methods (`fill`, `click`, `highlight`) automatically:
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
await testdoc.generateMarkdown();
// Creates: testdoc-output/{testName}/documentation.md
```

### generateRST()

Creates reStructuredText format for Sphinx documentation:

```javascript
await testdoc.generateRST();
// Creates: testdoc-output/{testName}/documentation.rst
```

## File Structure

```
testdoc-output/
└── how-to-login/
    ├── documentation.md
    ├── documentation.rst
    ├── step-01-navigate-to-login-page.png
    ├── step-02-enter-your-email-address.png
    └── step-03-click-submit-button.png
```

## Best Practices

### 1. Use Descriptive Titles
```javascript
// Good
await testdoc.step("Enter your email address", "Type your email in the username field");

// Avoid
await testdoc.step("Fill input");
```

### 4. Use Element-Only Screenshots for UI Components
```javascript
// Screenshot just the button with default 20px padding
await testdoc.click('button', 'Click Submit', null, { elementOnly: true });

// Screenshot the entire form while highlighting just the input
await testdoc.fill('input[name="email"]', 'user@example.com', 'Enter email', null, {
  elementOnly: 'form',  // Screenshot the form
  padding: 30  // With 30px padding around the form
});

// For full page context
await testdoc.step("Page loaded", "The dashboard page is now visible");
```

## Example: Complete Login Documentation

```javascript
const testdoc = new TestdocTest(page, "user-login", {
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
  ],
  showNumbers: true  // Enable step numbering by default
});

await testdoc.initialize();

// Recommended: Object parameters for clarity
await testdoc.step({
  title: "Go to login page",
  description: "Navigate to the login form"
});

await testdoc.fill({
  selector: 'input[name="email"]',
  value: 'user@example.com',
  title: 'Enter email',
  elementOnly: true
});

await testdoc.fill({
  selector: 'input[name="password"]',
  value: 'password',
  title: 'Enter password',
  elementOnly: true
});
await testdoc.note("Make sure Caps Lock is off");

await testdoc.click({
  selector: 'button[type="submit"]',
  title: 'Click Sign In'
});

await testdoc.screenshot({
  title: "Access dashboard",
  description: "You're now logged in and can see your dashboard"
});

await testdoc.generateMarkdown();
await testdoc.generateRST();
```

This creates professional documentation that reads like official user guides with step-by-step instructions and screenshots.

## Markdown-Driven Tests

You can now write tests directly as markdown files with embedded code blocks. This approach allows you to write documentation first, then add interactive code to make it executable.

### Creating Markdown Tests

Create a `.md` file in the `tests/testdoc/` directory:

```markdown
# How to Login to Open edX

This guide shows you how to log into your Open edX account step by step.

## Navigate to Login Page

Go to the login page from the main website. You can access this by clicking the "Sign In" button.

```js
await loginPage.navigate();
await testdoc.screenshot({
  title: "Login page loaded",
  description: "The Open edX login page is displayed"
});
```

## Enter Your Email

Click on the email field and enter your email address or username.

```js
await loginPage.emailInput.fill("test@example.com");
await testdoc.screenshot({
  title: "Email entered",
  description: "Email address filled in the email field",
  elementOnly: 'input[name="emailOrUsername"]',
  padding: 30
});
```
```

### Running Markdown Tests

Use the npm scripts to run markdown-driven tests:

```bash
# Run all markdown files in tests/testdoc/
npm run test:markdown

# Run a specific markdown file
npm run test:markdown:file tests/testdoc/login-markdown.md
```

### How It Works

1. The markdown parser extracts headings as step titles and descriptions
2. Code blocks are executed as Playwright test code
3. Steps are automatically added to the documentation with `testdoc.step()`
4. The test generates both the interactive execution and the final documentation

### Benefits of Markdown-Driven Tests

- **Documentation-first approach**: Write clear, readable documentation that becomes executable
- **No duplication**: Single source for both documentation and test logic
- **Easy maintenance**: Update documentation and tests in one place
- **Readable**: Stakeholders can review test scenarios in markdown format