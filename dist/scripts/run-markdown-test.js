#!/usr/bin/env node
import { runDocTests } from './run-doc-test';
// CLI usage
if (require.main === module) {
    const args = process.argv.slice(2);
    const input = args[0];
    if (!input) {
        console.log('Usage: node run-markdown-test.js <markdown-file-or-directory> [options]');
        console.log('Options:');
        console.log('  --headed           Run tests in headed mode');
        console.log('  --project=<name>   Run tests on specific project (e.g., chromium, firefox, webkit)');
        console.log('Examples:');
        console.log('  node run-markdown-test.js tests/testdoc/login-markdown.md');
        console.log('  node run-markdown-test.js tests/testdoc/ --headed --project=chromium');
        process.exit(1);
    }
    const options = {};
    for (const arg of args.slice(1)) {
        if (arg === '--headed') {
            options.headed = true;
        }
        else if (arg.startsWith('--project=')) {
            [, options.project] = arg.split('=');
        }
    }
    runDocTests(input, ['.md'], options).catch(console.error);
}
