#!/usr/bin/env ts-node
/**
 * Script to convert regular Playwright tests to testdoc format
 *
 * Usage: ts-node scripts/convert-to-testdoc.ts <input-file> [output-file]
 *
 * Example: ts-node scripts/convert-to-testdoc.ts tests/test-1.spec.ts tests/test-1.testdoc.spec.ts
 */

import * as fs from 'fs';

interface ConversionOptions {
  title?: string;
  overview?: string;
  prerequisites?: string[];
  notes?: string[];
  relatedTopics?: Array<string | { title: string; url: string }>;
}

class PlaywrightToTestdocConverter {
  private source: string;

  private testName: string;

  private options: ConversionOptions;

  constructor(source: string, options: ConversionOptions = {}) {
    this.source = source;
    this.testName = 'Generated-Test-Documentation';
    this.options = options;
  }

  /**
   * Escape quotes in strings
   */
  private escapeQuotes(str: string): string {
    return str.replace(/'/g, "\\'");
  }

  /**
   * Main conversion method
   */
  convert(): string {
    let converted = this.addImports();
    converted += this.generateTestStructure();
    return converted;
  }

  /**
   * Add necessary imports for testdoc
   */
  private addImports(): string {
    return `import { test, expect } from '@playwright/test';
import { TestdocTest } from '../utils/testdoc';

`;
  }

  /**
   * Generate the test structure with testdoc
   */
  private generateTestStructure(): string {
    const lines = this.source.split('\n');
    const testBody: string[] = [];
    let inTest = false;
    let braceCount = 0;

    // Extract test body
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes("test('") || line.includes('test("')) {
        inTest = true;
        // Extract test name if possible
        const match = line.match(/test\(['"](.*?)['"],/);
        if (match) {
          this.testName = match[1].replace(/\s+/g, '-');
        }
        continue;
      }

      if (inTest) {
        // Skip the closing braces from original test structure
        if (line.trim() === '});' || line.trim() === '}') {
          braceCount += (line.match(/{/g) || []).length;
          braceCount -= (line.match(/}/g) || []).length;
          if (braceCount <= 0) {
            break;
          }
          continue;
        }

        braceCount += (line.match(/{/g) || []).length;
        braceCount -= (line.match(/}/g) || []).length;

        testBody.push(line);
      }
    }

    // Generate testdoc version
    let output = `test.describe('Testdoc: ${this.options.title || this.testName}', () => {\n`;
    output += '  test(\'generate documentation\', async ({ page }, testInfo) => {\n';
    output += this.generateTestdocInit();
    output += this.convertTestBody(testBody);
    output += '\n    // Generate documentation\n';
    output += '    await testdoc.generateMarkdown();\n';
    output += '    await testdoc.generateRST();\n';
    output += '  });\n';
    output += '});\n';

    return output;
  }

  /**
   * Generate testdoc initialization
   */
  private generateTestdocInit(): string {
    let init = `    const testdoc = new TestdocTest(page, '${this.testName}', {\n`;
    init += `      title: '${this.escapeQuotes(this.options.title || this.testName.replace(/-/g, ' '))}',\n`;

    if (this.options.overview) {
      init += `      overview: '${this.escapeQuotes(this.options.overview)}',\n`;
    }

    if (this.options.prerequisites && this.options.prerequisites.length > 0) {
      init += '      prerequisites: [\n';
      this.options.prerequisites.forEach(p => {
        init += `        '${this.escapeQuotes(p)}',\n`;
      });
      init += '      ],\n';
    }

    if (this.options.notes && this.options.notes.length > 0) {
      init += '      notes: [\n';
      this.options.notes.forEach(n => {
        init += `        '${this.escapeQuotes(n)}',\n`;
      });
      init += '      ],\n';
    }

    if (this.options.relatedTopics && this.options.relatedTopics.length > 0) {
      init += '      relatedTopics: [\n';
      this.options.relatedTopics.forEach(t => {
        if (typeof t === 'string') {
          init += `        '${this.escapeQuotes(t)}',\n`;
        } else {
          init += `        { title: '${this.escapeQuotes(t.title)}', url: '${t.url}' },\n`;
        }
      });
      init += '      ],\n';
    }

    init += '    });\n';
    init += '    await testdoc.initialize();\n\n';

    return init;
  }

  /**
   * Convert test body to testdoc format
   */
  private convertTestBody(lines: string[]): string {
    let output = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines
      if (!line) {
        output += '\n';
        continue;
      }

      // Look ahead: skip click if next line is fill on same element
      if (line.includes('.click()') && line.includes('getByRole')) {
        const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
        const currentRole = line.match(/getByRole\('([^']+)',\s*{\s*name:\s*'([^']+)'/);
        const nextRole = nextLine.match(/getByRole\('([^']+)',\s*{\s*name:\s*'([^']+)'/);

        if (currentRole && nextRole
            && currentRole[1] === nextRole[1]
            && currentRole[2] === nextRole[2]
            && nextLine.includes('.fill(')) {
          // Skip this click, the fill will handle it
          continue;
        }
      }

      // Handle page.goto
      if (line.includes('await page.goto(')) {
        const urlMatch = line.match(/goto\(['"](.*?)['"]\)/);
        const url = urlMatch ? urlMatch[1] : '';
        output += `    await page.goto('${url}');\n`;
        output += '    await testdoc.step({\n';
        output += `      title: 'Navigate to ${this.escapeQuotes(this.getPageTitle(url))}',\n`;
        output += `      description: 'Open the page at ${url}',\n`;
        output += '    });\n\n';
        continue;
      }

      // Handle getByRole().click()
      if (line.includes('.click()') && line.includes('getByRole')) {
        const roleMatch = line.match(/getByRole\('([^']+)',\s*{\s*name:\s*'([^']+)'/);
        if (roleMatch) {
          const [, role, name] = roleMatch;
          const selector = this.convertLocatorToSelector(line);
          const escapedName = this.escapeQuotes(name);
          output += '    await testdoc.click({\n';
          output += `      selector: '${selector}',\n`;
          output += `      title: 'Click "${escapedName}"',\n`;
          output += `      description: 'Click the ${role} labeled "${escapedName}"',\n`;
          output += '    });\n\n';
          continue;
        }
      }

      // Handle getByRole().fill()
      if (line.includes('.fill(') && line.includes('getByRole')) {
        const roleMatch = line.match(/getByRole\('([^']+)',\s*{\s*name:\s*'([^']+)'/);
        const fillMatch = line.match(/fill\(['"](.*?)['"]\)/);
        if (roleMatch && fillMatch) {
          const [, role, name] = roleMatch;
          const value = fillMatch[1];
          const selector = this.convertLocatorToSelector(line);
          const escapedName = this.escapeQuotes(name);
          const escapedValue = this.escapeQuotes(value);
          output += '    await testdoc.fill({\n';
          output += `      selector: '${selector}',\n`;
          output += `      value: '${escapedValue}',\n`;
          output += `      title: 'Enter text in "${escapedName}" field',\n`;
          output += `      description: 'Fill the ${role} field with the value',\n`;
          output += '    });\n\n';
          continue;
        }
      }

      // Handle download events - keep as-is
      if (line.includes('waitForEvent(\'download\')') || line.includes('= await downloadPromise')
          || line.includes('Promise') || line.includes('const download')) {
        output += `    ${line}\n`;
        continue;
      }

      // Handle press() - keep as-is (not easily convertible)
      if (line.includes('.press(')) {
        output += `    ${line}\n`;
        continue;
      }

      // Handle expect statements
      if (line.includes('await expect(')) {
        output += `    ${line}\n`;
        continue;
      }

      // Handle tab changes
      if (line.includes('getByRole(\'tab\'') && line.includes('.click()')) {
        const nameMatch = line.match(/name:\s*'([^']+)'/);
        if (nameMatch) {
          const tabName = nameMatch[1];
          const selector = this.convertLocatorToSelector(line);
          const escapedName = this.escapeQuotes(tabName);
          output += '    await testdoc.click({\n';
          output += `      selector: '${selector}',\n`;
          output += `      title: 'Switch to "${escapedName}" tab',\n`;
          output += `      description: 'Navigate to the ${escapedName} section',\n`;
          output += '    });\n\n';
          continue;
        }
      }

      // Pass through other lines as-is (with proper indentation)
      if (line.startsWith('await ') || line.startsWith('const ') || line.startsWith('page.')) {
        output += `    ${line}\n`;
      } else {
        output += `    ${line}\n`;
      }
    }

    return output;
  }

  /**
   * Convert Playwright locator to CSS selector
   * Uses :has-text() for most elements, which works well with Playwright
   */
  private convertLocatorToSelector(locatorLine: string): string {
    // Extract role and name
    const roleMatch = locatorLine.match(/getByRole\('([^']+)',\s*{\s*name:\s*'([^']+)'/);
    if (!roleMatch) {
      // Fallback for other locator types
      return 'FIXME-selector';
    }

    const [, role, name] = roleMatch;
    const escapedName = name.replace(/"/g, '\\"');

    // Convert based on role with sensible defaults
    switch (role) {
      case 'button':
        return `button:has-text("${escapedName}")`;
      case 'textbox':
        // For textboxes, we need manual inspection since they usually use name attributes
        // But provide a working fallback using placeholder
        return `input[placeholder*="${escapedName}"], input[aria-label="${escapedName}"]`;
      case 'link':
        return `a:has-text("${escapedName}")`;
      case 'tab':
        return `[role="tab"]:has-text("${escapedName}")`;
      case 'row':
        return `[role="row"]:has-text("${escapedName}")`;
      case 'cell':
        return `[role="cell"]:has-text("${escapedName}")`;
      case 'alert':
        return '[role="alert"]';
      case 'heading':
        return `h1:has-text("${escapedName}"), h2:has-text("${escapedName}"), h3:has-text("${escapedName}")`;
      default:
        return `[role="${role}"]:has-text("${escapedName}")`;
    }
  }

  /**
   * Extract page title from URL
   */
  private getPageTitle(url: string): string {
    const parts = url.split('/').filter(p => p);
    if (parts.length > 0) {
      return parts[parts.length - 1].replace(/_/g, ' ').replace(/-/g, ' ');
    }
    return 'page';
  }
}

/**
 * Main CLI function
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: ts-node scripts/convert-to-testdoc.ts <input-file> [output-file]');
    console.error('\nExample: ts-node scripts/convert-to-testdoc.ts tests/test-1.spec.ts tests/test-1.testdoc.spec.ts');
    process.exit(1);
  }

  const inputFile = args[0];
  const outputFile = args[1] || inputFile.replace('.spec.ts', '.testdoc.spec.ts');

  if (!fs.existsSync(inputFile)) {
    console.error(`Error: Input file not found: ${inputFile}`);
    process.exit(1);
  }

  const source = fs.readFileSync(inputFile, 'utf-8');

  // You can customize these options via command line or config file
  const options: ConversionOptions = {
    title: 'Instructor Data Downloads Test',
    overview: 'This guide demonstrates how to generate and download various reports from the instructor dashboard.',
    prerequisites: [
      'You have instructor access to an Open edX course',
      'You are logged in to the platform',
      'The course has enrolled students',
    ],
    notes: [
      'Reports may take a few moments to generate depending on course size.',
      'Some selectors may need manual adjustment for your specific application.',
    ],
  };

  const converter = new PlaywrightToTestdocConverter(source, options);
  const converted = converter.convert();

  fs.writeFileSync(outputFile, converted, 'utf-8');

  console.log('✅ Conversion complete!');
  console.log(`   Input:  ${inputFile}`);
  console.log(`   Output: ${outputFile}`);
  console.log('\n⚠️  Note: You may need to manually adjust selectors and step descriptions for accuracy.');
  console.log('   Look for \'selector-needs-manual-adjustment\' in the output file.');
}

// Run if called directly
if (require.main === module) {
  main();
}

export { PlaywrightToTestdocConverter, ConversionOptions };
