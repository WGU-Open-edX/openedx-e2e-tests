#!/usr/bin/env node

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import * as path from 'path';
import { MarkdownTestParser } from '../utils/markdown-test-parser';

async function findMarkdownFiles(dir: string): Promise<string[]> {
  const files = await fs.readdir(dir);
  const markdownFiles: string[] = [];

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = await fs.stat(fullPath);

    if (stat.isDirectory()) {
      const subFiles = await findMarkdownFiles(fullPath);
      markdownFiles.push(...subFiles);
    } else if (file.endsWith('.md')) {
      markdownFiles.push(fullPath);
    }
  }

  return markdownFiles;
}

async function runMarkdownTest(markdownFile: string, options: { headed?: boolean; project?: string } = {}): Promise<void> {
  const parser = new MarkdownTestParser(markdownFile);
  const codeBlocks = await parser.parseMarkdown();

  // Generate a temporary test file
  const testName = path.basename(markdownFile, '.md');
  const tempTestFile = path.join(__dirname, '..', 'tests', 'autodoc', `${testName}-temp.spec.ts`);

  const testContent = `
import { test, expect } from '@playwright/test';
import { AutodocTest } from '../../utils/autodoc';
import { LoginPage } from '../common/page-objects';
import { assertA11y } from '../common/a11y-helpers';
import { MarkdownTestParser } from '../../utils/markdown-test-parser';
import { promises as fs } from 'fs';

test.describe('${testName}', () => {
  test('markdown-driven test', async ({ page }, testInfo) => {
    const autodoc = new AutodocTest(page, "${testName}", {
      title: "${testName}",
      overview: "This documentation was generated from a markdown test file."
    });
    await autodoc.initialize();

    const loginPage = new LoginPage(page);
    const testResults: string[] = [];

${codeBlocks.map((block, index) => `
    // Execute code block ${index + 1}
    {
      const stepsBefore${index} = autodoc.steps.length;
      try {
        ${block.code}

        // Capture any new steps that were created
        const newSteps${index} = autodoc.steps.slice(stepsBefore${index});
        if (newSteps${index}.length > 0) {
          const step${index} = newSteps${index}[newSteps${index}.length - 1]; // Get the latest step

          // Use numbered step number for display when showNumber is true and numberedStepNumber exists
          const heading${index} = step${index}.showNumber !== false && step${index}.numberedStepNumber !== null
            ? \`### \${step${index}.numberedStepNumber}. \${step${index}.title}\\n\\n\`
            : \`### \${step${index}.title}\\n\\n\`;
          let stepMarkdown${index} = heading${index};

          if (step${index}.description) {
            stepMarkdown${index} += \`\${step${index}.description}\\n\\n\`;
          }
          if (step${index}.screenshot) {
            const altText${index} = step${index}.showNumber !== false && step${index}.numberedStepNumber !== null
              ? \`Step \${step${index}.numberedStepNumber}\`
              : step${index}.title;
            stepMarkdown${index} += \`![\${altText${index}}](\${step${index}.screenshot})\\n\\n\`;
          }
          if (step${index}.note) {
            stepMarkdown${index} += \`> **Note:** \${step${index}.note}\\n\\n\`;
          }
          testResults.push(stepMarkdown${index});
        } else {
          testResults.push('// Code executed successfully\\n');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        testResults.push(\`❌ **Error:** \${errorMessage}\\n\\n\`);
      }
    }
`).join('')}

    // Generate final documentation with original markdown + actual autodoc output
    const parser = new MarkdownTestParser('${markdownFile}');
    await parser.parseMarkdown();
    const finalMarkdown = await parser.createFinalMarkdown(testResults);

    // Write the final documentation
    const outputDir = autodoc['screenshotDir'];
    await fs.writeFile(outputDir + '/documentation.md', finalMarkdown);
    console.log('📄 Enhanced documentation generated with autodoc steps');
  });
});
`;

  // Write the temporary test file
  await fs.writeFile(tempTestFile, testContent);

  console.log(`🔄 Running markdown test: ${markdownFile}`);

  // Build command arguments
  const args = ['playwright', 'test', tempTestFile];
  if (options.headed) {
    args.push('--headed');
  }
  if (options.project) {
    args.push(`--project=${options.project}`);
  }

  // Run the test
  const playwright = spawn('npx', args, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  await new Promise<void>((resolve, reject) => {
    playwright.on('close', async (code) => {
      if (code === 0) {
        console.log('✅ Markdown test completed successfully!');
        // Clean up the temporary file on success
        try {
          await fs.unlink(tempTestFile);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          console.warn('Could not delete temporary test file:', errorMessage);
        }
        resolve();
      } else {
        console.log('❌ Markdown test failed');
        console.log(`🔍 Debug: Temp file preserved at: ${tempTestFile}`);
        console.log('🔍 Check the file to see what was generated');
        reject(new Error(`Test failed with code ${code}`));
      }
    });
  });
}

async function runMarkdownTests(input: string, options: { headed?: boolean; project?: string } = {}): Promise<void> {
  const stat = await fs.stat(input);

  if (stat.isDirectory()) {
    // Run all markdown files in directory
    const markdownFiles = await findMarkdownFiles(input);

    if (markdownFiles.length === 0) {
      console.log(`No markdown files found in ${input}`);
      return;
    }

    console.log(`📁 Found ${markdownFiles.length} markdown file(s) in ${input}`);

    for (const file of markdownFiles) {
      console.log(`\n📄 Running: ${path.relative(process.cwd(), file)}`);
      await runMarkdownTest(file, options);
    }
  } else {
    // Run single markdown file
    await runMarkdownTest(input, options);
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const input = args[0];

  if (!input) {
    console.log('Usage: node run-markdown-test.js <markdown-file-or-directory> [options]');
    console.log('Options:');
    console.log('  --headed           Run tests in headed mode');
    console.log('  --project=<name>   Run tests on specific project (e.g., chromium, firefox, webkit)');
    console.log('Examples:');
    console.log('  node run-markdown-test.js tests/autodoc/login-markdown.md');
    console.log('  node run-markdown-test.js tests/autodoc/ --headed --project=chromium');
    process.exit(1);
  }

  const options: { headed?: boolean; project?: string } = {};

  for (const arg of args.slice(1)) {
    if (arg === '--headed') {
      options.headed = true;
    } else if (arg.startsWith('--project=')) {
      options.project = arg.split('=')[1];
    }
  }

  runMarkdownTests(input, options).catch(console.error);
}

export { runMarkdownTest };