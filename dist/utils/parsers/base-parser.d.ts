import type { CodeBlock } from '../../types/markdown-test-parser.types';
export declare abstract class BaseDocumentParser {
    protected filePath: string;
    protected codeBlocks: CodeBlock[];
    protected originalContent: string;
    constructor(filePath: string);
    parse(): Promise<CodeBlock[]>;
    abstract extractCodeBlocks(content: string): Promise<CodeBlock[]>;
    abstract createFinalDocument(testResults: string[]): Promise<string>;
    getCodeBlocks(): CodeBlock[];
    getOriginalContent(): string;
}
//# sourceMappingURL=base-parser.d.ts.map