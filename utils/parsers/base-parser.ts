import { promises as fs } from 'fs';
import type { CodeBlock } from '../../types/markdown-test-parser.types';

export abstract class BaseDocumentParser {
  protected filePath: string;

  protected codeBlocks: CodeBlock[];

  protected originalContent: string;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.codeBlocks = [];
    this.originalContent = '';
  }

  async parse(): Promise<CodeBlock[]> {
    const content = await fs.readFile(this.filePath, 'utf8');
    this.originalContent = content;
    this.codeBlocks = await this.extractCodeBlocks(content);
    return this.codeBlocks;
  }

  abstract extractCodeBlocks(content: string): Promise<CodeBlock[]>;

  abstract createFinalDocument(testResults: string[]): Promise<string>;

  getCodeBlocks(): CodeBlock[] {
    return this.codeBlocks;
  }

  getOriginalContent(): string {
    return this.originalContent;
  }
}
