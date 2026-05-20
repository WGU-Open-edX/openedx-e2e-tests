# VPAT Setup Guide

Quick guide to generate your first VPAT (Voluntary Product Accessibility Template).

## Step 1: Copy Config Template

```bash
cp vpat.config.example.json vpat.config.json
```

## Step 2: Edit Your Product Info

Edit `vpat.config.json`:

```json
{
  "productName": "Your Open edX Platform Name",
  "productVersion": "Redwood.1",
  "productDescription": "Your platform description",
  "contactInformation": "accessibility@yourorg.edu"
}
```

## Step 3: Run Accessibility Tests

```bash
npm test
```

This will generate accessibility reports in `artifacts/a11y-reports/`.

## Step 4: Generate VPAT

```bash
npm run vpat:html
```

Your VPAT will be in `artifacts/vpat/`.

## What's in the VPAT?

- ✅ **25 criteria automatically tested** - Shows "Supports" with no violations
- ⚠️ **31 criteria marked "Not Evaluated"** - Requires manual testing
- 📊 **All pages tested** with URLs and violation counts
- 📝 **Detailed violation descriptions** mapped to WCAG criteria

## Next Steps

- Review the VPAT with your accessibility team
- Conduct manual testing for "Not Evaluated" criteria
- Update the VPAT with manual test results before submission

See [full documentation](docs/vpat-generation.md) for advanced options.
