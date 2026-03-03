import { promises as fs } from 'fs';
import type { CodeBlock } from './types/markdown-test-parser.types';

export class MarkdownTestParser {
  private markdownPath: string;
  private codeBlocks: CodeBlock[];
  private originalContent: string;

  constructor(markdownPath: string) {
    this.markdownPath = markdownPath;
    this.codeBlocks = [];
    this.originalContent = '';
  }

  async parseMarkdown(): Promise<CodeBlock[]> {
    const content = await fs.readFile(this.markdownPath, 'utf8');
    this.originalContent = content;
    const lines = content.split('\n');

    const codeBlocks: CodeBlock[] = [];
    let inTestdocCodeBlock = false;
    let codeAccumulator = '';
    let blockStartLine = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line === '```testdoc') {
        inTestdocCodeBlock = true;
        blockStartLine = i;
        continue;
      } else if (line.startsWith('```') && inTestdocCodeBlock) {
        codeBlocks.push({
          code: codeAccumulator.trim(),
          startLine: blockStartLine,
          endLine: i
        });
        codeAccumulator = '';
        inTestdocCodeBlock = false;
        continue;
      }

      if (inTestdocCodeBlock) {
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
}