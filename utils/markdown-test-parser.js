const fs = require('fs').promises;

class MarkdownTestParser {
  constructor(markdownPath) {
    this.markdownPath = markdownPath;
    this.steps = [];
  }

  async parseMarkdown() {
    const content = await fs.readFile(this.markdownPath, 'utf8');
    const lines = content.split('\n');

    let currentStep = null;
    let inCodeBlock = false;
    let codeAccumulator = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for headings (steps)
      if (line.startsWith('#')) {
        if (currentStep) {
          this.steps.push(currentStep);
        }
        currentStep = {
          title: line.replace(/^#+\s*/, ''),
          description: '',
          code: '',
          level: (line.match(/^#+/) || [''])[0].length
        };
        continue;
      }

      // Check for code blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          // End code block
          if (currentStep) {
            currentStep.code = codeAccumulator.trim();
          }
          codeAccumulator = '';
          inCodeBlock = false;
        } else {
          // Start code block
          inCodeBlock = true;
        }
        continue;
      }

      // Accumulate content
      if (inCodeBlock) {
        codeAccumulator += line + '\n';
      } else if (currentStep && line.trim()) {
        // Add to description (skip empty lines)
        if (!line.startsWith('>')) { // Skip blockquotes for now
          currentStep.description += line + ' ';
        }
      }
    }

    // Add final step
    if (currentStep) {
      this.steps.push(currentStep);
    }

    return this.steps;
  }

  generatePlaywrightTest(testName) {
    const steps = this.steps;

    // Helper function to create a safe JavaScript string literal
    const toJSString = (str) => {
      return JSON.stringify(str);
    };

    let testCode =
`const { test, expect } = require('@playwright/test');
const { AutodocTest } = require('../utils/autodoc');
const { LoginPage } = require('./common/page-objects');

test.describe(${toJSString(testName)}, () => {
  test('generated from markdown', async ({ page }) => {
    const autodoc = new AutodocTest(page, ${toJSString(testName.replace(/\s+/g, '-'))}, {
      title: ${toJSString(steps[0]?.title || testName)}
    });
    await autodoc.initialize();

    const loginPage = new LoginPage(page);
`;

    steps.forEach((step) => {
      if (step.level <= 2) { // Only h1 and h2 as main steps
        testCode += '\n    // ' + step.title.replace(/\*/g, '') + '\n';
        testCode += '    await autodoc.step({\n';
        testCode += '      title: ' + toJSString(step.title) + ',\n';
        testCode += '      description: ' + toJSString(step.description.trim()) + ',\n';
        testCode += '      screenshot: false\n';
        testCode += '    });\n\n';
      }

      if (step.code) {
        testCode += `    ${step.code.replace(/\n/g, '\n    ')}\n`;
      }
    });

    testCode += `
    await autodoc.generateMarkdown();
    await autodoc.generateRST();
  });
});
`;

    return testCode;
  }
}

module.exports = { MarkdownTestParser };