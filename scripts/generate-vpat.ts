#!/usr/bin/env ts-node
import * as fs from 'fs';
import * as path from 'path';
import { AxeResults } from 'axe-core';

interface WCAGCriterion {
  num: string;
  level: 'A' | 'AA' | 'AAA';
  title: string;
  conformanceLevel: 'Supports' | 'Partially Supports' | 'Does Not Support' | 'Not Evaluated';
  remarks: string;
  violations: string[];
}

interface PageReport {
  pageName: string;
  url: string;
  violations: number;
  passes: number;
}

interface VPATData {
  productName: string;
  productVersion: string;
  reportDate: string;
  productDescription: string;
  contactInformation: string;
  evaluationMethods: string;
  pagesEvaluated: PageReport[];
  wcagCriteria: WCAGCriterion[];
}

// WCAG 2.2 Level A and AA Success Criteria
const WCAG_CRITERIA: Omit<WCAGCriterion, 'conformanceLevel' | 'remarks' | 'violations'>[] = [
  // Perceivable
  { num: '1.1.1', level: 'A', title: 'Non-text Content' },
  { num: '1.2.1', level: 'A', title: 'Audio-only and Video-only (Prerecorded)' },
  { num: '1.2.2', level: 'A', title: 'Captions (Prerecorded)' },
  { num: '1.2.3', level: 'A', title: 'Audio Description or Media Alternative (Prerecorded)' },
  { num: '1.2.4', level: 'AA', title: 'Captions (Live)' },
  { num: '1.2.5', level: 'AA', title: 'Audio Description (Prerecorded)' },
  { num: '1.3.1', level: 'A', title: 'Info and Relationships' },
  { num: '1.3.2', level: 'A', title: 'Meaningful Sequence' },
  { num: '1.3.3', level: 'A', title: 'Sensory Characteristics' },
  { num: '1.3.4', level: 'AA', title: 'Orientation' },
  { num: '1.3.5', level: 'AA', title: 'Identify Input Purpose' },
  { num: '1.4.1', level: 'A', title: 'Use of Color' },
  { num: '1.4.2', level: 'A', title: 'Audio Control' },
  { num: '1.4.3', level: 'AA', title: 'Contrast (Minimum)' },
  { num: '1.4.4', level: 'AA', title: 'Resize Text' },
  { num: '1.4.5', level: 'AA', title: 'Images of Text' },
  { num: '1.4.10', level: 'AA', title: 'Reflow' },
  { num: '1.4.11', level: 'AA', title: 'Non-text Contrast' },
  { num: '1.4.12', level: 'AA', title: 'Text Spacing' },
  { num: '1.4.13', level: 'AA', title: 'Content on Hover or Focus' },

  // Operable
  { num: '2.1.1', level: 'A', title: 'Keyboard' },
  { num: '2.1.2', level: 'A', title: 'No Keyboard Trap' },
  { num: '2.1.4', level: 'A', title: 'Character Key Shortcuts' },
  { num: '2.2.1', level: 'A', title: 'Timing Adjustable' },
  { num: '2.2.2', level: 'A', title: 'Pause, Stop, Hide' },
  { num: '2.3.1', level: 'A', title: 'Three Flashes or Below Threshold' },
  { num: '2.4.1', level: 'A', title: 'Bypass Blocks' },
  { num: '2.4.2', level: 'A', title: 'Page Titled' },
  { num: '2.4.3', level: 'A', title: 'Focus Order' },
  { num: '2.4.4', level: 'A', title: 'Link Purpose (In Context)' },
  { num: '2.4.5', level: 'AA', title: 'Multiple Ways' },
  { num: '2.4.6', level: 'AA', title: 'Headings and Labels' },
  { num: '2.4.7', level: 'AA', title: 'Focus Visible' },
  { num: '2.4.11', level: 'AA', title: 'Focus Not Obscured (Minimum)' }, // WCAG 2.2 new
  { num: '2.5.1', level: 'A', title: 'Pointer Gestures' },
  { num: '2.5.2', level: 'A', title: 'Pointer Cancellation' },
  { num: '2.5.3', level: 'A', title: 'Label in Name' },
  { num: '2.5.4', level: 'A', title: 'Motion Actuation' },
  { num: '2.5.7', level: 'AA', title: 'Dragging Movements' }, // WCAG 2.2 new
  { num: '2.5.8', level: 'AA', title: 'Target Size (Minimum)' }, // WCAG 2.2 new

  // Understandable
  { num: '3.1.1', level: 'A', title: 'Language of Page' },
  { num: '3.1.2', level: 'AA', title: 'Language of Parts' },
  { num: '3.2.1', level: 'A', title: 'On Focus' },
  { num: '3.2.2', level: 'A', title: 'On Input' },
  { num: '3.2.3', level: 'AA', title: 'Consistent Navigation' },
  { num: '3.2.4', level: 'AA', title: 'Consistent Identification' },
  { num: '3.2.6', level: 'A', title: 'Consistent Help' }, // WCAG 2.2 new
  { num: '3.3.1', level: 'A', title: 'Error Identification' },
  { num: '3.3.2', level: 'A', title: 'Labels or Instructions' },
  { num: '3.3.3', level: 'AA', title: 'Error Suggestion' },
  { num: '3.3.4', level: 'AA', title: 'Error Prevention (Legal, Financial, Data)' },
  { num: '3.3.7', level: 'A', title: 'Redundant Entry' }, // WCAG 2.2 new
  { num: '3.3.8', level: 'AA', title: 'Accessible Authentication (Minimum)' }, // WCAG 2.2 new

  // Robust
  { num: '4.1.1', level: 'A', title: 'Parsing' },
  { num: '4.1.2', level: 'A', title: 'Name, Role, Value' },
  { num: '4.1.3', level: 'AA', title: 'Status Messages' },
];

/**
 * Maps axe-core WCAG tags to WCAG criterion numbers
 * e.g., 'wcag244' -> '2.4.4', 'wcag111' -> '1.1.1'
 */
function parseWCAGTag(tag: string): string | null {
  const match = tag.match(/^wcag(\d)(\d)(\d+)$/);
  if (match) {
    return `${match[1]}.${match[2]}.${match[3]}`;
  }
  return null;
}

/**
 * Aggregates all accessibility reports and maps violations to WCAG criteria
 */
function aggregateReports(reportsDir: string): {
  criteriaMap: Map<string, string[]>;
  pages: PageReport[];
} {
  const criteriaMap = new Map<string, string[]>();
  const pages: PageReport[] = [];

  if (!fs.existsSync(reportsDir)) {
    console.warn(`Reports directory not found: ${reportsDir}`);
    return { criteriaMap, pages };
  }

  // Find all report directories
  const reportDirs = fs.readdirSync(reportsDir)
    .filter(name => {
      const fullPath = path.join(reportsDir, name);
      return fs.statSync(fullPath).isDirectory();
    });

  // Process each report
  for (const reportDir of reportDirs) {
    // Try JSON first (preferred), fall back to HTML parsing
    let reportPath = path.join(reportsDir, reportDir, 'index.json');
    let results: AxeResults | null = null;

    if (fs.existsSync(reportPath)) {
      try {
        const jsonContent = fs.readFileSync(reportPath, 'utf-8');
        results = JSON.parse(jsonContent);
      } catch (error) {
        console.warn(`Error reading JSON report ${reportPath}:`, error);
      }
    }

    // Fall back to HTML if JSON doesn't exist
    if (!results) {
      reportPath = path.join(reportsDir, reportDir, 'index.html');
      if (!fs.existsSync(reportPath)) {
        continue;
      }

      try {
        const html = fs.readFileSync(reportPath, 'utf-8');
        const match = html.match(/window\.axeResults\s*=\s*({.*?});/s);
        if (!match) {
          console.warn(`Could not extract axe results from ${reportPath}`);
          continue;
        }
        results = JSON.parse(match[1]);
      } catch (error) {
        console.warn(`Error processing ${reportPath}:`, error);
        continue;
      }
    }

    if (results) {
      try {
        // Track page information
        pages.push({
          pageName: reportDir,
          url: results.url || 'Unknown',
          violations: results.violations.length,
          passes: results.passes.length,
        });

        // Process violations
        for (const violation of results.violations) {
          const wcagTags = violation.tags
            .filter(tag => tag.startsWith('wcag'))
            .map(parseWCAGTag)
            .filter((tag): tag is string => tag !== null);

          for (const criterionNum of wcagTags) {
            if (!criteriaMap.has(criterionNum)) {
              criteriaMap.set(criterionNum, []);
            }

            const violationDesc = `[${reportDir}] ${violation.id}: ${violation.description} (Impact: ${violation.impact}, ${violation.nodes.length} instance(s))`;
            criteriaMap.get(criterionNum)!.push(violationDesc);
          }
        }
      } catch (error) {
        console.warn(`Error processing violations from ${reportDir}:`, error);
      }
    }
  }

  return { criteriaMap, pages };
}

// Map of which WCAG criteria can be reliably tested by axe-core
// Criteria not in this map require manual testing
const AUTOMATED_TESTABLE_CRITERIA = new Set([
  '1.1.1', // Non-text Content (partial - can detect missing alt, not quality)
  '1.3.1', // Info and Relationships
  '1.3.2', // Meaningful Sequence
  '1.4.3', // Contrast (Minimum)
  '1.4.4', // Resize Text
  '2.1.1', // Keyboard (partial)
  '2.1.2', // No Keyboard Trap (partial)
  '2.4.1', // Bypass Blocks
  '2.4.2', // Page Titled
  '2.4.3', // Focus Order (partial)
  '2.4.4', // Link Purpose (In Context) (partial)
  '2.4.6', // Headings and Labels
  '2.4.7', // Focus Visible
  '3.1.1', // Language of Page
  '3.1.2', // Language of Parts
  '3.3.1', // Error Identification (partial)
  '3.3.2', // Labels or Instructions
  '4.1.1', // Parsing
  '4.1.2', // Name, Role, Value
  '4.1.3', // Status Messages (partial)
  '1.4.11', // Non-text Contrast
  '1.4.12', // Text Spacing (partial)
  '2.4.11', // Focus Not Obscured (partial)
  '2.5.3', // Label in Name
  '2.5.8', // Target Size (partial)
]);

/**
 * Generates VPAT data from accessibility reports
 */
function generateVPATData(
  reportsDir: string,
  productInfo: Partial<VPATData> = {},
): VPATData {
  const { criteriaMap: violationMap, pages } = aggregateReports(reportsDir);

  const wcagCriteria: WCAGCriterion[] = WCAG_CRITERIA.map(criterion => {
    const violations = violationMap.get(criterion.num) || [];
    const canAutoTest = AUTOMATED_TESTABLE_CRITERIA.has(criterion.num);

    let conformanceLevel: WCAGCriterion['conformanceLevel'];
    let remarks: string;

    if (violations.length > 0) {
      conformanceLevel = 'Does Not Support';
      remarks = `Automated testing detected ${violations.length} violation(s). Manual review required to verify full compliance once issues are resolved.`;
    } else if (canAutoTest) {
      conformanceLevel = 'Supports';
      remarks = 'No violations detected in automated testing. Note: Automated tools can only partially evaluate this criterion; manual testing recommended for complete verification.';
    } else {
      conformanceLevel = 'Not Evaluated';
      remarks = 'Not evaluated. This criterion cannot be reliably tested through automation and requires manual accessibility testing and expert review.';
    }

    return {
      ...criterion,
      conformanceLevel,
      remarks,
      violations,
    };
  });

  return {
    productName: productInfo.productName || 'Open edX Platform',
    productVersion: productInfo.productVersion || '1.0.0',
    reportDate: productInfo.reportDate || new Date().toISOString().split('T')[0],
    productDescription: productInfo.productDescription || 'Open edX E-Learning Platform',
    contactInformation: productInfo.contactInformation || 'accessibility@example.com',
    evaluationMethods: productInfo.evaluationMethods || 'Automated testing using axe-core and Playwright',
    pagesEvaluated: pages,
    wcagCriteria,
  };
}

/**
 * Generates HTML VPAT report
 */
function generateHTMLReport(data: VPATData): string {
  const levelACriteria = data.wcagCriteria.filter(c => c.level === 'A');
  const levelAACriteria = data.wcagCriteria.filter(c => c.level === 'AA');

  const totalViolations = data.wcagCriteria.reduce((sum, c) => sum + c.violations.length, 0);
  const supportedCount = data.wcagCriteria.filter(c => c.conformanceLevel === 'Supports').length;
  const notSupportedCount = data.wcagCriteria.filter(c => c.conformanceLevel === 'Does Not Support').length;
  const notEvaluatedCount = data.wcagCriteria.filter(c => c.conformanceLevel === 'Not Evaluated').length;

  const renderCriteriaTable = (criteria: WCAGCriterion[]) => criteria.map(c => {
    let statusClass = 'status-fail';
    if (c.conformanceLevel === 'Supports') statusClass = 'status-pass';
    else if (c.conformanceLevel === 'Not Evaluated') statusClass = 'status-neutral';
    const violationsList = c.violations.length > 0
      ? `<ul class="violation-list">${c.violations.map(v => `<li>${v}</li>`).join('')}</ul>`
      : '';

    return `
      <tr class="${statusClass}">
        <td><strong>${c.num}</strong></td>
        <td>${c.title}</td>
        <td><span class="badge ${c.conformanceLevel.toLowerCase().replace(/\s+/g, '-')}">${c.conformanceLevel}</span></td>
        <td>
          ${c.remarks}
          ${violationsList}
        </td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VPAT® - ${data.productName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 {
      color: #2c3e50;
      border-bottom: 4px solid #3498db;
      padding-bottom: 10px;
      font-size: 2em;
    }
    h2 {
      color: #34495e;
      margin-top: 40px;
      border-bottom: 2px solid #ecf0f1;
      padding-bottom: 8px;
    }
    h3 {
      color: #7f8c8d;
      margin-top: 30px;
    }
    .meta-info {
      background: #ecf0f1;
      padding: 20px;
      border-radius: 6px;
      margin: 20px 0;
    }
    .meta-info p {
      margin: 8px 0;
    }
    .meta-info strong {
      color: #2c3e50;
      display: inline-block;
      min-width: 180px;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 30px 0;
    }
    .summary-card {
      padding: 20px;
      border-radius: 6px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .summary-card.supports { background: #d4edda; border-left: 4px solid #28a745; }
    .summary-card.not-supported { background: #f8d7da; border-left: 4px solid #dc3545; }
    .summary-card.not-evaluated { background: #fff3cd; border-left: 4px solid #ffc107; }
    .summary-card.total { background: #d1ecf1; border-left: 4px solid #17a2b8; }
    .summary-card h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
      color: #495057;
      border: none;
    }
    .summary-card .count {
      font-size: 36px;
      font-weight: bold;
      color: #212529;
    }
    .summary-card small {
      display: block;
      margin-top: 5px;
      font-size: 11px;
      color: #6c757d;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    th {
      background: #3498db;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #ecf0f1;
      vertical-align: top;
    }
    tr.status-pass {
      background: #f8f9fa;
    }
    tr.status-fail {
      background: #fff5f5;
    }
    tr.status-neutral {
      background: #fffbf0;
    }
    tr:hover {
      background: #f1f3f5;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .badge.supports {
      background: #28a745;
      color: white;
    }
    .badge.does-not-support {
      background: #dc3545;
      color: white;
    }
    .badge.partially-supports {
      background: #ffc107;
      color: #212529;
    }
    .badge.not-evaluated {
      background: #6c757d;
      color: white;
    }
    .violation-list {
      margin: 10px 0 0 0;
      padding-left: 20px;
      font-size: 0.9em;
      color: #dc3545;
    }
    .violation-list li {
      margin: 5px 0;
    }
    .note {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
    }
    .note strong {
      color: #856404;
    }
    @media print {
      body { background: white; }
      .container { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Voluntary Product Accessibility Template® (VPAT®)</h1>
    <p><strong>WCAG Edition</strong> | Version 2.5 | Based on WCAG 2.2</p>

    <div class="meta-info">
      <p><strong>Product Name:</strong> ${data.productName}</p>
      <p><strong>Product Version:</strong> ${data.productVersion}</p>
      <p><strong>Report Date:</strong> ${data.reportDate}</p>
      <p><strong>Product Description:</strong> ${data.productDescription}</p>
      <p><strong>Contact Information:</strong> ${data.contactInformation}</p>
      <p><strong>Evaluation Methods:</strong> ${data.evaluationMethods}</p>
    </div>

    <div class="note">
      <strong>Note:</strong> This VPAT was automatically generated from automated accessibility testing results.
      Manual testing and expert review are recommended for a complete accessibility assessment. Some success criteria
      cannot be fully evaluated through automated testing alone.
    </div>

    <h2>Pages Evaluated</h2>
    ${data.pagesEvaluated.length > 0 ? `
    <p>The following pages were tested during this accessibility evaluation:</p>
    <table>
      <thead>
        <tr>
          <th>Page/Section</th>
          <th>URL</th>
          <th>Violations</th>
          <th>Passes</th>
        </tr>
      </thead>
      <tbody>
        ${data.pagesEvaluated.map(page => `
        <tr>
          <td><code>${page.pageName}</code></td>
          <td><a href="${page.url}" target="_blank">${page.url}</a></td>
          <td class="${page.violations > 0 ? 'status-fail' : 'status-pass'}">${page.violations}</td>
          <td class="status-pass">${page.passes}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    ` : `
    <div class="note">
      <strong>No page data available.</strong> Page-level details require JSON accessibility reports.
      Run your tests again to generate fresh reports with page information, or manually document tested pages below:
      <ul style="margin-top: 10px;">
        <li>Page 1: [Description and URL]</li>
        <li>Page 2: [Description and URL]</li>
      </ul>
    </div>
    `}

    <h2>Summary</h2>
    <div class="summary">
      <div class="summary-card total">
        <h3>Total Criteria</h3>
        <div class="count">${data.wcagCriteria.length}</div>
      </div>
      <div class="summary-card supports">
        <h3>Supports</h3>
        <div class="count">${supportedCount}</div>
        <small>Tested by automation</small>
      </div>
      <div class="summary-card not-supported">
        <h3>Does Not Support</h3>
        <div class="count">${notSupportedCount}</div>
        <small>Violations found</small>
      </div>
      <div class="summary-card not-evaluated">
        <h3>Not Evaluated</h3>
        <div class="count">${notEvaluatedCount}</div>
        <small>Requires manual testing</small>
      </div>
      <div class="summary-card not-supported">
        <h3>Total Violations</h3>
        <div class="count">${totalViolations}</div>
        <small>Automated detections</small>
      </div>
    </div>

    <h2>WCAG 2.2 Level A Conformance</h2>
    <table>
      <thead>
        <tr>
          <th style="width: 10%">Criterion</th>
          <th style="width: 25%">Success Criterion</th>
          <th style="width: 15%">Conformance Level</th>
          <th style="width: 50%">Remarks and Explanations</th>
        </tr>
      </thead>
      <tbody>
        ${renderCriteriaTable(levelACriteria)}
      </tbody>
    </table>

    <h2>WCAG 2.2 Level AA Conformance</h2>
    <table>
      <thead>
        <tr>
          <th style="width: 10%">Criterion</th>
          <th style="width: 25%">Success Criterion</th>
          <th style="width: 15%">Conformance Level</th>
          <th style="width: 50%">Remarks and Explanations</th>
        </tr>
      </thead>
      <tbody>
        ${renderCriteriaTable(levelAACriteria)}
      </tbody>
    </table>

    <h2>Legal Disclaimer</h2>
    <p>This document is provided for information purposes only and the contents hereof are subject to change without notice.
    This document is not warranted to be error-free, nor subject to any other warranties or conditions. This document is
    an Accessibility Conformance Report based on automated testing results and may not reflect the actual accessibility of
    the product without additional manual testing and review.</p>

    <p style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #ecf0f1; color: #7f8c8d; font-size: 0.9em;">
      Generated on ${new Date().toLocaleString()} | VPAT® is a registered trademark of the Information Technology Industry Council (ITI)
    </p>
  </div>
</body>
</html>`;
}

/**
 * Generates Markdown VPAT report
 */
function generateMarkdownReport(data: VPATData): string {
  const renderCriteriaTable = (criteria: WCAGCriterion[]) => {
    const rows = criteria.map(c => {
      const violations = c.violations.length > 0
        ? `\n${c.violations.map(v => `    - ${v}`).join('\n')}`
        : '';
      return `| ${c.num} | ${c.title} | ${c.conformanceLevel} | ${c.remarks}${violations} |`;
    }).join('\n');

    return `| Criterion | Success Criterion | Conformance Level | Remarks |\n|-----------|-------------------|-------------------|----------|\n${rows}`;
  };

  const supportedCount = data.wcagCriteria.filter(c => c.conformanceLevel === 'Supports').length;
  const notSupportedCount = data.wcagCriteria.filter(c => c.conformanceLevel === 'Does Not Support').length;
  const notEvaluatedCount = data.wcagCriteria.filter(c => c.conformanceLevel === 'Not Evaluated').length;
  const totalViolations = data.wcagCriteria.reduce((sum, c) => sum + c.violations.length, 0);

  return `# VPAT® (Voluntary Product Accessibility Template)

**WCAG Edition | Version 2.5 | Based on WCAG 2.2**

## Product Information

- **Product Name:** ${data.productName}
- **Product Version:** ${data.productVersion}
- **Report Date:** ${data.reportDate}
- **Product Description:** ${data.productDescription}
- **Contact Information:** ${data.contactInformation}
- **Evaluation Methods:** ${data.evaluationMethods}

---

> **Note:** This VPAT was automatically generated from automated accessibility testing results.
> Manual testing and expert review are recommended for a complete accessibility assessment. Some success criteria
> cannot be fully evaluated through automated testing alone.

---

## Pages Evaluated

The following pages were tested during this accessibility evaluation:

| Page/Section | URL | Violations | Passes |
|--------------|-----|------------|--------|
${data.pagesEvaluated.map(page => `| ${page.pageName} | ${page.url} | ${page.violations} | ${page.passes} |`).join('\n')}

---

## Summary

- **Total Criteria Evaluated:** ${data.wcagCriteria.length}
- **Supports:** ${supportedCount} (tested by automation)
- **Does Not Support:** ${notSupportedCount} (violations found)
- **Not Evaluated:** ${notEvaluatedCount} (requires manual testing)
- **Total Violations Detected:** ${totalViolations}

---

## WCAG 2.2 Level A Conformance

${renderCriteriaTable(data.wcagCriteria.filter(c => c.level === 'A'))}

---

## WCAG 2.2 Level AA Conformance

${renderCriteriaTable(data.wcagCriteria.filter(c => c.level === 'AA'))}

---

## Legal Disclaimer

This document is provided for information purposes only and the contents hereof are subject to change without notice.
This document is not warranted to be error-free, nor subject to any other warranties or conditions. This document is
an Accessibility Conformance Report based on automated testing results and may not reflect the actual accessibility of
the product without additional manual testing and review.

---

*Generated on ${new Date().toLocaleString()}*
*VPAT® is a registered trademark of the Information Technology Industry Council (ITI)*
`;
}

/**
 * Generates RST VPAT report
 */
function generateRSTReport(data: VPATData): string {
  const renderCriteriaTable = (criteria: WCAGCriterion[], level: string) => {
    const header = `.. list-table:: WCAG 2.2 Level ${level} Conformance
   :header-rows: 1
   :widths: 10 25 15 50

   * - Criterion
     - Success Criterion
     - Conformance Level
     - Remarks and Explanations`;

    const rows = criteria.map(c => {
      const violations = c.violations.length > 0
        ? `\n\n       ${c.violations.map(v => `- ${v}`).join('\n       ')}`
        : '';
      return `   * - **${c.num}**
     - ${c.title}
     - ${c.conformanceLevel}
     - ${c.remarks}${violations}`;
    }).join('\n');

    return `${header}\n${rows}`;
  };

  const supportedCount = data.wcagCriteria.filter(c => c.conformanceLevel === 'Supports').length;
  const notSupportedCount = data.wcagCriteria.filter(c => c.conformanceLevel === 'Does Not Support').length;
  const notEvaluatedCount = data.wcagCriteria.filter(c => c.conformanceLevel === 'Not Evaluated').length;
  const totalViolations = data.wcagCriteria.reduce((sum, c) => sum + c.violations.length, 0);

  const pagesTable = data.pagesEvaluated.length > 0 ? `
.. list-table:: Pages Evaluated
   :header-rows: 1
   :widths: 30 40 15 15

   * - Page/Section
     - URL
     - Violations
     - Passes
${data.pagesEvaluated.map(page => `   * - \`\`${page.pageName}\`\`
     - ${page.url}
     - ${page.violations}
     - ${page.passes}`).join('\n')}
` : `
.. note::
   **No page data available.** Page-level details require JSON accessibility reports.
   Run your tests again to generate fresh reports with page information.
`;

  return `==================================================================
VPAT® (Voluntary Product Accessibility Template)
==================================================================

**WCAG Edition | Version 2.5 | Based on WCAG 2.2**

Product Information
===================

:Product Name: ${data.productName}
:Product Version: ${data.productVersion}
:Report Date: ${data.reportDate}
:Product Description: ${data.productDescription}
:Contact Information: ${data.contactInformation}
:Evaluation Methods: ${data.evaluationMethods}

----

.. important::
   This VPAT was automatically generated from automated accessibility testing results.
   Manual testing and expert review are recommended for a complete accessibility assessment.
   Some success criteria cannot be fully evaluated through automated testing alone.

----

Pages Evaluated
===============

${pagesTable}

----

Summary
=======

- **Total Criteria Evaluated:** ${data.wcagCriteria.length}
- **Supports:** ${supportedCount} (tested by automation)
- **Does Not Support:** ${notSupportedCount} (violations found)
- **Not Evaluated:** ${notEvaluatedCount} (requires manual testing)
- **Total Violations Detected:** ${totalViolations}

----

${renderCriteriaTable(data.wcagCriteria.filter(c => c.level === 'A'), 'A')}

----

${renderCriteriaTable(data.wcagCriteria.filter(c => c.level === 'AA'), 'AA')}

----

Legal Disclaimer
================

This document is provided for information purposes only and the contents hereof are subject to change without notice.
This document is not warranted to be error-free, nor subject to any other warranties or conditions. This document is
an Accessibility Conformance Report based on automated testing results and may not reflect the actual accessibility of
the product without additional manual testing and review.

----

*Generated on ${new Date().toLocaleString()}*

*VPAT® is a registered trademark of the Information Technology Industry Council (ITI)*
`;
}

/**
 * Load VPAT configuration from config file
 */
function loadVPATConfig(): Partial<VPATData> {
  const configPath = path.join(process.cwd(), 'vpat.config.json');

  try {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      console.log('✓ Loaded VPAT configuration from vpat.config.json');
      return config;
    }
    console.warn('⚠ No vpat.config.json found - using defaults');
  } catch (error) {
    console.warn('⚠ Error reading vpat.config.json:', error);
  }

  return {};
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const reportsDir = args[0] || 'artifacts/a11y-reports';
  const outputFormat = args[1] || 'html'; // html or markdown
  const outputPath = args[2] || `artifacts/vpat/vpat-${Date.now()}.${outputFormat}`;

  console.log(`Generating VPAT from reports in: ${reportsDir}`);
  console.log(`Output format: ${outputFormat}`);
  console.log(`Output path: ${outputPath}`);

  // Load config (environment variables override config file)
  const config = loadVPATConfig();

  // Generate VPAT data
  const vpatData = generateVPATData(reportsDir, {
    productName: process.env.VPAT_PRODUCT_NAME || config.productName,
    productVersion: process.env.VPAT_PRODUCT_VERSION || config.productVersion,
    productDescription: process.env.VPAT_PRODUCT_DESCRIPTION || config.productDescription,
    contactInformation: process.env.VPAT_CONTACT_INFO || config.contactInformation,
    evaluationMethods: process.env.VPAT_EVALUATION_METHODS || config.evaluationMethods,
  });

  // Generate report
  let content: string;
  if (outputFormat === 'markdown' || outputFormat === 'md') {
    content = generateMarkdownReport(vpatData);
  } else if (outputFormat === 'rst') {
    content = generateRSTReport(vpatData);
  } else {
    content = generateHTMLReport(vpatData);
  }

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write report
  fs.writeFileSync(outputPath, content, 'utf-8');
  console.log(`\n✅ VPAT generated successfully: ${outputPath}`);
  console.log('\nSummary:');
  console.log(`  - Total Criteria: ${vpatData.wcagCriteria.length}`);
  console.log(`  - Supports: ${vpatData.wcagCriteria.filter(c => c.conformanceLevel === 'Supports').length}`);
  console.log(`  - Does Not Support: ${vpatData.wcagCriteria.filter(c => c.conformanceLevel === 'Does Not Support').length}`);
  console.log(`  - Total Violations: ${vpatData.wcagCriteria.reduce((sum, c) => sum + c.violations.length, 0)}`);
}

if (require.main === module) {
  main();
}

export {
  generateVPATData,
  generateHTMLReport,
  generateMarkdownReport,
  generateRSTReport,
  type VPATData,
  type WCAGCriterion,
};
