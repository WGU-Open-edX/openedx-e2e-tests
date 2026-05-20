#!/usr/bin/env node
declare function runMarkdownTest(markdownFile: string, options?: {
    headed?: boolean;
    project?: string;
}): Promise<void>;
export { runMarkdownTest };
