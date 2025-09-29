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

  async step(config) {
    // Support both object and legacy positional parameters
    let title, description, action, options;

    if (typeof config === 'string') {
      // Legacy positional parameters
      title = arguments[0];
      description = arguments[1] || null;
      action = arguments[2] || null;
      options = arguments[3] || {};
    } else {
      // New object-based parameters
      ({ title, description = null, action = null, ...options } = config);
    }

    const stepNumber = this.stepCounter++;
    const { screenshot = true } = options;

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
      note: null
    });

    const icon = screenshot ? '📸' : '📝';
    console.log(`${icon} Step ${stepNumber}: ${title}`);
  }

  async note(note) {
    // Add note to the last step
    if (this.steps.length > 0) {
      this.steps[this.steps.length - 1].note = note;
      console.log(`📌 Note added to Step ${this.steps.length}: ${note}`);
    } else {
      console.warn('No steps available to add note to');
    }
  }

  async screenshot(config) {
    // Support both object and legacy positional parameters
    let title, description, options;

    if (typeof config === 'string') {
      // Legacy positional parameters
      title = arguments[0];
      description = arguments[1] || null;
      options = arguments[2] || {};
    } else {
      // New object-based parameters
      ({ title, description = null, ...options } = config);
    }

    const stepNumber = this.stepCounter++;
    const { elementOnly = null, padding = 20 } = options;
    const screenshotName = `step-${stepNumber.toString().padStart(2, '0')}.png`;
    const screenshotPath = path.join(this.screenshotDir, screenshotName);

    // Wait for page to be fully loaded
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000); // Extra delay for content to render

    // Take screenshot based on elementOnly option
    if (elementOnly === true) {
      throw new Error('takeScreenshot requires a selector when elementOnly is true. Use a specific selector instead.');
    } else if (typeof elementOnly === 'string') {
      // Screenshot a specific element with padding
      const targetElement = this.page.locator(elementOnly);
      const elementBox = await targetElement.boundingBox();
      if (elementBox) {
        const viewport = await this.page.viewportSize();
        await this.page.screenshot({
          path: screenshotPath,
          clip: {
            x: Math.max(0, elementBox.x - padding),
            y: Math.max(0, elementBox.y - padding),
            width: Math.min(viewport.width - Math.max(0, elementBox.x - padding), elementBox.width + (2 * padding)),
            height: Math.min(viewport.height - Math.max(0, elementBox.y - padding), elementBox.height + (2 * padding))
          }
        });
      } else {
        // Fallback to element screenshot if bounding box fails
        await targetElement.screenshot({ path: screenshotPath });
      }
    } else {
      // Full page screenshot
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
    }

    this.steps.push({
      stepNumber,
      title,
      description,
      screenshot: screenshotName,
      note: null
    });

    console.log(`📸 Step ${stepNumber}: ${title}`);
  }

  async highlight(selector, action = null, options = {}) {
    const stepNumber = this.stepCounter++;
    const screenshotName = `step-${stepNumber.toString().padStart(2, '0')}.png`;
    const screenshotPath = path.join(this.screenshotDir, screenshotName);
    const { elementOnly = null, padding = 20 } = options;

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

    // Small delay to ensure highlight is fully rendered
    await this.page.waitForTimeout(500);

    // Take screenshot - full page, specific element, or custom selector
    if (elementOnly === true) {
      // Default behavior: screenshot the highlighted element with padding
      const elementBox = await this.page.locator(selector).boundingBox();
      if (elementBox) {
        await this.page.screenshot({
          path: screenshotPath,
          clip: {
            x: Math.max(0, elementBox.x - padding),
            y: Math.max(0, elementBox.y - padding),
            width: Math.min(await this.page.viewportSize().width - Math.max(0, elementBox.x - padding), elementBox.width + (2 * padding)),
            height: Math.min(await this.page.viewportSize().height - Math.max(0, elementBox.y - padding), elementBox.height + (2 * padding))
          }
        });
      } else {
        // Fallback to element screenshot if bounding box fails
        await this.page.locator(selector).screenshot({ path: screenshotPath });
      }
    } else if (typeof elementOnly === 'string') {
      // Custom selector: screenshot a different element with padding
      const targetElement = this.page.locator(elementOnly);
      const elementBox = await targetElement.boundingBox();
      if (elementBox) {
        const viewport = await this.page.viewportSize();
        await this.page.screenshot({
          path: screenshotPath,
          clip: {
            x: Math.max(0, elementBox.x - padding),
            y: Math.max(0, elementBox.y - padding),
            width: Math.min(viewport.width - Math.max(0, elementBox.x - padding), elementBox.width + (2 * padding)),
            height: Math.min(viewport.height - Math.max(0, elementBox.y - padding), elementBox.height + (2 * padding))
          }
        });
      } else {
        // Fallback to element screenshot if bounding box fails
        await targetElement.screenshot({ path: screenshotPath });
      }
    } else {
      // Full page screenshot
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

  async click(config) {
    // Support both object and legacy positional parameters
    let selector, title, description, options;

    if (typeof config === 'string') {
      // Legacy positional parameters
      selector = arguments[0];
      title = arguments[1];
      description = arguments[2] || null;
      options = arguments[3] || {};
    } else {
      // New object-based parameters
      ({ selector, title, description = null, ...options } = config);
    }

    const { stepNumber, screenshot } = await this.highlight(selector, async () => {
      await this.page.locator(selector).click();
    }, options);

    this.steps.push({
      stepNumber,
      title: title || `Click on ${selector}`,
      description,
      screenshot,
      note: null
    });

    console.log(`🖱️  Step ${stepNumber}: ${title || `Click on ${selector}`}`);
  }

  async fill(config) {
    // Support both object and legacy positional parameters
    let selector, value, title, description, options;

    if (typeof config === 'string') {
      // Legacy positional parameters
      selector = arguments[0];
      value = arguments[1];
      title = arguments[2];
      description = arguments[3] || null;
      options = arguments[4] || {};
    } else {
      // New object-based parameters
      ({ selector, value, title, description = null, ...options } = config);
    }

    const { stepNumber, screenshot } = await this.highlight(selector, async () => {
      await this.page.locator(selector).fill(value);
    }, options);

    this.steps.push({
      stepNumber,
      title: title || `Enter "${value}" in ${selector}`,
      description,
      screenshot,
      note: null
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