"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarkdownTestParser = void 0;
const fs_1 = require("fs");
class MarkdownTestParser {
    constructor(markdownPath) {
        this.markdownPath = markdownPath;
        this.codeBlocks = [];
        this.originalContent = '';
    }
    async parseMarkdown() {
        const content = await fs_1.promises.readFile(this.markdownPath, 'utf8');
        this.originalContent = content;
        const lines = content.split('\n');
        const codeBlocks = [];
        let inTestdocCodeBlock = false;
        let codeAccumulator = '';
        let blockStartLine = -1;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line === '```testdoc') {
                inTestdocCodeBlock = true;
                blockStartLine = i;
                continue;
            }
            else if (line.startsWith('```') && inTestdocCodeBlock) {
                codeBlocks.push({
                    code: codeAccumulator.trim(),
                    startLine: blockStartLine,
                    endLine: i,
                });
                codeAccumulator = '';
                inTestdocCodeBlock = false;
                continue;
            }
            if (inTestdocCodeBlock) {
                codeAccumulator += `${line}\n`;
            }
        }
        this.codeBlocks = codeBlocks;
        return codeBlocks;
    }
    async createFinalMarkdown(testResults) {
        const lines = this.originalContent.split('\n');
        const finalLines = [];
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
            }
            else {
                finalLines.push(line);
            }
        }
        return finalLines.join('\n');
    }
}
exports.MarkdownTestParser = MarkdownTestParser;
//# sourceMappingURL=markdown-test-parser.js.map