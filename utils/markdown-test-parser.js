const fs = require('fs').promises;

class MarkdownTestParser {
  constructor(markdownPath) {
    this.markdownPath = markdownPath;
    this.steps = [];
  }

  async parseMarkdown() {
    const content = await fs.readFile(this.markdownPath, 'utf8');
    this.originalContent = content; // Store original content
    const lines = content.split('\n');

    let codeBlocks = [];
    let inJsCodeBlock = false;
    let codeAccumulator = '';
    let blockStartLine = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Handle JavaScript code blocks
      if (line === '```js' || line === '```javascript') {
        // Start JavaScript code block
        inJsCodeBlock = true;
        blockStartLine = i;
        continue;
      } else if (line.startsWith('```') && inJsCodeBlock) {
        // End JavaScript code block
        codeBlocks.push({
          code: codeAccumulator.trim(),
          startLine: blockStartLine,
          endLine: i
        });
        codeAccumulator = '';
        inJsCodeBlock = false;
        continue;
      }

      // Accumulate JavaScript code
      if (inJsCodeBlock) {
        codeAccumulator += line + '\n';
      }
    }

    this.codeBlocks = codeBlocks;
    return codeBlocks; // Return code blocks instead of steps
  }

  // New method to create final markdown with test results
  async createFinalMarkdown(testResults) {
    const lines = this.originalContent.split('\n');
    let finalLines = [];
    let codeBlockIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check if this line starts a JavaScript code block we need to replace
      const codeBlock = this.codeBlocks.find(block => block.startLine === i);

      if (codeBlock) {
        // Replace the entire code block with actual autodoc output
        if (testResults[codeBlockIndex]) {
          finalLines.push(testResults[codeBlockIndex]);
        }
        // Skip to the end of the code block
        i = codeBlock.endLine;
        codeBlockIndex++;
      } else {
        // Keep original line
        finalLines.push(line);
      }
    }

    return finalLines.join('\n');
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