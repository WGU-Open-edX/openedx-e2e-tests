import type { CodeBlock } from '../../types/markdown-test-parser.types';
import { BaseDocumentParser } from './base-parser';

export class RSTParser extends BaseDocumentParser {
  async extractCodeBlocks(content: string): Promise<CodeBlock[]> {
    const lines = content.split('\n');
    const codeBlocks: CodeBlock[] = [];
    let inTestdocCodeBlock = false;
    let codeAccumulator = '';
    let blockStartLine = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // RST code blocks start with .. code-block:: testdoc
      if (trimmedLine === '.. code-block:: testdoc') {
        inTestdocCodeBlock = true;
        blockStartLine = i;
        continue;
      }

      // RST code blocks end when indentation returns to original level or hits another directive
      if (inTestdocCodeBlock) {
        // Check if we've hit the end (unindented line or another directive)
        if (trimmedLine.length > 0 && !line.startsWith('   ') && !line.startsWith('\t')) {
          // End of code block
          codeBlocks.push({
            code: codeAccumulator.trim(),
            startLine: blockStartLine,
            endLine: i - 1,
          });
          codeAccumulator = '';
          inTestdocCodeBlock = false;
          // Don't skip this line, process it normally
          continue;
        }

        // Skip the blank line immediately after the directive
        if (i === blockStartLine + 1 && trimmedLine === '') {
          continue;
        }

        // Accumulate code (removing the indentation)
        if (line.startsWith('   ')) {
          codeAccumulator += `${line.substring(3)}\n`;
        } else if (line.startsWith('\t')) {
          codeAccumulator += `${line.substring(1)}\n`;
        } else if (trimmedLine === '') {
          // Preserve blank lines within code block
          codeAccumulator += '\n';
        }
      }
    }

    // Handle case where code block extends to end of file
    if (inTestdocCodeBlock && codeAccumulator.trim()) {
      codeBlocks.push({
        code: codeAccumulator.trim(),
        startLine: blockStartLine,
        endLine: lines.length - 1,
      });
    }

    return codeBlocks;
  }

  async createFinalDocument(testResults: string[]): Promise<string> {
    const lines = this.originalContent.split('\n');
    const finalLines: string[] = [];
    let codeBlockIndex = 0;
    let skipUntilLine = -1;

    for (let i = 0; i < lines.length; i++) {
      // Skip lines that are part of a replaced code block
      if (i <= skipUntilLine) {
        continue;
      }

      const line = lines[i];
      const codeBlock = this.codeBlocks.find(block => block.startLine === i);

      if (codeBlock) {
        // Replace the code block with test results
        if (testResults[codeBlockIndex]) {
          // Convert markdown output to RST format
          const rstOutput = this.convertMarkdownToRST(testResults[codeBlockIndex]);
          finalLines.push(rstOutput);
        }
        skipUntilLine = codeBlock.endLine;
        codeBlockIndex++;
      } else {
        finalLines.push(line);
      }
    }

    return finalLines.join('\n');
  }

  private convertMarkdownToRST(markdown: string): string {
    let rst = markdown;

    // Convert markdown headings to RST
    // ### Heading -> Heading\n--------
    rst = rst.replace(/^### (.+)$/gm, (match, heading) => {
      const underline = '-'.repeat(heading.length);
      return `${heading}\n${underline}`;
    });

    // Convert markdown images to RST
    // ![alt](image.png) -> .. image:: image.png\n   :alt: alt
    rst = rst.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
      return `.. image:: ${src}\n   :alt: ${alt}`;
    });

    // Convert markdown blockquotes to RST notes
    // > **Note:** text -> .. note::\n\n   text
    rst = rst.replace(/^> \*\*Note:\*\* (.+)$/gm, (match, text) => {
      return `.. note::\n\n   ${text}`;
    });

    return rst;
  }
}
