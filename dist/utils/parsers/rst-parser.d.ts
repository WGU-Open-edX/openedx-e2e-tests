import type { CodeBlock } from '../../types/markdown-test-parser.types';
import { BaseDocumentParser } from './base-parser';
export declare class RSTParser extends BaseDocumentParser {
    extractCodeBlocks(content: string): Promise<CodeBlock[]>;
    createFinalDocument(testResults: string[]): Promise<string>;
    private convertMarkdownToRST;
}
//# sourceMappingURL=rst-parser.d.ts.map