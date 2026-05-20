import { promises as fs } from 'fs';
export class BaseDocumentParser {
    constructor(filePath) {
        this.filePath = filePath;
        this.codeBlocks = [];
        this.originalContent = '';
    }
    async parse() {
        const content = await fs.readFile(this.filePath, 'utf8');
        this.originalContent = content;
        this.codeBlocks = await this.extractCodeBlocks(content);
        return this.codeBlocks;
    }
    getCodeBlocks() {
        return this.codeBlocks;
    }
    getOriginalContent() {
        return this.originalContent;
    }
}
