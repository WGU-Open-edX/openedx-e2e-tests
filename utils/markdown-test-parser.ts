import { promises as fs } from 'fs';

interface CodeBlock {
  code: string;
  startLine: number;
  endLine: number;
}

interface ParsedStep {
  title: string;
  description: string;
  code?: string;
  level: number;
}

export class MarkdownTestParser {
  private markdownPath: string;
  private steps: ParsedStep[];
  private codeBlocks: CodeBlock[];
  private originalContent: string;

  constructor(markdownPath: string) {
    this.markdownPath = markdownPath;
    this.steps = [];
    this.codeBlocks = [];
    this.originalContent = '';
  }

  async parseMarkdown(): Promise<CodeBlock[]> {
    const content = await fs.readFile(this.markdownPath, 'utf8');
    this.originalContent = content;
    const lines = content.split('\n');

    const codeBlocks: CodeBlock[] = [];
    let inJsCodeBlock = false;
    let codeAccumulator = '';
    let blockStartLine = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line === '```js' || line === '```javascript') {
        inJsCodeBlock = true;
        blockStartLine = i;
        continue;
      } else if (line.startsWith('```') && inJsCodeBlock) {
        codeBlocks.push({
          code: codeAccumulator.trim(),
          startLine: blockStartLine,
          endLine: i
        });
        codeAccumulator = '';
        inJsCodeBlock = false;
        continue;
      }

      if (inJsCodeBlock) {
        codeAccumulator += line + '\n';
      }
    }

    this.codeBlocks = codeBlocks;
    return codeBlocks;
  }

  async createFinalMarkdown(testResults: string[]): Promise<string> {
    const lines = this.originalContent.split('\n');
    const finalLines: string[] = [];
    let codeBlockIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const codeBlock = this.codeBlocks.find(block => block.startLine === i);

      if (codeBlock) {
        if (testResults[codeBlockIndex]) {
          finalLines.push(testResults[codeBlockIndex]);
        }
        i = codeBlock.endLine;
        codeBlockIndex++;
      } else {
        finalLines.push(line);
      }
    }

    return finalLines.join('\n');
  }

  generatePlaywrightTest(testName: string): string {
    const steps = this.steps;

    const toJSString = (str: string): string => {
      return JSON.stringify(str);
    };

    let testCode =
`import { test, expect } from '@playwright/test';
import { AutodocTest } from '../utils/autodoc';
import { LoginPage } from './common/page-objects';

test.describe(${toJSString(testName)}, () => {
  test('generated from markdown', async ({ page }) => {
    const autodoc = new AutodocTest(page, ${toJSString(testName.replace(/\s+/g, '-'))}, {
      title: ${toJSString(steps[0]?.title || testName)}
    });
    await autodoc.initialize();

    const loginPage = new LoginPage(page);
`;

    steps.forEach((step) => {
      if (step.level <= 2) {
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