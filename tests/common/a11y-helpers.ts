import { Page, TestInfo } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createHtmlReport } from 'axe-html-reporter';
import { AxeResults } from 'axe-core';
import * as fs from 'fs';
import * as path from 'path';

export interface A11yCheckOptions {
  /**
   * Disable specific accessibility rules
   */
  disabledRules?: string[];

  /**
   * Only run specific accessibility rules
   */
  enabledRules?: string[];

  /**
   * Exclude specific elements from accessibility checks
   */
  exclude?: string[];

  /**
   * If true, logs violations to console instead of throwing an error
   */
  warnOnly?: boolean;

  /**
   * Generate an accessibility report
   * - true: generates HTML report with auto-generated path based on test name
   * - string: saves report to specified path (.html or .json based on extension)
   */
  report?: boolean | string;

  /**
   * Base directory for reports when using report: true
   * Defaults to 'artifacts/a11y-reports'
   */
  reportDir?: string;

  /**
   * Report format when using report: true
   * Defaults to 'html'
   */
  reportFormat?: 'html' | 'json';

  /**
   * Optional name suffix for the report to distinguish multiple reports in same test
   * e.g., 'login-page', 'dashboard'
   */
  reportName?: string;
}

/**
 * Runs accessibility checks on the current page using axe-core
 * @param page - Playwright page object
 * @param options - Configuration options for the accessibility check
 * @returns Axe accessibility scan results
 */
export async function checkA11y(page: Page, options: A11yCheckOptions = {}) {
  let axeBuilder = new AxeBuilder({ page });

  if (options.disabledRules && options.disabledRules.length > 0) {
    axeBuilder = axeBuilder.disableRules(options.disabledRules);
  }

  if (options.enabledRules && options.enabledRules.length > 0) {
    axeBuilder = axeBuilder.withRules(options.enabledRules);
  }

  if (options.exclude && options.exclude.length > 0) {
    options.exclude.forEach(selector => {
      axeBuilder = axeBuilder.exclude(selector);
    });
  }

  return await axeBuilder.analyze();
}

/**
 * Captures screenshots of violations with highlighting
 */
async function captureViolationScreenshots(
  page: Page,
  results: AxeResults,
  screenshotDir: string
): Promise<Map<string, string[]>> {
  const screenshotMap = new Map<string, string[]>();

  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  // Add highlight styles
  await page.addStyleTag({
    content: `
      .a11y-violation-highlight {
        outline: 3px solid #dc3545 !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 10px rgba(220, 53, 69, 0.5) !important;
      }
    `
  });

  for (let i = 0; i < results.violations.length; i++) {
    const violation = results.violations[i];
    const screenshots: string[] = [];

    for (let j = 0; j < violation.nodes.length; j++) {
      const node = violation.nodes[j];
      const target = node.target[0];

      // Convert target to string selector (handle shadow DOM selectors)
      const selector = typeof target === 'string' ? target : target.join(' ');

      try {
        // Check if element exists
        const element = page.locator(selector);
        const count = await element.count();

        if (count === 0) continue;

        // Highlight the element
        await element.evaluate((el: Element) => {
          el.classList.add('a11y-violation-highlight');
        });

        await page.waitForTimeout(200);

        // Take screenshot
        const screenshotName = `violation-${i + 1}-element-${j + 1}.png`;
        const screenshotPath = path.join(screenshotDir, screenshotName);

        const elementBox = await element.boundingBox();
        if (elementBox) {
          const padding = 20;
          const viewport = page.viewportSize();
          if (viewport) {
            await page.screenshot({
              path: screenshotPath,
              clip: {
                x: Math.max(0, elementBox.x - padding),
                y: Math.max(0, elementBox.y - padding),
                width: Math.min(
                  viewport.width - Math.max(0, elementBox.x - padding),
                  elementBox.width + 2 * padding
                ),
                height: Math.min(
                  viewport.height - Math.max(0, elementBox.y - padding),
                  elementBox.height + 2 * padding
                )
              }
            });
            screenshots.push(screenshotName);
          }
        }

        // Remove highlight
        await element.evaluate((el: Element) => {
          el.classList.remove('a11y-violation-highlight');
        });
      } catch (error) {
        console.warn(`Could not capture screenshot for ${selector}:`, error);
      }
    }

    if (screenshots.length > 0) {
      screenshotMap.set(violation.id + '-' + i, screenshots);
    }
  }

  return screenshotMap;
}

/**
 * Adds screenshot section to axe HTML report
 */
function addScreenshotsToReport(
  reportHtml: string,
  screenshotMap: Map<string, string[]>
): string {
  if (screenshotMap.size === 0) return reportHtml;

  // Add custom styles for screenshots
  const screenshotStyles = `
    <style>
      .violation-screenshot {
        max-width: 200px;
        width: 100%;
        height: auto;
        border: 2px solid #dc3545;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        display: block;
        margin: 5px 0;
      }
      .violation-screenshot:hover {
        border-color: #c82333;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      }
      .screenshot-cell {
        text-align: center;
        vertical-align: middle;
      }
    </style>
  `;

  // Inject styles before closing head tag
  reportHtml = reportHtml.replace('</head>', `${screenshotStyles}</head>`);

  // Add screenshot column header to each violation table
  reportHtml = reportHtml.replace(
    /<th style="width: 49%">Issue Description<\/th>\s*<th style="width: 49%">\s*To solve this violation, you need to\.\.\.\s*<\/th>/g,
    `<th style="width: 30%">Issue Description</th>
                                    <th style="width: 30%">
                                        To solve this violation, you need to...
                                    </th>
                                    <th style="width: 20%">Screenshot</th>`
  );

  // Add screenshots to each violation node table row
  screenshotMap.forEach((screenshots, key) => {
    const violationIndex = parseInt(key.split('-').pop() || '0'); // Extract violation index from end of key
    const violationId = violationIndex + 1; // IDs start at 1

    // Find the violation card
    const anchorPattern = `<a id="${violationId}">${violationId}.</a>`;
    const anchorIdx = reportHtml.indexOf(anchorPattern);

    if (anchorIdx === -1) return;

    // Find the tbody within this violation card
    const tbodyStart = reportHtml.indexOf('<tbody>', anchorIdx);
    if (tbodyStart === -1) return;

    const tbodyEnd = reportHtml.indexOf('</tbody>', tbodyStart);
    if (tbodyEnd === -1) return;

    const tbodyContent = reportHtml.substring(tbodyStart, tbodyEnd);

    // Find all <tr> elements and add screenshot cell to each
    let modifiedTbody = tbodyContent;
    screenshots.forEach((screenshot, nodeIndex) => {
      // Find the nth row (nodeIndex + 1 because we skip the first match)
      const rowPattern = new RegExp(`(<tr>.*?)(</tr>)`, 'gs');
      let matches = [...tbodyContent.matchAll(rowPattern)];

      if (matches[nodeIndex]) {
        const rowContent = matches[nodeIndex][0];
        const screenshotCell = `
                                    <td class="screenshot-cell">
                                        <img src="${screenshot}"
                                             alt="Violation screenshot"
                                             class="violation-screenshot"
                                             title="Click to open full size"
                                             onclick="window.open(this.src)" />
                                    </td>`;

        const modifiedRow = rowContent.replace('</tr>', `${screenshotCell}\n                                </tr>`);
        modifiedTbody = modifiedTbody.replace(rowContent, modifiedRow);
      }
    });

    // Replace the tbody content
    reportHtml = reportHtml.substring(0, tbodyStart) + modifiedTbody + reportHtml.substring(tbodyEnd);
  });

  return reportHtml;
}

/**
 * Saves the accessibility report to a file
 */
async function saveReport(
  page: Page,
  results: AxeResults,
  reportPath: string,
  pageUrl: string
): Promise<void> {
  const dir = path.dirname(reportPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const ext = path.extname(reportPath).toLowerCase();

  if (ext === '.html') {
    // Use standard axe-html-reporter
    const reportName = path.basename(dir);
    let reportHtml = createHtmlReport({
      results,
      options: {
        projectKey: reportName,
        doNotCreateReportFile: true  // Prevent auto-creation of artifacts/index.html
      }
    });

    // Capture screenshots and add them to the report
    const screenshotMap = await captureViolationScreenshots(page, results, dir);
    reportHtml = addScreenshotsToReport(reportHtml, screenshotMap);

    fs.writeFileSync(reportPath, reportHtml, 'utf-8');
  } else {
    // Default to JSON
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf-8');
  }

  console.log(`Accessibility report saved to: ${reportPath}`);
}

/**
 * Generates a report path from test info
 */
function generateReportPath(testInfo: TestInfo | undefined, options: A11yCheckOptions): string {
  const baseDir = options.reportDir || 'artifacts/a11y-reports';
  const format = options.reportFormat || 'html';

  if (!testInfo) {
    const timestamp = Date.now();
    const reportFolder = options.reportName
      ? `report-${options.reportName}-${timestamp}`
      : `report-${timestamp}`;
    return path.join(baseDir, reportFolder, `index.${format}`);
  }

  // Get relative path from project root and clean it up
  const testFile = testInfo.file
    .replace(testInfo.project.testDir, '')
    .replace(/\.(spec|test)\.(ts|js)$/, '')
    .replace(/-temp$/, '')  // Remove -temp suffix from markdown tests
    .replace(/^\//, '')
    .replace(/\//g, '-');

  // Use reportName if provided, otherwise use test title
  let reportFolder: string;
  if (options.reportName) {
    // For multiple checks in same test, use: filename-reportName
    reportFolder = `${testFile}-${options.reportName}`;
  } else {
    // For single check, use: filename-testName
    const testName = testInfo.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    reportFolder = `${testFile}-${testName}`;
  }

  return path.join(baseDir, reportFolder, `index.${format}`);
}

/**
 * Updates the main index.html file with all reports
 */
function updateMainIndex(baseDir: string, reportPath: string, results: AxeResults, pageUrl: string, testInfo?: TestInfo): void {
  const indexPath = path.join(baseDir, 'index.html');
  const timestamp = new Date().toISOString();

  // Load existing reports
  let reports: any[] = [];
  if (fs.existsSync(indexPath)) {
    try {
      const existingHtml = fs.readFileSync(indexPath, 'utf-8');
      const match = existingHtml.match(/const reports = (\[.*?\]);/s);
      if (match) {
        reports = JSON.parse(match[1]);
      }
    } catch (e) {
      console.warn('Could not parse existing index, creating new one');
    }
  }

  // Get relative path from baseDir to report
  const relativePath = path.relative(baseDir, reportPath);
  const reportFolder = path.dirname(relativePath);

  // Add or update this report
  const existingIndex = reports.findIndex(r => r.path === relativePath);
  const reportData = {
    path: relativePath,
    folder: reportFolder,
    testName: testInfo?.title || 'Accessibility Test',
    testFile: testInfo?.file ? path.basename(testInfo.file) : 'Unknown',
    url: pageUrl,
    violations: results.violations.length,
    passes: results.passes.length,
    timestamp
  };

  if (existingIndex >= 0) {
    reports[existingIndex] = reportData;
  } else {
    reports.push(reportData);
  }

  // Sort by timestamp desc
  reports.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accessibility Test Reports</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1400px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { color: #333; border-bottom: 3px solid #007bff; padding-bottom: 10px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
    .summary-card { padding: 20px; border-radius: 4px; text-align: center; }
    .summary-card.total { background: #e3f2fd; border-left: 4px solid #2196f3; }
    .summary-card.violations { background: #ffebee; border-left: 4px solid #f44336; }
    .summary-card.passes { background: #e8f5e9; border-left: 4px solid #4caf50; }
    .summary-card h3 { margin: 0 0 10px 0; font-size: 14px; color: #666; }
    .summary-card .count { font-size: 36px; font-weight: bold; color: #333; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #007bff; color: white; padding: 12px; text-align: left; position: sticky; top: 0; }
    td { padding: 12px; border-bottom: 1px solid #ddd; }
    tr:hover { background: #f8f9fa; }
    .status-pass { color: #4caf50; font-weight: bold; }
    .status-fail { color: #f44336; font-weight: bold; }
    a { color: #007bff; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .timestamp { color: #666; font-size: 12px; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    .badge.pass { background: #4caf50; color: white; }
    .badge.fail { background: #f44336; color: white; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Accessibility Test Reports</h1>
    <div class="summary">
      <div class="summary-card total">
        <h3>Total Reports</h3>
        <div class="count" id="totalReports">0</div>
      </div>
      <div class="summary-card violations">
        <h3>Total Violations</h3>
        <div class="count" id="totalViolations">0</div>
      </div>
      <div class="summary-card passes">
        <h3>Total Passes</h3>
        <div class="count" id="totalPasses">0</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Test Name</th>
          <th>File</th>
          <th>Page URL</th>
          <th>Status</th>
          <th>Violations</th>
          <th>Passes</th>
          <th>Timestamp</th>
          <th>Report</th>
        </tr>
      </thead>
      <tbody id="reportList"></tbody>
    </table>
  </div>

  <script>
    const reports = ${JSON.stringify(reports, null, 2)};

    const totalReports = reports.length;
    const totalViolations = reports.reduce((sum, r) => sum + r.violations, 0);
    const totalPasses = reports.reduce((sum, r) => sum + r.passes, 0);

    document.getElementById('totalReports').textContent = totalReports;
    document.getElementById('totalViolations').textContent = totalViolations;
    document.getElementById('totalPasses').textContent = totalPasses;

    const tbody = document.getElementById('reportList');
    reports.forEach(report => {
      const row = document.createElement('tr');
      const status = report.violations === 0 ? 'pass' : 'fail';
      const statusText = report.violations === 0 ? 'PASS' : 'FAIL';
      const timestamp = new Date(report.timestamp).toLocaleString();

      row.innerHTML = \`
        <td><strong>\${report.testName}</strong></td>
        <td><code>\${report.testFile}</code></td>
        <td><a href="\${report.url}" target="_blank">\${report.url}</a></td>
        <td><span class="badge \${status}">\${statusText}</span></td>
        <td class="status-\${status}">\${report.violations}</td>
        <td class="status-pass">\${report.passes}</td>
        <td class="timestamp">\${timestamp}</td>
        <td><a href="\${report.path}" target="_blank">View Report →</a></td>
      \`;
      tbody.appendChild(row);
    });
  </script>
</body>
</html>`;

  fs.writeFileSync(indexPath, html, 'utf-8');
  console.log(`Main index updated: ${indexPath}`);
}

/**
 * Runs accessibility checks and throws an error if violations are found
 * @param page - Playwright page object
 * @param options - Configuration options for the accessibility check
 * @param testInfo - Playwright test info (optional, used for auto-generating report paths)
 */
export async function assertA11y(
  page: Page,
  options: A11yCheckOptions = {},
  testInfo?: TestInfo
) {
  const results = await checkA11y(page, options);

  // Save report if requested
  if (options.report) {
    let reportPath: string;
    const baseDir = options.reportDir || 'artifacts/a11y-reports';

    if (typeof options.report === 'string') {
      // Use provided path
      reportPath = options.report;
    } else {
      // Auto-generate path from test info
      reportPath = generateReportPath(testInfo, options);
    }

    await saveReport(page, results, reportPath, page.url());

    // Update main index
    updateMainIndex(baseDir, reportPath, results, page.url(), testInfo);
  }

  if (results.violations.length > 0) {
    const violationMessages = results.violations.map(violation => {
      const targets = violation.nodes.map(node => node.target.join(', ')).join('\n    ');
      return `  - ${violation.id} (${violation.impact}): ${violation.description}\n    Affected elements:\n    ${targets}`;
    });

    const message =
      `Accessibility violations found:\n${violationMessages.join('\n\n')}\n\n` +
      `Total violations: ${results.violations.length}`;

    if (options.warnOnly) {
      console.warn('\n' + message + '\n');
    } else {
      throw new Error(message);
    }
  }
}