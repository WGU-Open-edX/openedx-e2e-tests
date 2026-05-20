# VPAT Generation

This project includes automated VPAT (Voluntary Product Accessibility Template) generation based on accessibility test results.

## Overview

A VPAT is a standardized document that details how a software product conforms to accessibility standards like WCAG 2.2. This automated generator creates VPATs by analyzing axe-core accessibility test results from your Playwright E2E tests.

## Quick Start

### 1. Run Accessibility Tests

First, run your tests with accessibility checking enabled:

```bash
npm test
```

Accessibility reports will be saved to `artifacts/a11y-reports/`.

### 2. Generate VPAT

Generate a VPAT document in HTML or Markdown format:

```bash
# Generate HTML VPAT (default)
npm run vpat:html

# Generate Markdown VPAT
npm run vpat:md

# Generate reStructuredText VPAT
npm run vpat:rst

# Generate with custom settings
npm run vpat
```

The generated VPAT will be saved to `artifacts/vpat/`.

## VPAT Format

The generated VPAT includes:

- **WCAG 2.2 Level A & AA Criteria**: All 56 success criteria
- **Conformance Levels**: "Supports", "Does Not Support", or "Not Evaluated"
- **Pages Evaluated**: List of all tested pages with URLs and violation counts
- **Detailed Violations**: Specific issues detected by automated testing, mapped to WCAG criteria
- **Summary Statistics**: Total violations, supports, and does not support counts

## Configuration

### Using Config File (Recommended)

Create a `vpat.config.json` file in your project root:

```bash
cp vpat.config.example.json vpat.config.json
```

Then edit `vpat.config.json` with your product information:

```json
{
  "productName": "Open edX Platform - Redwood",
  "productVersion": "Redwood.1",
  "productDescription": "Open edX Learning Management System",
  "contactInformation": "accessibility@myschool.edu",
  "evaluationMethods": "Automated testing using axe-core and Playwright. Manual testing in progress.",
  "vendor": {
    "name": "My School University",
    "website": "https://myschool.edu"
  }
}
```

**Note:** `vpat.config.json` is in `.gitignore` so your specific product info won't be committed to version control.

### Using Environment Variables (Override)

Environment variables override config file settings:

```bash
VPAT_PRODUCT_VERSION="Redwood.2" npm run vpat:html
```

Available environment variables:
- `VPAT_PRODUCT_NAME`
- `VPAT_PRODUCT_VERSION`
- `VPAT_PRODUCT_DESCRIPTION`
- `VPAT_CONTACT_INFO`
- `VPAT_EVALUATION_METHODS`

## Advanced Usage

### Custom Report Directory

```bash
ts-node scripts/generate-vpat.ts path/to/reports html output-path.html
```

### Programmatic Usage

```typescript
import { generateVPATData, generateHTMLReport } from './scripts/generate-vpat';

const vpatData = generateVPATData('artifacts/a11y-reports', {
  productName: 'My Product',
  productVersion: '1.0.0',
  // ... other options
});

const htmlReport = generateHTMLReport(vpatData);
```

## Understanding Results

### Conformance Levels

- **Supports**: No violations detected by automated testing
- **Does Not Support**: Violations detected by automated testing
- **Partially Supports**: Mixed results (future enhancement)
- **Not Applicable**: Feature not present in product (future enhancement)

### Important Notes

1. **Automated Testing Limitations**: This VPAT is generated from automated accessibility testing. Many WCAG criteria require manual testing and expert review.

2. **False Negatives**: Automated tools cannot detect all accessibility issues. A "Supports" rating means no automated violations were found, but manual testing may reveal issues.

3. **Compliance**: This VPAT should be reviewed by accessibility experts before use in procurement or compliance scenarios.

## WCAG 2.2 Coverage

The generator includes all WCAG 2.2 Level A and AA success criteria:

### New in WCAG 2.2
- 2.4.11 Focus Not Obscured (Minimum) - Level AA
- 2.5.7 Dragging Movements - Level AA
- 2.5.8 Target Size (Minimum) - Level AA
- 3.2.6 Consistent Help - Level A
- 3.3.7 Redundant Entry - Level A
- 3.3.8 Accessible Authentication (Minimum) - Level AA

## Integration with CI/CD

You can automatically generate VPATs in your CI/CD pipeline:

```yaml
# GitHub Actions example
- name: Run accessibility tests
  run: npm test

- name: Generate VPAT
  run: npm run vpat:html

- name: Upload VPAT artifact
  uses: actions/upload-artifact@v3
  with:
    name: vpat-report
    path: artifacts/vpat/
```

## Troubleshooting

### "Could not extract axe results" warnings

This means the HTML report doesn't have a corresponding JSON file. Run your tests again to generate fresh reports with JSON data:

```bash
npm test
npm run vpat:html
```

### Empty VPAT (all "Supports")

If all criteria show "Supports", this means:
1. No violations were detected (good!)
2. OR no accessibility reports were found in the directory

Verify reports exist: `ls artifacts/a11y-reports/`

## Resources

- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [VPAT Template (ITI)](https://www.itic.org/policy/accessibility/vpat)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
