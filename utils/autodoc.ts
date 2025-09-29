import { promises as fs } from 'fs';
import * as path from 'path';
import { Page } from '@playwright/test';
import type {
  StepConfig,
  ScreenshotConfig,
  HighlightOptions,
  ClickConfig,
  FillConfig,
  RelatedTopic,
  AutodocOptions,
  Step
} from '../types/autodoc.types';

export class AutodocTest {
  private page: Page;
  private title: string;
  public steps: Step[];
  private screenshotDir: string;
  private stepCounter: number;
  private numberedStepCounter: number;
  private overview: string;
  private prerequisites: string[];
  private notes: string[];
  private relatedTopics: (string | RelatedTopic)[];
  private defaultShowNumbers: boolean;

  constructor(page: Page, testName: string, options: AutodocOptions = {}) {
    this.page = page;
    this.title = options.title || testName;
    this.steps = [];
    this.screenshotDir = path.join(process.cwd(), 'autodoc-output', testName);
    this.stepCounter = 1;
    this.numberedStepCounter = 1;
    this.overview = options.overview || '';
    this.prerequisites = options.prerequisites || [];
    this.notes = options.notes || [];
    this.relatedTopics = options.relatedTopics || [];
    this.defaultShowNumbers = options.showNumbers !== false;
  }

  async initialize(): Promise<void> {
    await fs.mkdir(this.screenshotDir, { recursive: true });
  }

  createSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
  }

  async step(config: StepConfig | string, description?: string | null, action?: (() => Promise<void>) | null, options?: Partial<StepConfig>): Promise<void> {
    let title: string;
    let desc: string | null;
    let act: (() => Promise<void>) | null;
    let opts: Partial<StepConfig>;

    if (typeof config === 'string') {
      title = config;
      desc = description ?? null;
      act = action ?? null;
      opts = options || {};
    } else {
      ({ title, description: desc = null, action: act = null, ...opts } = config);
    }

    const { screenshot = true, showNumber = this.defaultShowNumbers, skipNumber = false } = opts;
    const stepNumber = this.stepCounter++;
    const numberedStepNumber = skipNumber ? null : this.numberedStepCounter++;

    let screenshotName: string | null = null;

    if (screenshot) {
      const titleSlug = this.createSlug(title);
      const fileNumber = showNumber ? numberedStepNumber : stepNumber;
      screenshotName = `step-${fileNumber?.toString().padStart(2, '0')}-${titleSlug}.png`;
      const screenshotPath = path.join(this.screenshotDir, screenshotName);

      await this.page.waitForLoadState('networkidle');
      await this.page.waitForTimeout(1000);

      if (act) {
        await this.page.screenshot({ path: screenshotPath, fullPage: true });
        await act();
      } else {
        await this.page.screenshot({ path: screenshotPath, fullPage: true });
      }
    } else if (act) {
      await act();
    }

    this.steps.push({
      stepNumber,
      numberedStepNumber,
      title,
      description: desc,
      screenshot: screenshotName,
      note: null,
      showNumber
    });

    const displayNumber = showNumber && numberedStepNumber !== null ? numberedStepNumber : stepNumber;
    const icon = screenshot ? '📸' : '📝';
    console.log(`${icon} Step ${displayNumber}: ${title}`);
  }

  async note(note: string): Promise<void> {
    if (this.steps.length > 0) {
      this.steps[this.steps.length - 1].note = note;
      console.log(`📌 Note added to Step ${this.steps.length}: ${note}`);
    } else {
      console.warn('No steps available to add note to');
    }
  }

  async screenshot(config: ScreenshotConfig | string, description?: string | null, options?: Partial<ScreenshotConfig>): Promise<void> {
    let title: string;
    let desc: string | null;
    let opts: Partial<ScreenshotConfig>;

    if (typeof config === 'string') {
      title = config;
      desc = description ?? null;
      opts = options || {};
    } else {
      ({ title, description: desc = null, ...opts } = config);
    }

    const { elementOnly = null, padding = 20, showNumber = this.defaultShowNumbers, skipNumber = false } = opts;
    const stepNumber = this.stepCounter++;
    const numberedStepNumber = skipNumber ? null : this.numberedStepCounter++;
    const titleSlug = this.createSlug(title);
    const fileNumber = showNumber ? numberedStepNumber : stepNumber;
    const screenshotName = `step-${fileNumber?.toString().padStart(2, '0')}-${titleSlug}.png`;
    const screenshotPath = path.join(this.screenshotDir, screenshotName);

    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000);

    if (elementOnly === true) {
      throw new Error('takeScreenshot requires a selector when elementOnly is true. Use a specific selector instead.');
    } else if (typeof elementOnly === 'string') {
      const targetElement = this.page.locator(elementOnly);
      const elementBox = await targetElement.boundingBox();
      if (elementBox) {
        const viewport = this.page.viewportSize();
        if (viewport) {
          await this.page.screenshot({
            path: screenshotPath,
            clip: {
              x: Math.max(0, elementBox.x - padding),
              y: Math.max(0, elementBox.y - padding),
              width: Math.min(viewport.width - Math.max(0, elementBox.x - padding), elementBox.width + (2 * padding)),
              height: Math.min(viewport.height - Math.max(0, elementBox.y - padding), elementBox.height + (2 * padding))
            }
          });
        }
      } else {
        await targetElement.screenshot({ path: screenshotPath });
      }
    } else {
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
    }

    this.steps.push({
      stepNumber,
      numberedStepNumber,
      title,
      description: desc,
      screenshot: screenshotName,
      note: null,
      showNumber
    });

    const displayNumber = showNumber && numberedStepNumber !== null ? numberedStepNumber : stepNumber;
    console.log(`📸 Step ${displayNumber}: ${title}`);
  }

  async highlight(selector: string, action: (() => Promise<void>) | null = null, options: HighlightOptions = {}): Promise<{ stepNumber: number; numberedStepNumber: number | null; screenshot: string }> {
    const stepNumber = this.stepCounter++;
    const { elementOnly = null, padding = 20, title = `highlight-${selector}`, showNumber = this.defaultShowNumbers, skipNumber = false } = options;
    const numberedStepNumber = skipNumber ? null : this.numberedStepCounter++;
    const titleSlug = this.createSlug(title);
    const fileNumber = showNumber && numberedStepNumber !== null ? numberedStepNumber : stepNumber;
    const screenshotName = `step-${fileNumber.toString().padStart(2, '0')}-${titleSlug}.png`;
    const screenshotPath = path.join(this.screenshotDir, screenshotName);

    await this.page.locator(selector).waitFor({ state: 'visible', timeout: 10000 });

    await this.page.addStyleTag({
      content: `
        .autodoc-highlight {
          outline: 3px solid #ff6b35 !important;
          outline-offset: 2px !important;
          box-shadow: 0 0 10px rgba(255, 107, 53, 0.5) !important;
        }
      `
    });

    await this.page.locator(selector).evaluate(el => {
      el.classList.add('autodoc-highlight');
    });

    await this.page.waitForTimeout(500);

    if (elementOnly === true) {
      const elementBox = await this.page.locator(selector).boundingBox();
      if (elementBox) {
        const viewport = this.page.viewportSize();
        if (viewport) {
          await this.page.screenshot({
            path: screenshotPath,
            clip: {
              x: Math.max(0, elementBox.x - padding),
              y: Math.max(0, elementBox.y - padding),
              width: Math.min(viewport.width - Math.max(0, elementBox.x - padding), elementBox.width + (2 * padding)),
              height: Math.min(viewport.height - Math.max(0, elementBox.y - padding), elementBox.height + (2 * padding))
            }
          });
        }
      } else {
        await this.page.locator(selector).screenshot({ path: screenshotPath });
      }
    } else if (typeof elementOnly === 'string') {
      const targetElement = this.page.locator(elementOnly);
      const elementBox = await targetElement.boundingBox();
      if (elementBox) {
        const viewport = this.page.viewportSize();
        if (viewport) {
          await this.page.screenshot({
            path: screenshotPath,
            clip: {
              x: Math.max(0, elementBox.x - padding),
              y: Math.max(0, elementBox.y - padding),
              width: Math.min(viewport.width - Math.max(0, elementBox.x - padding), elementBox.width + (2 * padding)),
              height: Math.min(viewport.height - Math.max(0, elementBox.y - padding), elementBox.height + (2 * padding))
            }
          });
        }
      } else {
        await targetElement.screenshot({ path: screenshotPath });
      }
    } else {
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
    }

    await this.page.locator(selector).evaluate(el => {
      el.classList.remove('autodoc-highlight');
    });

    if (action) {
      await action();
    }

    return { stepNumber, numberedStepNumber, screenshot: screenshotName };
  }

  async click(config: ClickConfig | string, title?: string, description?: string | null, options?: Partial<ClickConfig>): Promise<void> {
    let selector: string;
    let titleStr: string;
    let desc: string | null;
    let opts: Partial<ClickConfig>;

    if (typeof config === 'string') {
      selector = config;
      titleStr = title!;
      desc = description ?? null;
      opts = options || {};
    } else {
      ({ selector, title: titleStr, description: desc = null, ...opts } = config);
    }

    const { showNumber = this.defaultShowNumbers, skipNumber = false } = opts;
    const numberedStepNumber = skipNumber ? null : this.numberedStepCounter++;
    const { stepNumber, screenshot } = await this.highlight(selector, async () => {
      await this.page.locator(selector).click();
    }, { ...opts, title: titleStr });

    this.steps.push({
      stepNumber,
      numberedStepNumber,
      title: titleStr || `Click on ${selector}`,
      description: desc,
      screenshot,
      note: null,
      showNumber
    });

    const displayNumber = showNumber && numberedStepNumber !== null ? numberedStepNumber : stepNumber;
    console.log(`🖱️  Step ${displayNumber}: ${titleStr || `Click on ${selector}`}`);
  }

  async fill(config: FillConfig | string, value?: string, title?: string, description?: string | null, options?: Partial<FillConfig>): Promise<void> {
    let selector: string;
    let val: string;
    let titleStr: string;
    let desc: string | null;
    let opts: Partial<FillConfig>;

    if (typeof config === 'string') {
      selector = config;
      val = value!;
      titleStr = title!;
      desc = description ?? null;
      opts = options || {};
    } else {
      ({ selector, value: val, title: titleStr, description: desc = null, ...opts } = config);
    }

    const { showNumber = this.defaultShowNumbers, skipNumber = false } = opts;
    const numberedStepNumber = skipNumber ? null : this.numberedStepCounter++;
    const { stepNumber, screenshot } = await this.highlight(selector, async () => {
      await this.page.locator(selector).fill(val);
    }, { ...opts, title: titleStr });

    this.steps.push({
      stepNumber,
      numberedStepNumber,
      title: titleStr || `Enter "${val}" in ${selector}`,
      description: desc,
      screenshot,
      note: null,
      showNumber
    });

    const displayNumber = showNumber && numberedStepNumber !== null ? numberedStepNumber : stepNumber;
    console.log(`⌨️  Step ${displayNumber}: ${titleStr || `Enter "${val}" in ${selector}`}`);
  }

  async generateMarkdown(): Promise<string> {
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
      const heading = step.showNumber !== false && step.numberedStepNumber !== null
        ? `### ${step.numberedStepNumber}. ${step.title}\n\n`
        : `### ${step.title}\n\n`;
      markdown += heading;

      if (step.description) {
        markdown += `${step.description}\n\n`;
      }
      if (step.screenshot) {
        const altText = step.showNumber !== false && step.numberedStepNumber !== null
          ? `Step ${step.numberedStepNumber}`
          : step.title;
        markdown += `![${altText}](${step.screenshot})\n\n`;
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

  async generateRST(): Promise<string> {
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
      const heading = step.showNumber !== false && step.numberedStepNumber !== null
        ? `${step.numberedStepNumber}. ${step.title}`
        : step.title;
      rst += `${heading}\n`;
      rst += '-'.repeat(heading.length) + '\n\n';

      if (step.description) {
        rst += `${step.description}\n\n`;
      }
      if (step.screenshot) {
        rst += `.. image:: ${step.screenshot}\n`;
        const altText = step.showNumber !== false && step.numberedStepNumber !== null
          ? `Step ${step.numberedStepNumber}`
          : step.title;
        rst += `   :alt: ${altText}\n\n`;
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