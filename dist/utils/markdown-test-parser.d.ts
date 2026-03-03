import type { CodeBlock } from '../types/markdown-test-parser.types';
export declare class MarkdownTestParser {
    private markdownPath;
    private codeBlocks;
    private originalContent;
    constructor(markdownPath: string);
    parseMarkdown(): Promise<CodeBlock[]>;
    createFinalMarkdown(testResults: string[]): Promise<string>;
}
//# sourceMappingURL=markdown-test-parser.d.ts.map