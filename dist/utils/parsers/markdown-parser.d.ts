import type { CodeBlock } from '../../types/markdown-test-parser.types';
import { BaseDocumentParser } from './base-parser';
export declare class MarkdownParser extends BaseDocumentParser {
    extractCodeBlocks(content: string): Promise<CodeBlock[]>;
    createFinalDocument(testResults: string[]): Promise<string>;
}
//# sourceMappingURL=markdown-parser.d.ts.map