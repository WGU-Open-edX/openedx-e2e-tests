#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { MarkdownTestParser } = require('../utils/markdown-test-parser');

async function findMarkdownFiles(dir) {
  const files = await fs.readdir(dir);
  const markdownFiles = [];

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

async function runMarkdownTest(markdownFile) {
  const parser = new MarkdownTestParser(markdownFile);
  const codeBlocks = await parser.parseMarkdown();

  // Generate a temporary test file
  const testName = path.basename(markdownFile, '.md');
  const tempTestFile = path.join(__dirname, '..', 'tests', 'autodoc', `${testName}-temp.spec.js`);

  const testContent = `
const { test, expect } = require('@playwright/test');
const { AutodocTest } = require('../../utils/autodoc');
const { LoginPage } = require('../common/page-objects');
const { MarkdownTestParser } = require('../../utils/markdown-test-parser');
const fs = require('fs').promises;

test.describe('${testName}', () => {
  test('markdown-driven test', async ({ page }) => {
    const autodoc = new AutodocTest(page, "${testName}", {
      title: "${testName}",
      overview: "This documentation was generated from a markdown test file."
    });
    await autodoc.initialize();

    const loginPage = new LoginPage(page);
    const testResults = [];

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
          let stepMarkdown${index} = \`### \${step${index}.stepNumber}. \${step${index}.title}\\n\\n\`;
          if (step${index}.description) {
            stepMarkdown${index} += \`\${step${index}.description}\\n\\n\`;
          }
          if (step${index}.screenshot) {
            stepMarkdown${index} += \`![Step \${step${index}.stepNumber}](\${step${index}.screenshot})\\n\\n\`;
          }
          if (step${index}.note) {
            stepMarkdown${index} += \`> **Note:** \${step${index}.note}\\n\\n\`;
          }
          testResults.push(stepMarkdown${index});
        } else {
          testResults.push('// Code executed successfully\\n');
        }
      } catch (error) {
        testResults.push(\`❌ **Error:** \${error.message}\\n\\n\`);
      }
    }
`).join('')}

    // Generate final documentation with original markdown + actual autodoc output
    const parser = new MarkdownTestParser('${markdownFile}');
    await parser.parseMarkdown();
    const finalMarkdown = await parser.createFinalMarkdown(testResults);

    // Write the final documentation
    const outputDir = autodoc.screenshotDir;
    await fs.writeFile(outputDir + '/documentation.md', finalMarkdown);
    console.log('📄 Enhanced documentation generated with autodoc steps');
  });
});
`;

  // Write the temporary test file
  await fs.writeFile(tempTestFile, testContent);

  console.log(`🔄 Running markdown test: ${markdownFile}`);

  // Run the test
  const playwright = spawn('npx', ['playwright', 'test', tempTestFile, '--headed', '--project=chromium'], {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  playwright.on('close', async (code) => {
    if (code === 0) {
      console.log('✅ Markdown test completed successfully!');
      // Clean up the temporary file on success
      try {
        await fs.unlink(tempTestFile);
      } catch (err) {
        console.warn('Could not delete temporary test file:', err.message);
      }
    } else {
      console.log('❌ Markdown test failed');
      console.log(`🔍 Debug: Temp file preserved at: ${tempTestFile}`);
      console.log('🔍 Check the file to see what was generated');
      process.exit(code);
    }
  });
}

async function runMarkdownTests(input) {
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
      await runMarkdownTest(file);
    }
  } else {
    // Run single markdown file
    await runMarkdownTest(input);
  }
}

// CLI usage
if (require.main === module) {
  const input = process.argv[2];
  if (!input) {
    console.log('Usage: node run-markdown-test.js <markdown-file-or-directory>');
    console.log('Examples:');
    console.log('  node run-markdown-test.js tests/autodoc/login-markdown.md  # Single file');
    console.log('  node run-markdown-test.js tests/autodoc/                   # All .md files in directory');
    process.exit(1);
  }

  runMarkdownTests(input).catch(console.error);
}

module.exports = { runMarkdownTest };