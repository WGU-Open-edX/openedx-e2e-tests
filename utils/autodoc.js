const fs = require('fs').promises;
const path = require('path');

class AutodocTest {
  constructor(page, testName, options = {}) {
    this.page = page;
    this.testName = testName;
    this.title = options.title || testName;
    this.steps = [];
    this.screenshotDir = path.join(process.cwd(), 'autodoc-output', testName);
    this.stepCounter = 1;
    this.overview = options.overview || '';
    this.prerequisites = options.prerequisites || [];
    this.notes = options.notes || [];
    this.relatedTopics = options.relatedTopics || [];
  }

  async initialize() {
    await fs.mkdir(this.screenshotDir, { recursive: true });
  }

  async addStep(title, description = null, action = null, options = {}) {
    const stepNumber = this.stepCounter++;
    const { screenshot = true, note = null } = options;

    let screenshotName = null;

    if (screenshot) {
      screenshotName = `step-${stepNumber.toString().padStart(2, '0')}.png`;
      const screenshotPath = path.join(this.screenshotDir, screenshotName);

      // Wait for page to be fully loaded
      await this.page.waitForLoadState('networkidle');
      await this.page.waitForTimeout(1000); // Extra delay for content to render

      // Take screenshot before action if specified
      if (action) {
        await this.page.screenshot({ path: screenshotPath, fullPage: true });
        await action();
      } else {
        await this.page.screenshot({ path: screenshotPath, fullPage: true });
      }
    } else if (action) {
      await action();
    }

    this.steps.push({
      stepNumber,
      title,
      description,
      screenshot: screenshotName,
      note
    });

    const icon = screenshot ? '📸' : '📝';
    console.log(`${icon} Step ${stepNumber}: ${title}`);
  }

  async highlightElement(selector, action = null, options = {}) {
    const stepNumber = this.stepCounter++;
    const screenshotName = `step-${stepNumber.toString().padStart(2, '0')}.png`;
    const screenshotPath = path.join(this.screenshotDir, screenshotName);
    const { elementOnly = false } = options;

    // Wait for element to be visible first
    await this.page.locator(selector).waitFor({ state: 'visible', timeout: 10000 });

    // Add highlight styling
    await this.page.addStyleTag({
      content: `
        .autodoc-highlight {
          outline: 3px solid #ff6b35 !important;
          outline-offset: 2px !important;
          box-shadow: 0 0 10px rgba(255, 107, 53, 0.5) !important;
        }
      `
    });

    // Highlight the element
    await this.page.locator(selector).evaluate(el => {
      el.classList.add('autodoc-highlight');
    });

    // Take screenshot - either full page or just the element
    if (elementOnly) {
      await this.page.locator(selector).screenshot({ path: screenshotPath });
    } else {
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
    }

    // Remove highlight
    await this.page.locator(selector).evaluate(el => {
      el.classList.remove('autodoc-highlight');
    });

    // Perform action if specified
    if (action) {
      await action();
    }

    return { stepNumber, screenshot: screenshotName };
  }

  async clickElement(selector, title, description = null, options = {}) {
    const { stepNumber, screenshot } = await this.highlightElement(selector, async () => {
      await this.page.locator(selector).click();
    }, options);

    this.steps.push({
      stepNumber,
      title: title || `Click on ${selector}`,
      description,
      screenshot,
      note: options.note || null
    });

    console.log(`🖱️  Step ${stepNumber}: ${title || `Click on ${selector}`}`);
  }

  async fillElement(selector, value, title, description = null, options = {}) {
    const { stepNumber, screenshot } = await this.highlightElement(selector, async () => {
      await this.page.locator(selector).fill(value);
    }, options);

    this.steps.push({
      stepNumber,
      title: title || `Enter "${value}" in ${selector}`,
      description,
      screenshot,
      note: options.note || null
    });

    console.log(`⌨️  Step ${stepNumber}: ${title || `Enter "${value}" in ${selector}`}`);
  }

  async generateMarkdown() {
    const markdownPath = path.join(this.screenshotDir, 'documentation.md');

    let markdown = `# ${this.title}\n\n`;

    if (this.overview) {
      markdown += `${this.overview}\n\n`;
    }

    if (this.prerequisites.length > 0) {
      markdown += `## Prerequisites\n\n`;
      markdown += `Before you begin, ensure that:\n\n`;
      for (const prereq of this.prerequisites) {
        markdown += `- ${prereq}\n`;
      }
      markdown += `\n`;
    }

    if (this.notes.length > 0) {
      for (const note of this.notes) {
        markdown += `> **Note:** ${note}\n\n`;
      }
    }

    markdown += `## Steps\n\n`;
    markdown += `To complete this process, follow these steps:\n\n`;

    for (const step of this.steps) {
      markdown += `### ${step.stepNumber}. ${step.title}\n\n`;
      if (step.description) {
        markdown += `${step.description}\n\n`;
      }
      if (step.screenshot) {
        markdown += `![Step ${step.stepNumber}](${step.screenshot})\n\n`;
      }
      if (step.note) {
        markdown += `> **Note:** ${step.note}\n\n`;
      }
    }

    if (this.relatedTopics.length > 0) {
      markdown += `## Related Topics\n\n`;
      for (const topic of this.relatedTopics) {
        if (typeof topic === 'string') {
          markdown += `- ${topic}\n`;
        } else {
          // Assume topic is an object with title and url
          markdown += `- [${topic.title}](${topic.url})\n`;
        }
      }
      markdown += `\n`;
    }

    markdown += `---\n\n`;
    markdown += `*This documentation was automatically generated during testing.*\n`;

    await fs.writeFile(markdownPath, markdown, 'utf8');
    console.log(`📄 Documentation generated: ${markdownPath}`);
    return markdownPath;
  }

  async generateRST() {
    const rstPath = path.join(this.screenshotDir, 'documentation.rst');

    let rst = `${this.title}\n`;
    rst += '='.repeat(this.title.length) + '\n\n';

    if (this.overview) {
      rst += `${this.overview}\n\n`;
    }

    if (this.prerequisites.length > 0) {
      rst += `Prerequisites\n`;
      rst += '='.repeat('Prerequisites'.length) + '\n\n';
      rst += `Before you begin, ensure that:\n\n`;
      for (const prereq of this.prerequisites) {
        rst += `- ${prereq}\n`;
      }
      rst += `\n`;
    }

    if (this.notes.length > 0) {
      for (const note of this.notes) {
        rst += `.. note:: ${note}\n\n`;
      }
    }

    rst += `Steps\n`;
    rst += '='.repeat('Steps'.length) + '\n\n';
    rst += `To complete this process, follow these steps:\n\n`;

    for (const step of this.steps) {
      rst += `${step.stepNumber}. ${step.title}\n`;
      rst += '-'.repeat(`${step.stepNumber}. ${step.title}`.length) + '\n\n';
      if (step.description) {
        rst += `${step.description}\n\n`;
      }
      if (step.screenshot) {
        rst += `.. image:: ${step.screenshot}\n`;
        rst += '   :alt: Step ' + step.stepNumber + '\n\n';
      }
      if (step.note) {
        rst += `.. note:: ${step.note}\n\n`;
      }
    }

    if (this.relatedTopics.length > 0) {
      rst += `Related Topics\n`;
      rst += '='.repeat('Related Topics'.length) + '\n\n';
      for (const topic of this.relatedTopics) {
        if (typeof topic === 'string') {
          rst += `- ${topic}\n`;
        } else {
          rst += `- \`${topic.title} <${topic.url}>\`_\n`;
        }
      }
      rst += `\n`;
    }

    rst += `----\n\n`;
    rst += `*This documentation was automatically generated during testing.*\n`;

    await fs.writeFile(rstPath, rst, 'utf8');
    console.log(`📄 RST Documentation generated: ${rstPath}`);
    return rstPath;
  }
}

module.exports = { AutodocTest };