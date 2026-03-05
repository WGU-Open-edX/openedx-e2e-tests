# Contributing to Open edX E2E Tests

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm
- Git

### Setup

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/openedx-e2e-tests.git
   cd openedx-e2e-tests
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Install Playwright browsers:
   ```bash
   npm run install:browsers
   ```

4. Build the project:
   ```bash
   npm run build
   ```

## Development Workflow

### Making Changes

1. Create a new branch for your feature or fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes in the `src/` directory

3. Build and test your changes:
   ```bash
   npm run build
   npm run lint
   ```

4. If you're adding new features, update the documentation in the README

### Code Style

- We use ESLint with the @edx/eslint-config configuration
- Run `npm run lint` to check your code
- TypeScript is required for all source files
- Follow existing code patterns and naming conventions

### Commit Messages

- Use clear, descriptive commit messages
- Follow conventional commits format when possible:
  - `feat:` for new features
  - `fix:` for bug fixes
  - `docs:` for documentation changes
  - `refactor:` for code refactoring
  - `test:` for test changes

### Pull Requests

1. Push your changes to your fork
2. Create a pull request against the `main` branch
3. Provide a clear description of the changes
4. Reference any related issues
5. Ensure CI checks pass

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run with visible browser
npm run test:headed

# Run in UI mode
npm run test:ui

# Run specific test file
npx playwright test tests/path/to/test.spec.ts
```

### Adding Tests

- Add example tests in the `tests/` directory
- Follow existing test patterns
- Include accessibility checks where appropriate
- Add documentation generation examples for new features

## Project Structure

```
openedx-e2e-tests/
├── src/                   # Library source code (TypeScript)
│   ├── index.ts           # Main exports
│   ├── testdoc.ts         # Documentation generation
│   ├── a11y-helpers.ts    # Accessibility testing
│   └── types/             # TypeScript type definitions
├── bin/                   # CLI tools
├── tests/                 # Example tests
├── docs/                  # Documentation
└── dist/                  # Compiled output (generated)
```

## Release Process

Releases are handled by maintainers:

1. Version is bumped in package.json
2. Changes are documented in CHANGELOG.md
3. A git tag is created (e.g., v1.0.3)
4. GitHub Actions automatically publishes to npm

## Questions or Issues?

- Open an issue for bugs or feature requests
- Use discussions for questions or general feedback
- Check existing issues before creating new ones

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
