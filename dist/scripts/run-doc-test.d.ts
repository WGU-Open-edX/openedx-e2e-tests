#!/usr/bin/env node
type FileExtension = '.md' | '.rst';
interface RunOptions {
    headed?: boolean;
    project?: string;
}
declare function runDocTest(docFile: string, options?: RunOptions): Promise<void>;
declare function runDocTests(input: string, extensions: FileExtension[], options?: RunOptions): Promise<void>;
export { runDocTest, runDocTests };
