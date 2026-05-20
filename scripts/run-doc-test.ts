#!/usr/bin/env node

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import * as path from 'path';
import { BaseDocumentParser } from '../utils/parsers/base-parser';
import { MarkdownParser } from '../utils/parsers/markdown-parser';
import { RSTParser } from '../utils/parsers/rst-parser';

type FileExtension = '.md' | '.rst';

interface RunOptions {
  headed?: boolean;
  project?: string;
}

function getParserForFile(filePath: string): BaseDocumentParser {
  const ext = path.extname(filePath) as FileExtension;

  switch (ext) {
    case '.md':
      return new MarkdownParser(filePath);
    case '.rst':
      return new RSTParser(filePath);
    default:
      throw new Error(`Unsupported file extension: ${ext}. Supported formats: .md, .rst`);
  }
}

async function findDocumentFiles(dir: string, extensions: FileExtension[]): Promise<string[]> {
  const files = await fs.readdir(dir);
  const docFiles: string[] = [];

  for (const file of files) {
    /* eslint-disable no-await-in-loop */
    const fullPath = path.join(dir, file);
    const stat = await fs.stat(fullPath);

    if (stat.isDirectory()) {
      const subFiles = await findDocumentFiles(fullPath, extensions);
      docFiles.push(...subFiles);
    } else if (extensions.some(ext => file.endsWith(ext))) {
      docFiles.push(fullPath);
    }
  }

  return docFiles;
}

async function runDocTest(
  docFile: string,
  options: RunOptions = {},
): Promise<void> {
  const parser = getParserForFile(docFile);
  const codeBlocks = await parser.parse();

  // Generate a temporary test file
  const testName = path.basename(docFile, path.extname(docFile));
  const tempTestFile = path.join(__dirname, '..', 'tests', 'testdoc', `${testName}-temp.spec.ts`);

  const testContent = `
import { test, expect } from '@playwright/test';
import { TestdocTest } from '../../utils/testdoc';
import { LoginPage } from '../common/page-objects';
import { assertA11y } from '../common/a11y-helpers';
import { BaseDocumentParser } from '../../utils/parsers/base-parser';
import { MarkdownParser } from '../../utils/parsers/markdown-parser';
import { RSTParser } from '../../utils/parsers/rst-parser';
import { promises as fs } from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Load test credentials from environment
const TEST_USERNAME = process.env.TEST_USER_USERNAME || 'testuser';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'password';

function getParserForFile(filePath: string): BaseDocumentParser {
  const ext = path.extname(filePath);

  switch (ext) {
    case '.md':
      return new MarkdownParser(filePath);
    case '.rst':
      return new RSTParser(filePath);
    default:
      throw new Error(\`Unsupported file extension: \${ext}\`);
  }
}

test.describe('${testName}', () => {
  test('document-driven test', async ({ page }, testInfo) => {

    const testdoc = new TestdocTest(page, "${testName}", {
      title: "${testName}",
      overview: "This documentation was generated from a document-driven test file."
    });
    await testdoc.initialize();

    const loginPage = new LoginPage(page);
    const testResults: string[] = [];

${codeBlocks.map((block, index) => `
    // Execute code block ${index + 1}
    {
      const stepsBefore${index} = testdoc.steps.length;
      try {
        ${block.code}

        // Capture any new steps that were created
        const newSteps${index} = testdoc.steps.slice(stepsBefore${index});
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

    // Generate final documentation with original content + actual testdoc output
    const parser = getParserForFile('${docFile}');
    await parser.parse();
    const finalDoc = await parser.createFinalDocument(testResults);

    // Write the final documentation
    const outputDir = testdoc['screenshotDir'];
    const ext = path.extname('${docFile}');
    const outputFile = ext === '.rst' ? 'documentation.rst' : 'documentation.md';
    await fs.writeFile(path.join(outputDir, outputFile), finalDoc);
    console.log('📄 Enhanced documentation generated with testdoc steps');
  });
});
`;

  // Write the temporary test file
  await fs.writeFile(tempTestFile, testContent);

  console.log(`🔄 Running document test: ${docFile}`);

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
    cwd: path.join(__dirname, '..'),
  });

  await new Promise<void>((resolve, reject) => {
    playwright.on('close', async code => {
      if (code === 0) {
        console.log('✅ Document test completed successfully!');
        // Clean up the temporary file on success
        try {
          await fs.unlink(tempTestFile);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          console.warn('Could not delete temporary test file:', errorMessage);
        }
        resolve();
      } else {
        console.log('❌ Document test failed');
        console.log(`🔍 Debug: Temp file preserved at: ${tempTestFile}`);
        console.log('🔍 Check the file to see what was generated');
        reject(new Error(`Test failed with code ${code}`));
      }
    });
  });
}

async function runDocTests(
  input: string,
  extensions: FileExtension[],
  options: RunOptions = {},
): Promise<void> {
  const stat = await fs.stat(input);

  if (stat.isDirectory()) {
    // Run all document files in directory
    const docFiles = await findDocumentFiles(input, extensions);

    if (docFiles.length === 0) {
      console.log(`No ${extensions.join(', ')} files found in ${input}`);
      return;
    }

    console.log(`📁 Found ${docFiles.length} document file(s) in ${input}`);

    for (const file of docFiles) {
      console.log(`\n📄 Running: ${path.relative(process.cwd(), file)}`);
      await runDocTest(file, options);
    }
  } else {
    // Run single document file
    await runDocTest(input, options);
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const input = args[0];

  if (!input) {
    console.log('Usage: node run-doc-test.js <doc-file-or-directory> [options]');
    console.log('Options:');
    console.log('  --headed           Run tests in headed mode');
    console.log('  --project=<name>   Run tests on specific project (e.g., chromium, firefox, webkit)');
    console.log('Examples:');
    console.log('  node run-doc-test.js tests/testdoc/login.md');
    console.log('  node run-doc-test.js tests/testdoc/login.rst');
    console.log('  node run-doc-test.js tests/testdoc/ --headed --project=chromium');
    process.exit(1);
  }

  const options: RunOptions = {};

  for (const arg of args.slice(1)) {
    if (arg === '--headed') {
      options.headed = true;
    } else if (arg.startsWith('--project=')) {
      [, options.project] = arg.split('=');
    }
  }

  // Auto-detect format or run both
  const ext = path.extname(input) as FileExtension;
  const extensions: FileExtension[] = ext ? [ext] : ['.md', '.rst'];

  runDocTests(input, extensions, options).catch(console.error);
}

export { runDocTest, runDocTests };
