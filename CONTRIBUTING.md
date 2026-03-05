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

Releases are handled by maintainers. Follow these steps to create a new release:

### 1. Prepare the Release

```bash
# Ensure you're on main and up to date
git checkout main
git pull origin main

# Create a release branch
git checkout -b release/v1.0.x
```

### 2. Update Version and Changelog

1. Bump the version in `package.json` (following [semver](https://semver.org/)):
   - Patch version (1.0.x): Bug fixes and minor changes
   - Minor version (1.x.0): New features, backward compatible
   - Major version (x.0.0): Breaking changes

2. Update `CHANGELOG.md`:
   - Add a new section for the version with today's date
   - Document all changes under appropriate categories:
     - `Added` for new features
     - `Changed` for changes in existing functionality
     - `Deprecated` for soon-to-be removed features
     - `Removed` for removed features
     - `Fixed` for bug fixes
     - `Security` for security fixes

3. Run the build to ensure everything compiles:
   ```bash
   npm run build
   npm run lint
   ```

### 3. Commit and Create PR

```bash
# Commit the version bump
git add package.json CHANGELOG.md
git commit -m "chore: bump version to v1.0.x"

# Push and create PR
git push origin release/v1.0.x
```

Create a pull request to `main` with the title "Release v1.0.x"

### 4. Merge and Tag

Once the PR is approved and merged:

```bash
# Switch to main and pull the merge
git checkout main
git pull origin main

# Create and push the version tag
git tag v1.0.x
git push origin v1.0.x
```

### 5. Create GitHub Release

1. Go to https://github.com/WGU-Open-edX/openedx-e2e-tests/releases/new
2. Select the tag you just created (v1.0.x)
3. Release title: `v1.0.x`
4. Description: Copy the relevant section from CHANGELOG.md
5. Click "Publish release"

### 6. Automated npm Publishing

Once the tag is pushed, GitHub Actions will automatically:
- Run lint and build checks
- Publish the package to npm with provenance

Monitor the [Actions tab](https://github.com/WGU-Open-edX/openedx-e2e-tests/actions) to ensure the publish workflow completes successfully.

### Prerequisites for Automated Publishing

The repository must have an `NPM_TOKEN` secret configured:
1. Generate an npm token with "Automation" type from https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Add it to repository secrets at Settings → Secrets and variables → Actions → New repository secret
3. Name: `NPM_TOKEN`
4. Value: Your npm token

## Questions or Issues?

- Open an issue for bugs or feature requests
- Use discussions for questions or general feedback
- Check existing issues before creating new ones

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
