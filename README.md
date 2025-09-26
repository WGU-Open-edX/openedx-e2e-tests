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

```bash
# Setup test data and run all tests
npm run test:full

# Run all tests (assumes test data exists)
npm test

# Run tests in headed mode
npm run test:headed

# Run tests with UI mode
npm run test:ui

# Debug tests
npm run test:debug

# View test report
npm run report
```

## Test Data Management

```bash
# Create test users and courses
npm run setup

## Project Structure

- `tests/auth/` - Authentication related tests
- `tests/courses/` - Course functionality tests
- `tests/common/` - Shared utilities and page objects
- `scripts/` - Setup script
- `playwright.config.js` - Playwright configuration

## Configuration

The tests are configured to run against multiple browsers and devices. Update `playwright.config.js` to modify:

- Base URL (default: `http://apps.local.openedx.io:1996`)
- Browser configurations
- Test timeouts
- Retry logic

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